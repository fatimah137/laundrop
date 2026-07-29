<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MidtransService
{
    public function __construct()
    {
        // Pastikan sudah install: composer require midtrans/midtrans-php
        \Midtrans\Config::$serverKey    = config('services.midtrans.server_key');
        \Midtrans\Config::$clientKey    = config('services.midtrans.client_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
        \Midtrans\Config::$isSanitized  = true;
        \Midtrans\Config::$is3ds        = true;
    }

    /**
     * Buat QRIS via Midtrans Snap.
     * Mengembalikan URL halaman pembayaran Snap.
     */
    public function createQris(string $orderId, int $amount, string $customerName, string $customerEmail): string
    {
        $params = [
            'transaction_details' => [
                'order_id'     => $orderId,
                'gross_amount' => $amount,
            ],
            'customer_details' => [
                'first_name' => $customerName,
                'email'      => $customerEmail,
            ],
            'enabled_payments' => ['qris'],
            'expiry'           => [
                'unit'     => 'hours',
                'duration' => 24,
            ],
        ];

        $snapToken = \Midtrans\Snap::getSnapToken($params);

        // Return Snap URL
        $baseUrl = config('services.midtrans.is_production')
            ? 'https://app.midtrans.com/snap/v2/vtweb/'
            : 'https://app.sandbox.midtrans.com/snap/v2/vtweb/';

        return $baseUrl . $snapToken;
    }

    /**
     * Generate dynamic QRIS via Core API
     * Returns barcode string yang bisa ditampilkan di frontend
     */
    public function generateDynamicQris(string $orderId, int $amount, string $customerName, string $customerEmail): array
    {
        try {
            $params = [
                'payment_type' => 'qris',
                'qris'         => [
                    'acquirer' => 'gopay', // Support multi-acquirer GoPay, LinkAja, DANA, OVO
                ],
                'transaction_details' => [
                    'order_id'     => $orderId,
                    'gross_amount' => $amount,
                ],
                'customer_details' => [
                    'first_name' => $customerName,
                    'email'      => $customerEmail,
                    'phone'      => '-',
                ],
                'expiry' => [
                    'unit'     => 'hours',
                    'duration' => 24,
                ],
            ];

            // Call Midtrans Core API
            $response = \Midtrans\CoreApi::charge($params);

            if ($response->status_code == '201' || $response->status_code == '200') {
                return [
                    'success'           => true,
                    'transaction_id'    => $response->transaction_id,
                    'qr_string'         => $response->qr_string,       // QR barcode string
                    'status'            => $response->transaction_status,
                    'gross_amount'      => $response->gross_amount,
                    'expiry_time'       => $response->expiry_time ?? null,
                ];
            } else {
                return [
                    'success' => false,
                    'error'   => $response->status_message ?? 'Unknown error',
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Midtrans generateDynamicQris error', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }

    /**
     * Get transaction status dari Midtrans
     */
    public function getTransactionStatus(string $orderId): ?array
    {
        try {
            $response = \Midtrans\CoreApi::status($orderId);
            
            return [
                'order_id'       => $response->order_id,
                'transaction_id' => $response->transaction_id,
                'status'         => $response->transaction_status,
                'gross_amount'   => $response->gross_amount,
                'settlement_time'=> $response->settlement_time ?? null,
                'fraud_status'   => $response->fraud_status ?? null,
                'payment_type'   => $response->payment_type ?? null,
            ];
        } catch (\Throwable $e) {
            Log::error('Midtrans getTransactionStatus error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Verifikasi webhook notification dari Midtrans
     */
    public function verifyNotification(array $payload): bool
    {
        $orderId      = $payload['order_id'] ?? '';
        $statusCode   = $payload['status_code'] ?? '';
        $grossAmount  = $payload['gross_amount'] ?? '';
        $serverKey    = config('services.midtrans.server_key');
        $signatureKey = $payload['signature_key'] ?? '';

        // Hash formula: order_id + status_code + gross_amount + server_key
        $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        return hash_equals($signatureKey, $expectedSignature);
    }
}
