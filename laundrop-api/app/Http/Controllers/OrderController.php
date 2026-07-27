<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Models\Payment;
use App\Models\Transaction;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    private const LAUNDRY_LAT = -7.0715116551644055;
    private const LAUNDRY_LNG = 110.41728959200246;
    private const DELIVERY_FEE_PER_KM_TIER = 3000;

    public function __construct(private NotificationService $notifService) {}

    // ─── GET /api/orders ──────────────────────────────────────────────────────
    // Customer: pesanan milik sendiri
    // Employee: semua pesanan aktif
    // Owner:    semua pesanan

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Order::with([
            'customer:id,name,phone',
            'service:id,name,price_per_kg',
            'employee:id,name',
            'transaction.payment',
        ])
            ->latest();

        if ($user->isCustomer()) {
            $query->forCustomer($user->id);
        } elseif ($user->isEmployee()) {
            // Employee lihat pesanan yang belum selesai / ditugaskan ke dia
            $query->where(function ($q) use ($user) {
                $q->whereNull('employee_id')
                  ->orWhere('employee_id', $user->id);
            })->active();
        }
        // Owner lihat semua

        $perPage = max(1, min(100, (int) $request->query('per_page', 15)));
        $orders = $query->paginate($perPage);

        return $this->success($orders);
    }

    // ─── POST /api/orders ─────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_type'       => 'required|in:pickup,drop_off',
            'service_id'       => 'required|exists:services,id',
            'pickup_address'   => 'required|string|max:500',
            'pickup_lat'       => 'required|numeric|between:-90,90',
            'pickup_lng'       => 'required|numeric|between:-180,180',
            'pickup_date'      => 'required|date|after_or_equal:today',
            'pickup_time'      => 'required|date_format:H:i',
            'delivery_address' => 'required|string|max:500',
            'delivery_lat'     => 'nullable|numeric|between:-90,90',
            'delivery_lng'     => 'nullable|numeric|between:-180,180',
            'estimated_weight' => 'required|numeric|min:0.1|max:100',
            'payment_method'   => 'required|in:cash,qris',
            'notes'            => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $feeLat = $request->order_type === 'drop_off'
            ? (float) ($request->delivery_lat ?? $request->pickup_lat)
            : (float) $request->pickup_lat;
        $feeLng = $request->order_type === 'drop_off'
            ? (float) ($request->delivery_lng ?? $request->pickup_lng)
            : (float) $request->pickup_lng;

        $deliveryDistanceKm = $this->calculateDistanceKm(
            self::LAUNDRY_LAT,
            self::LAUNDRY_LNG,
            $feeLat,
            $feeLng,
        );

        $order = Order::create([
            ...$validator->validated(),
            'customer_id' => $request->user()->id,
            'status'      => Order::STATUS_WAITING_CONFIRMATION,
            'delivery_distance_km' => $deliveryDistanceKm,
            'delivery_fee' => $this->calculateTieredDeliveryFee($deliveryDistanceKm),
        ]);

        $order->load(['service:id,name,price_per_kg']);

        // Kirim notifikasi ke customer
        $this->notifService->send(
            userId:  $request->user()->id,
            orderId: $order->id,
            type:    'order_created',
            title:   'Pesanan Berhasil Dibuat',
            body:    "Pesanan #{$order->order_number} sedang menunggu konfirmasi karyawan."
        );

        return $this->success($order, 'Pesanan berhasil dibuat', 201);
    }

    // ─── GET /api/orders/{id} ─────────────────────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::with([
            'customer:id,name,phone,email',
            'employee:id,name,phone',
            'service',
            'statusLogs.changedBy:id,name',
            'transaction.payment',
        ])->findOrFail($id);

        // Customer hanya bisa lihat pesanan miliknya
        if ($request->user()->isCustomer() && $order->customer_id !== $request->user()->id) {
            return $this->error('Akses ditolak', 403);
        }

        return $this->success($order);
    }

    // ─── PATCH /api/orders/{id}/status ───────────────────────────────────────
    // Digunakan oleh employee (dan owner) untuk update status

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string',
            'notes'  => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $order = Order::findOrFail($id);
        $newStatus = $request->status;

        if (! $order->canUpdateStatus($newStatus)) {
            return $this->error("Tidak dapat mengubah status dari '{$order->status}' ke '{$newStatus}'", 422);
        }

        $order->loadMissing('transaction.payment');
        $paymentStatus = strtolower((string) optional(optional($order->transaction)->payment)->status);
        $isPaid = $paymentStatus === Payment::STATUS_PAID;
        $isNonCash = strtolower((string) $order->payment_method) !== Order::PAYMENT_CASH;

        if ($newStatus === Order::STATUS_DELIVERY && $isNonCash && ! $isPaid) {
            return $this->error('Order non-cash hanya bisa masuk pengantaran setelah pembayaran lunas', 422);
        }

        if ($newStatus === Order::STATUS_COMPLETED && ! $isPaid) {
            if (! $isNonCash) {
                return $this->error('Order cash hanya bisa selesai setelah pembayaran dikonfirmasi saat pengantaran', 422);
            }

            return $this->error('Order hanya bisa selesai setelah pembayaran lunas', 422);
        }

        $oldStatus = $order->status;

        // Assign employee jika belum ada saat konfirmasi
        if ($newStatus === Order::STATUS_PICKUP && ! $order->employee_id) {
            $order->employee_id = $request->user()->id;
        }

        $order->status = $newStatus;

        if ($newStatus === Order::STATUS_CANCELLED) {
            $order->cancelled_at = now();
        }

        $order->save();

        // Catat log status
        OrderStatusLog::create([
            'order_id'      => $order->id,
            'changed_by'    => $request->user()->id,
            'status_before' => $oldStatus,
            'status_after'  => $newStatus,
            'notes'         => $request->notes,
        ]);

        // Kirim notifikasi ke customer
        $this->notifService->sendStatusUpdate($order, $newStatus);

        return $this->success($order, 'Status pesanan berhasil diperbarui');
    }

    // ─── POST /api/orders/{id}/bill ─────────────────────────────────────────
    // Employee/Owner input berat real + (opsional) upload foto timbangan

    public function bill(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'actual_weight' => 'required|numeric|min:0.1|max:100',
            'notes'         => 'nullable|string|max:500',
            'photo_scale'   => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $order = Order::with('service:id,price_per_kg')->findOrFail($id);

        if ($order->status !== Order::STATUS_PICKED_UP) {
            return $this->error('Tagihan hanya bisa dibuat setelah status pakaian_diambil', 422);
        }

        $actualWeight = (float) $request->actual_weight;
        $pricePerKg = (float) ($order->service->price_per_kg ?? 0);
        $subtotal = Transaction::calculateSubtotal($actualWeight, $pricePerKg);
        $deliveryFee = (int) ($order->delivery_fee ?? 0);
        $totalAmount = round($subtotal + $deliveryFee, 2);

        $transaction = Transaction::updateOrCreate(
            ['order_id' => $order->id],
            [
                'actual_weight' => $actualWeight,
                'price_per_kg'  => $pricePerKg,
                'subtotal'      => $subtotal,
                'total_amount'  => $totalAmount,
            ]
        );

        $updatePayload = [
            'actual_weight' => $actualWeight,
            'status'        => Order::STATUS_WAITING_PAYMENT,
        ];

        if ($request->hasFile('photo_scale')) {
            $updatePayload['photo_scale'] = $request->file('photo_scale')->store("orders/{$order->id}", 'public');
        }

        $oldStatus = $order->status;
        $order->update($updatePayload);

        OrderStatusLog::create([
            'order_id'      => $order->id,
            'changed_by'    => $request->user()->id,
            'status_before' => $oldStatus,
            'status_after'  => Order::STATUS_WAITING_PAYMENT,
            'notes'         => $request->notes ?? 'Berat real diinput manual dan tagihan dibuat',
        ]);

        $this->notifService->sendStatusUpdate($order->fresh(), Order::STATUS_WAITING_PAYMENT);

        return $this->success($transaction->load('payment'), 'Tagihan berhasil dibuat secara manual');
    }

    // ─── POST /api/orders/{id}/confirm-cash-payment ───────────────────────
    // Konfirmasi pembayaran cash saat pengantaran + opsional foto bukti

    public function confirmCashPayment(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes'          => 'nullable|string|max:500',
            'photo_delivery' => 'nullable|image|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $order = Order::with('transaction.payment')->findOrFail($id);

        if (strtolower((string) $order->payment_method) !== Order::PAYMENT_CASH) {
            return $this->error('Konfirmasi ini hanya untuk order dengan metode cash', 422);
        }

        if ($order->status !== Order::STATUS_DELIVERY) {
            return $this->error('Pembayaran cash hanya bisa dikonfirmasi saat status dalam pengantaran', 422);
        }

        $transaction = $order->transaction;
        if (! $transaction) {
            return $this->error('Tagihan belum tersedia untuk order ini', 422);
        }

        $proofPath = null;
        if ($request->hasFile('photo_delivery')) {
            $proofPath = $request->file('photo_delivery')->store("orders/{$order->id}", 'public');
        }

        Payment::updateOrCreate(
            ['transaction_id' => $transaction->id],
            array_filter([
                'payment_method' => Payment::METHOD_CASH,
                'status'         => Payment::STATUS_PAID,
                'paid_at'        => now(),
                'proof_path'     => $proofPath,
            ], static fn ($value) => $value !== null)
        );

        $oldStatus = $order->status;
        $updatePayload = ['status' => Order::STATUS_COMPLETED];
        if ($proofPath) {
            $updatePayload['photo_delivery'] = $proofPath;
        }
        $order->update($updatePayload);

        OrderStatusLog::create([
            'order_id'      => $order->id,
            'changed_by'    => $request->user()->id,
            'status_before' => $oldStatus,
            'status_after'  => Order::STATUS_COMPLETED,
            'notes'         => $request->notes ?? 'Pembayaran cash diterima saat pengantaran',
        ]);

        $this->notifService->sendStatusUpdate($order->fresh(), Order::STATUS_COMPLETED);

        return $this->success($order->fresh(['transaction.payment']), 'Pembayaran cash dikonfirmasi dan pesanan selesai');
    }

    private function calculateDistanceKm(float $fromLat, float $fromLng, float $toLat, float $toLng): float
    {
        $earthRadiusKm = 6371;
        $dLat = deg2rad($toLat - $fromLat);
        $dLng = deg2rad($toLng - $fromLng);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($fromLat)) * cos(deg2rad($toLat)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadiusKm * $c, 2);
    }

    private function calculateTieredDeliveryFee(float $distanceKm): int
    {
        if ($distanceKm < 0) {
            return 0;
        }

        $tierCount = max(1, (int) ceil($distanceKm));
        return $tierCount * self::DELIVERY_FEE_PER_KM_TIER;
    }

    // ─── PATCH /api/orders/{id}/cancel ───────────────────────────────────────
    // Hanya customer, hanya saat status waiting_confirmation

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = Order::forCustomer($request->user()->id)->findOrFail($id);

        if (! $order->isCancellable()) {
            return $this->error('Pesanan tidak dapat dibatalkan karena sudah diproses', 422);
        }

        $oldStatus = $order->status;
        $order->update([
            'status'       => Order::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);

        OrderStatusLog::create([
            'order_id'      => $order->id,
            'changed_by'    => $request->user()->id,
            'status_before' => $oldStatus,
            'status_after'  => Order::STATUS_CANCELLED,
            'notes'         => 'Dibatalkan oleh customer',
        ]);

        return $this->success(null, 'Pesanan berhasil dibatalkan');
    }

    // ─── PATCH /api/orders/{id}/assign ───────────────────────────────────────
    // Owner assign employee ke order

    public function assign(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $employee = User::findOrFail($request->employee_id);

        if (! $employee->isEmployee()) {
            return $this->error('User yang dipilih bukan karyawan', 422);
        }

        $order = Order::findOrFail($id);
        $order->update(['employee_id' => $request->employee_id]);

        return $this->success($order, 'Karyawan berhasil di-assign ke pesanan ini');
    }

    // ─── POST /api/orders/{id}/photos ─────────────────────────────────────────
    // Upload foto (pickup/scale/delivery)

    public function uploadPhoto(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type'  => 'required|in:pickup,scale,delivery',
            'photo' => 'required|image|max:5120', // max 5MB
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $order = Order::findOrFail($id);

        $field = 'photo_' . $request->type;
        $path  = $request->file('photo')->store("orders/{$id}", 'public');

        $order->update([$field => $path]);

        return $this->success(['path' => $path], 'Foto berhasil diupload');
    }
}
