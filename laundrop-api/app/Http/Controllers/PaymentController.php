<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Transaction;
use App\Services\MidtransService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    private ?MidtransService $midtrans = null;

    public function __construct(
        private NotificationService $notifService
    ) {}

    private function midtrans(): MidtransService
    {
        if ($this->midtrans instanceof MidtransService) {
            return $this->midtrans;
        }

        $this->midtrans = app(MidtransService::class);
        return $this->midtrans;
    }

    // ─── POST /api/payments/create ────────────────────────────────────────────
    // Customer buat payment link (QRIS via Midtrans)

    public function adminIndex(Request $request): JsonResponse
    {
        $status = strtolower((string) $request->query('status', 'all'));
        $method = strtolower((string) $request->query('method', 'all'));
        $search = trim((string) $request->query('search', ''));
        $perPage = max(1, min(100, (int) $request->query('per_page', 15)));

        $query = Transaction::query()
            ->with([
                'order:id,order_number,customer_id,pickup_date,payment_method',
                'order.customer:id,name',
                'payment:id,transaction_id,payment_method,status,paid_at',
            ])
            ->whereHas('order')
            ->latest();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('order', function ($orderQuery) use ($search) {
                    $orderQuery->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($customerQuery) => $customerQuery->where('name', 'like', "%{$search}%"));
                });
            });
        }

        if ($method !== 'all') {
            $query->where(function ($builder) use ($method) {
                $builder
                    ->whereHas('payment', fn ($paymentQuery) => $paymentQuery->where('payment_method', $method))
                    ->orWhere(function ($sub) use ($method) {
                        $sub->whereDoesntHave('payment')
                            ->whereHas('order', fn ($orderQuery) => $orderQuery->where('payment_method', $method));
                    });
            });
        }

        if ($status === 'paid') {
            $query->whereHas('payment', fn ($paymentQuery) => $paymentQuery->where('status', Payment::STATUS_PAID));
        } elseif ($status === 'unpaid') {
            $query->where(function ($builder) {
                $builder->whereDoesntHave('payment')
                    ->orWhereHas('payment', fn ($paymentQuery) => $paymentQuery->where('status', '!=', Payment::STATUS_PAID));
            });
        }

        $summaryBaseQuery = clone $query;
        $totalTransactions = (clone $summaryBaseQuery)->count();
        $totalPaid = (clone $summaryBaseQuery)
            ->whereHas('payment', fn ($paymentQuery) => $paymentQuery->where('status', Payment::STATUS_PAID))
            ->sum('total_amount');
        $totalUnpaid = (clone $summaryBaseQuery)
            ->where(function ($builder) {
                $builder->whereDoesntHave('payment')
                    ->orWhereHas('payment', fn ($paymentQuery) => $paymentQuery->where('status', '!=', Payment::STATUS_PAID));
            })
            ->sum('total_amount');

        $transactions = $query->paginate($perPage);

        $transactions->getCollection()->transform(function (Transaction $transaction) {
            $payment = $transaction->payment;
            $order = $transaction->order;
            $isPaid = $payment?->status === Payment::STATUS_PAID;

            return [
                'id' => $transaction->id,
                'order_id' => $order?->order_number,
                'customer_name' => $order?->customer?->name,
                'amount' => (float) $transaction->total_amount,
                'status' => $isPaid ? 'paid' : 'unpaid',
                'payment_status' => $payment?->status ?? 'unpaid',
                'method' => strtolower((string) ($payment?->payment_method ?: $order?->payment_method ?: 'cash')),
                'date' => optional($order?->pickup_date)?->format('Y-m-d'),
            ];
        });

        return $this->success([
            'items' => $transactions,
            'summary' => [
                'total_paid' => (float) $totalPaid,
                'total_unpaid' => (float) $totalUnpaid,
                'total_transactions' => (int) $totalTransactions,
            ],
        ]);
    }

    public function markPaid(Request $request, int $transactionId): JsonResponse
    {
        $transaction = Transaction::with(['order', 'payment'])->findOrFail($transactionId);

        if ($transaction->payment?->status === Payment::STATUS_PAID) {
            return $this->success($transaction->payment, 'Pembayaran sudah berstatus lunas');
        }

        $paymentMethod = strtolower((string) ($transaction->payment?->payment_method ?: $transaction->order?->payment_method ?: Payment::METHOD_CASH));
        if (! in_array($paymentMethod, [Payment::METHOD_CASH, Payment::METHOD_QRIS], true)) {
            $paymentMethod = Payment::METHOD_CASH;
        }

        $payment = Payment::updateOrCreate(
            ['transaction_id' => $transaction->id],
            [
                'payment_method' => $paymentMethod,
                'status' => Payment::STATUS_PAID,
                'paid_at' => now(),
            ]
        );

        if ($transaction->order && $transaction->order->status === Order::STATUS_WAITING_PAYMENT) {
            $transaction->order->update(['status' => Order::STATUS_WASHING]);
            $this->notifService->send(
                userId: $transaction->order->customer_id,
                orderId: $transaction->order->id,
                type: 'payment_success',
                title: 'Pembayaran Berhasil',
                body: "Pembayaran pesanan #{$transaction->order->order_number} telah dikonfirmasi."
            );
        }

        return $this->success($payment, 'Pembayaran berhasil dikonfirmasi');
    }

    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|exists:transactions,id',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $transaction = Transaction::with(['order.customer', 'payment'])->findOrFail($request->transaction_id);

        // Pastikan customer hanya bisa bayar pesanannya sendiri
        if ($request->user()->isCustomer() && $transaction->order->customer_id !== $request->user()->id) {
            return $this->error('Akses ditolak', 403);
        }

        // Jika sudah ada payment pending, kembalikan URL yang sama
        if ($transaction->payment && $transaction->payment->status === Payment::STATUS_PENDING) {
            return $this->success([
                'payment_url' => $transaction->payment->payment_url,
            ], 'Gunakan link pembayaran yang sudah ada');
        }

        $midtransOrderId = 'LD-PAY-' . $transaction->id . '-' . time();

        // Buat QRIS di Midtrans
        try {
            $paymentUrl = $this->midtrans()->createQris(
                orderId:      $midtransOrderId,
                amount:       (int) $transaction->total_amount,
                customerName: $transaction->order->customer->name,
                customerEmail:$transaction->order->customer->email,
            );
        } catch (\Throwable $e) {
            Log::error('Midtrans create payment error', ['error' => $e->getMessage()]);
            return $this->error('Layanan pembayaran Midtrans belum tersedia. Hubungi admin.', 500);
        }

        $payment = Payment::create([
            'transaction_id'    => $transaction->id,
            'payment_method'    => $transaction->order->payment_method,
            'status'            => Payment::STATUS_PENDING,
            'midtrans_order_id' => $midtransOrderId,
            'payment_url'       => $paymentUrl,
        ]);

        return $this->success([
            'payment'     => $payment,
            'payment_url' => $paymentUrl,
        ], 'Link pembayaran berhasil dibuat');
    }

    // ─── POST /api/payments/webhook ───────────────────────────────────────────
    // Webhook dari Midtrans — TANPA middleware auth

    public function webhook(Request $request): JsonResponse
    {
        // Verifikasi signature dari Midtrans
        try {
            $notification = $this->midtrans()->parseNotification($request->all());
        } catch (\Throwable $e) {
            Log::error('Midtrans webhook init error', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Midtrans service unavailable'], 500);
        }

        if (! $notification) {
            Log::warning('Midtrans webhook: invalid signature', $request->all());
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $payment = Payment::where('midtrans_order_id', $notification['order_id'])->first();

        if (! $payment) {
            Log::warning('Midtrans webhook: payment not found', ['order_id' => $notification['order_id']]);
            return response()->json(['message' => 'Payment not found'], 404);
        }

        $transactionStatus = $notification['transaction_status'];
        $fraudStatus       = $notification['fraud_status'] ?? null;

        if ($transactionStatus === 'settlement' || ($transactionStatus === 'capture' && $fraudStatus === 'accept')) {
            $payment->markAsPaid($notification['transaction_id']);

            // Pembayaran digital sukses -> otomatis masuk proses cuci
            $order = $payment->transaction->order;
            $order->update(['status' => Order::STATUS_WASHING]);

            // Notifikasi customer
            $this->notifService->send(
                userId:  $order->customer_id,
                orderId: $order->id,
                type:    'payment_success',
                title:   'Pembayaran Berhasil',
                body:    "Pembayaran pesanan #{$order->order_number} telah dikonfirmasi."
            );
        } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
            $payment->update(['status' => Payment::STATUS_FAILED]);
        }

        return response()->json(['message' => 'OK']);
    }

    // ─── GET /api/payments/{transactionId} ────────────────────────────────────
    // Detail transaksi + status pembayaran

    public function show(Request $request, int $transactionId): JsonResponse
    {
        $transaction = Transaction::with([
            'order:id,order_number,customer_id,status',
            'payment',
        ])->findOrFail($transactionId);

        if ($request->user()->isCustomer() && $transaction->order->customer_id !== $request->user()->id) {
            return $this->error('Akses ditolak', 403);
        }

        return $this->success($transaction);
    }

    // ─── POST /api/payments/{id}/proof ───────────────────────────────────────
    // Upload bukti bayar cash

    public function uploadProof(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'proof' => 'required|image|max:5120',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $payment = Payment::findOrFail($id);
        $path    = $request->file('proof')->store("payments/{$id}", 'public');

        $payment->update([
            'proof_path' => $path,
            'status'     => Payment::STATUS_PAID,
            'paid_at'    => now(),
        ]);

        // Cash proof di-approve -> lanjut proses cuci
        $payment->transaction->order->update(['status' => Order::STATUS_WASHING]);

        return $this->success(['proof_path' => $path], 'Bukti pembayaran berhasil diupload');
    }

    // ─── POST /api/orders/{orderId}/generate-qris ─────────────────────────────
    // Generate dynamic QRIS untuk order tertentu
    public function generateQris(Request $request, $orderId): JsonResponse
    {
        try {
            $order = Order::with(['service', 'customer', 'transaction'])->findOrFail($orderId);

            // Pastikan customer hanya bisa request QRIS pesanannya sendiri
            if ($request->user()->isCustomer() && $order->customer_id !== $request->user()->id) {
                return $this->error('Akses ditolak', 403);
            }

            // Check if order status valid untuk payment
            if (!in_array($order->status, ['waiting_payment', 'waiting_confirmation'])) {
                return $this->error('Status order tidak memungkinkan pembayaran', 422);
            }

            // Calculate amount
            $amount = $order->transaction?->total_amount ?? 0;
            if ($amount <= 0) {
                $estimatedWeight = $order->estimated_weight ?? 0;
                $pricePerKg = $order->service?->price_per_kg ?? 0;
                $amount = (int)($estimatedWeight * $pricePerKg);
            }

            if ($amount <= 0) {
                return $this->error('Nominal pembayaran tidak valid', 422);
            }

            try {
                // Generate QRIS via Core API dengan dynamic nominal
                $qrisResult = $this->midtrans()->generateDynamicQris(
                    orderId: $order->order_number,
                    amount: $amount,
                    customerName: $order->customer->name,
                    customerEmail: $order->customer->email
                );

                if (!$qrisResult['success']) {
                    throw new \Exception('Gagal generate QRIS dari Midtrans');
                }
            } catch (\Exception $midtransError) {
                // Fallback: generate mock QRIS untuk testing
                Log::warning('Midtrans failed, using mock QRIS', ['error' => $midtransError->getMessage()]);
                
                $qrisResult = [
                    'success'         => true,
                    'qr_string'       => "00020126360014ID.CO.MIDTRANS01051A7B001000100" . str_pad(uniqid(), 20, '0', STR_PAD_LEFT),
                    'transaction_id'  => 'mock-' . $order->order_number . '-' . time(),
                    'gross_amount'    => $amount,
                    'status'          => 'pending',
                ];
            }

            // Save atau update transaction dengan Midtrans data
            if (!$order->transaction) {
                $order->transaction()->create([
                    'gross_amount'              => $qrisResult['gross_amount'],
                    'total_amount'              => $qrisResult['gross_amount'],
                    'payment_method'            => 'qris',
                    'midtrans_transaction_id'   => $qrisResult['transaction_id'],
                    'status'                    => 'pending',
                ]);
            } else {
                $order->transaction->update([
                    'midtrans_transaction_id'   => $qrisResult['transaction_id'],
                    'status'                    => 'pending',
                    'total_amount'              => $qrisResult['gross_amount'],
                ]);
            }

            Log::info('QRIS generated', [
                'order_id'      => $order->id,
                'order_number'  => $order->order_number,
                'transaction_id'=> $qrisResult['transaction_id'],
                'amount'        => $qrisResult['gross_amount'],
            ]);

            return $this->success([
                'order_id'        => $order->id,
                'order_number'    => $order->order_number,
                'qr_string'       => $qrisResult['qr_string'],
                'transaction_id'  => $qrisResult['transaction_id'],
                'gross_amount'    => $qrisResult['gross_amount'],
                'status'          => $qrisResult['status'],
                'expires_in'      => '24 jam',
            ], 'QRIS berhasil dibuat');
        } catch (\Exception $e) {
            Log::error('generateQris error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->error('Terjadi kesalahan: ' . $e->getMessage(), 500);
        }
    }

    // ─── GET /api/orders/{orderId}/payment-status ──────────────────────────────
    // Check status pembayaran dari Midtrans
    public function checkPaymentStatus(Request $request, $orderId): JsonResponse
    {
        try {
            $order = Order::with('transaction')->findOrFail($orderId);

            // Pastikan customer hanya bisa check status pesanannya sendiri
            if ($request->user()->isCustomer() && $order->customer_id !== $request->user()->id) {
                return $this->error('Akses ditolak', 403);
            }

            if (!$order->transaction?->midtrans_transaction_id) {
                return $this->error('QRIS belum di-generate', 404);
            }

            // Check if it's a mock QRIS (for testing)
            $isMockQris = strpos($order->transaction->midtrans_transaction_id, 'mock-') === 0;

            if ($isMockQris) {
                // For mock QRIS, return pending status
                // In real scenario, this would check Midtrans
                return $this->success([
                    'transaction_status' => 'pending',
                    'payment_status'     => 'pending',
                    'order_status'       => $order->status,
                    'gross_amount'       => $order->transaction->total_amount,
                ], 'Status pembayaran (simulasi)');
            }

            // Get status dari Midtrans
            $status = $this->midtrans()->getTransactionStatus($order->order_number);

            if (!$status) {
                return $this->error('Gagal check status ke Midtrans', 500);
            }

            // Update transaction jika ada perubahan status
            if ($status['status'] === 'settlement' || $status['status'] === 'capture') {
                $order->transaction->update([
                    'status' => 'success',
                ]);

                // Update order status ke next step (washing)
                if ($order->status === 'waiting_payment') {
                    $order->update(['status' => 'washing']);
                    
                    // Kirim notifikasi ke customer
                    $this->notifService->send(
                        userId:  $order->customer_id,
                        orderId: $order->id,
                        type:    'payment_success',
                        title:   'Pembayaran Berhasil',
                        body:    "Pembayaran pesanan #{$order->order_number} telah dikonfirmasi."
                    );
                }

                Log::info('Payment verified via status check', ['order_id' => $order->id]);
            }

            return $this->success([
                'transaction_status' => $status['status'],
                'payment_status'     => $order->transaction->status ?? 'pending',
                'order_status'       => $order->status,
                'gross_amount'       => $status['gross_amount'],
            ], 'Status pembayaran');
        } catch (\Exception $e) {
            Log::error('checkPaymentStatus error', ['error' => $e->getMessage()]);
            return $this->error('Terjadi kesalahan', 500);
        }
    }

    // ─── POST /api/webhooks/midtrans ────────────────────────────────────────────
    // Webhook endpoint untuk Midtrans notification (PUBLIC - no auth required)
    public function webhookMidtrans(Request $request): JsonResponse
    {
        try {
            $payload = $request->all();

            Log::info('Midtrans webhook received', $payload);

            // Verify signature
            if (!$this->midtrans()->verifyNotification($payload)) {
                Log::warning('Midtrans webhook signature invalid', ['payload' => $payload]);
                return response()->json(['status' => 'invalid_signature'], 403);
            }

            $orderId = $payload['order_id'] ?? null;
            $status  = $payload['transaction_status'] ?? null;

            if (!$orderId || !$status) {
                return response()->json(['status' => 'missing_data'], 400);
            }

            // Find order by order_number
            $order = Order::where('order_number', $orderId)->first();

            if (!$order) {
                Log::warning('Order not found for webhook', ['order_id' => $orderId]);
                return response()->json(['status' => 'order_not_found'], 404);
            }

            // Handle status
            if ($status === 'settlement' || $status === 'capture') {
                // Payment success
                if ($order->transaction) {
                    $order->transaction->update(['status' => 'success']);
                }
                
                if ($order->status === 'waiting_payment') {
                    $order->update(['status' => 'washing']);
                    
                    // Kirim notifikasi ke customer
                    $this->notifService->send(
                        userId:  $order->customer_id,
                        orderId: $order->id,
                        type:    'payment_success',
                        title:   'Pembayaran Berhasil',
                        body:    "Pembayaran pesanan #{$order->order_number} telah dikonfirmasi."
                    );
                }

                Log::info('Payment success via webhook', ['order_id' => $orderId, 'status' => $status]);
            } elseif ($status === 'cancel' || $status === 'deny') {
                // Payment failed
                if ($order->transaction) {
                    $order->transaction->update(['status' => 'failed']);
                }
                Log::info('Payment failed/cancelled via webhook', ['order_id' => $orderId, 'status' => $status]);
            } elseif ($status === 'pending') {
                // Still waiting
                if ($order->transaction) {
                    $order->transaction->update(['status' => 'pending']);
                }
            }

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            Log::error('Midtrans webhook error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }
}
