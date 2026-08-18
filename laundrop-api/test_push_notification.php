#!/usr/bin/env php
<?php
/**
 * Test Web Push Notifications
 * 
 * Usage:
 *   php test_push_notification.php
 * 
 * Ini akan:
 * 1. Check VAPID keys configuration
 * 2. Create test notification
 * 3. Send push notification ke semua subscribed devices
 * 4. Log results
 */

// Load Composer autoloader first
require __DIR__ . '/vendor/autoload.php';

// Then bootstrap Laravel application
$app = require 'bootstrap/app.php';

use App\Services\NotificationService;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;

// Boot Laravel kernel
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║           Web Push Notification Test                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// 1. Check VAPID configuration
echo "1️⃣  Checking VAPID configuration...\n";
$publicKey = config('services.vapid.public_key');
$privateKey = config('services.vapid.private_key');

if (!$publicKey || !$privateKey) {
    echo "   ❌ VAPID keys tidak ditemukan di config/services.php\n";
    echo "   Pastikan .env sudah berisi:\n";
    echo "   - VAPID_PUBLIC_KEY\n";
    echo "   - VAPID_PRIVATE_KEY\n";
    exit(1);
}

echo "   ✅ Public Key: " . substr($publicKey, 0, 20) . "...\n";
echo "   ✅ Private Key: " . substr($privateKey, 0, 20) . "...\n\n";

// 2. Find employee user
echo "2️⃣  Looking for employee user...\n";
$employee = User::where('role', 'employee')->first();

if (!$employee) {
    echo "   ❌ Tidak ada employee dalam database\n";
    exit(1);
}

echo "   ✅ Ditemukan: {$employee->name} (ID: {$employee->id})\n\n";

// 3. Check push subscriptions
echo "3️⃣  Checking push subscriptions for employee...\n";
$subscriptions = PushSubscription::where('user_id', $employee->id)->get();

if ($subscriptions->isEmpty()) {
    echo "   ⚠️  Tidak ada push subscription. Employee perlu subscribe di browser dulu.\n";
    echo "   Langkah:\n";
    echo "   1. Login sebagai employee di http://localhost:5175\n";
    echo "   2. Buka browser console untuk lihat subscription logs\n";
    echo "   3. Izinkan notification permission saat diminta\n";
    echo "   4. Jalankan test lagi\n\n";
    exit(1);
}

echo "   ✅ Ditemukan {$subscriptions->count()} subscription(s):\n";
foreach ($subscriptions as $sub) {
    echo "      - Endpoint: " . substr($sub->endpoint, 0, 40) . "...\n";
}
echo "\n";

// 4. Send test push notification
echo "4️⃣  Sending test push notification...\n";
try {
    $notificationService = new NotificationService();
    
    // Simulate sending push via NotificationService
    Log::info('Testing push notification send', ['user_id' => $employee->id]);
    
    // Manual push send untuk testing
    foreach ($subscriptions as $sub) {
        try {
            $webPush = new \Minishlink\WebPush\WebPush([
                'VAPID' => [
                    'subject'    => config('app.url'),
                    'publicKey'  => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ]);

            $subscription = \Minishlink\WebPush\Subscription::create([
                'endpoint'        => $sub->endpoint,
                'keys'            => [
                    'p256dh' => $sub->p256dh,
                    'auth'   => $sub->auth_key,
                ],
            ]);

            $testMessage = json_encode([
                'title' => '🧪 Test Notification',
                'body' => 'Ini adalah test push notification dari Laundrop. Jika Anda melihat ini, push notification sudah berfungsi! ✅',
                'icon' => '/favicon-laundrop.png',
            ]);

            $webPush->queueNotification($subscription, $testMessage);

            echo "   📤 Mengirim ke: " . substr($sub->endpoint, 0, 40) . "...\n";

            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    echo "   ✅ Push notification terkirim!\n";
                } else {
                    echo "   ❌ Gagal: " . $report->getReason() . "\n";
                    if ($report->isSubscriptionExpired()) {
                        echo "      (Subscription expired, dihapus dari database)\n";
                        $sub->delete();
                    }
                }
            }
        } catch (\Throwable $e) {
            echo "   ❌ Error: " . $e->getMessage() . "\n";
            Log::error('Push notification error', [
                'user_id' => $employee->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    echo "\n";
    echo "═════════════════════════════════════════════════════════════════\n";
    echo "✅ Test selesai!\n\n";
    echo "Jika browser menampilkan notification:\n";
    echo "  ✅ Push notification system sudah BERFUNGSI\n\n";
    echo "Jika tidak ada notification:\n";
    echo "  ⚠️  Check:\n";
    echo "     1. Browser notification permission (set to 'Allow')\n";
    echo "     2. Browser console untuk error messages\n";
    echo "     3. Pastikan service worker sudah registered\n";
    echo "═════════════════════════════════════════════════════════════════\n\n";

} catch (\Throwable $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
    Log::error('Push test failed', ['error' => $e->getMessage()]);
    exit(1);
}

?>
