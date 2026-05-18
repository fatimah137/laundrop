<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function __construct(private NotificationService $notifService) {}

    // ─── GET /api/orders ──────────────────────────────────────────────────────
    // Customer: pesanan milik sendiri
    // Employee: semua pesanan aktif
    // Owner:    semua pesanan

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Order::with(['customer:id,name,phone', 'service:id,name,price_per_kg', 'employee:id,name'])
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

        $orders = $query->paginate(15);

        return $this->success($orders);
    }

    // ─── POST /api/orders ─────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'service_id'       => 'required|exists:services,id',
            'pickup_address'   => 'required|string|max:500',
            'pickup_lat'       => 'required|numeric|between:-90,90',
            'pickup_lng'       => 'required|numeric|between:-180,180',
            'pickup_date'      => 'required|date|after_or_equal:today',
            'pickup_time'      => 'required|date_format:H:i',
            'estimated_weight' => 'required|numeric|min:0.1|max:100',
            'payment_method'   => 'required|in:cash,qris',
            'notes'            => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $order = Order::create([
            ...$validator->validated(),
            'customer_id' => $request->user()->id,
            'status'      => Order::STATUS_PENDING,
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
            'latestOcrScan',
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

        $oldStatus = $order->status;

        // Assign employee jika belum ada saat konfirmasi
        if ($newStatus === Order::STATUS_CONFIRMED && ! $order->employee_id) {
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

    // ─── PATCH /api/orders/{id}/cancel ───────────────────────────────────────
    // Hanya customer, hanya saat status pending

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
