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
     * Parse dan verifikasi notifikasi webhook dari Midtrans.
     * Mengembalikan null jika signature tidak valid.
     */
    public function parseNotification(array $payload): ?array
    {
        try {
            $notification = new \Midtrans\Notification();

            // Verifikasi signature key
            $expectedSignature = hash(
                'sha512',
                $payload['order_id']
                . $payload['status_code']
                . $payload['gross_amount']
                . config('services.midtrans.server_key')
            );

            if ($payload['signature_key'] !== $expectedSignature) {
                return null;
            }

            return [
                'order_id'          => $payload['order_id'],
                'transaction_id'    => $payload['transaction_id'],
                'transaction_status'=> $payload['transaction_status'],
                'fraud_status'      => $payload['fraud_status'] ?? null,
                'gross_amount'      => $payload['gross_amount'],
            ];
        } catch (\Throwable $e) {
            Log::error('Midtrans parseNotification error', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
