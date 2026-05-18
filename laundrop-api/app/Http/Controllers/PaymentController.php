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
    public function __construct(
        private MidtransService    $midtrans,
        private NotificationService $notifService
    ) {}

    // ─── POST /api/payments/create ────────────────────────────────────────────
    // Customer buat payment link (QRIS via Midtrans)

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
        $paymentUrl = $this->midtrans->createQris(
            orderId:     $midtransOrderId,
            amount:      (int) $transaction->total_amount,
            customerName: $transaction->order->customer->name,
            customerEmail: $transaction->order->customer->email,
        );

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
        $notification = $this->midtrans->parseNotification($request->all());

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

            // Update status order → paid
            $order = $payment->transaction->order;
            $order->update(['status' => Order::STATUS_PAID]);

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
            'status'     => Payment::STATUS_SUCCESS,
            'paid_at'    => now(),
        ]);

        // Update status order
        $payment->transaction->order->update(['status' => Order::STATUS_PAID]);

        return $this->success(['proof_path' => $path], 'Bukti pembayaran berhasil diupload');
    }
}
