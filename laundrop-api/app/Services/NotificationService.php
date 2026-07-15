<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderNotification;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    // ─── Buat notifikasi DB + kirim Web Push ──────────────────────────────────

    public function send(int $userId, int $orderId, string $type, string $title, string $body): void
    {
        // Simpan ke DB
        OrderNotification::create([
            'user_id'  => $userId,
            'order_id' => $orderId,
            'type'     => $type,
            'title'    => $title,
            'body'     => $body,
            'is_read'  => false,
        ]);

        // Kirim Web Push ke semua device user
        $this->sendWebPush($userId, $title, $body);
    }

    // ─── Helper: kirim notifikasi sesuai status order ─────────────────────────

    public function sendStatusUpdate(Order $order, string $newStatus): void
    {
        $messages = [
            Order::STATUS_PICKUP               => ['Dalam Penjemputan',       'Kurir sedang menuju lokasi penjemputan Anda.'],
            Order::STATUS_PICKED_UP            => ['Pakaian Diambil',         'Kurir telah mengambil pakaian Anda.'],
            Order::STATUS_WAITING_PAYMENT      => ['Menunggu Pembayaran',     "Tagihan pesanan #{$order->order_number} sudah tersedia."],
            Order::STATUS_WASHING              => ['Proses Pencucian',        'Pakaian Anda sedang dicuci.'],
            Order::STATUS_WASHING_FINISHED     => ['Pencucian Selesai',       'Pakaian Anda sudah selesai dicuci dan siap dikirim.'],
            Order::STATUS_DELIVERY             => ['Dalam Pengantaran',       'Kurir sedang mengantarkan pakaian Anda.'],
            Order::STATUS_COMPLETED            => ['Pesanan Selesai',         'Pesanan Anda telah selesai. Terima kasih!'],
            Order::STATUS_CANCELLED            => ['Pesanan Dibatalkan',      "Pesanan #{$order->order_number} telah dibatalkan."],
        ];

        if (! isset($messages[$newStatus])) {
            return;
        }

        [$title, $body] = $messages[$newStatus];

        $this->send($order->customer_id, $order->id, 'status_changed', $title, $body);
    }

    // ─── Kirim Web Push via VAPID ─────────────────────────────────────────────

    private function sendWebPush(int $userId, string $title, string $body): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        // Pastikan sudah install: composer require minishlink/web-push
        // dan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY di .env

        foreach ($subscriptions as $sub) {
            try {
                $webPush = new \Minishlink\WebPush\WebPush([
                    'VAPID' => [
                        'subject'    => config('app.url'),
                        'publicKey'  => config('services.vapid.public_key'),
                        'privateKey' => config('services.vapid.private_key'),
                    ],
                ]);

                $subscription = \Minishlink\WebPush\Subscription::create([
                    'endpoint'        => $sub->endpoint,
                    'keys'            => [
                        'p256dh' => $sub->p256dh,
                        'auth'   => $sub->auth_key,
                    ],
                ]);

                $webPush->queueNotification(
                    $subscription,
                    json_encode(['title' => $title, 'body' => $body])
                );

                foreach ($webPush->flush() as $report) {
                    if ($report->isSubscriptionExpired()) {
                        $sub->delete(); // hapus subscription kadaluarsa
                    }
                }
            } catch (\Throwable $e) {
                Log::error('Web Push gagal', [
                    'user_id' => $userId,
                    'error'   => $e->getMessage(),
                ]);
            }
        }
    }
}
