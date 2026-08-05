<?php
require __DIR__ . '/laundrop-api/vendor/autoload.php';

$app = require __DIR__ . '/laundrop-api/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Employee ID = 2 (Budi Santoso)
$employeeId = 2;

// Sample notifications untuk employee
// Valid types: order_created, status_changed, payment_request, payment_success, reminder
$notifications = [
    [
        'user_id' => $employeeId,
        'order_id' => 1,
        'title' => 'Pesanan Baru Masuk',
        'body' => 'Pesanan baru dari Ani Wijaya untuk Cuci Kering (5kg)',
        'type' => 'order_created',
        'is_read' => false,
        'read_at' => null,
        'created_at' => now()->subHours(2),
    ],
    [
        'user_id' => $employeeId,
        'order_id' => 2,
        'title' => 'Pembayaran Berhasil',
        'body' => 'Pesanan LD-2604-001 pembayaran berhasil dikonfirmasi',
        'type' => 'payment_success',
        'is_read' => false,
        'read_at' => null,
        'created_at' => now()->subHours(1),
    ],
    [
        'user_id' => $employeeId,
        'order_id' => 3,
        'title' => 'Status: Siap Diantar',
        'body' => 'Pesanan LD-2604-002 siap untuk diantar ke customer',
        'type' => 'status_changed',
        'is_read' => false,
        'read_at' => null,
        'created_at' => now()->subMinutes(30),
    ],
    [
        'user_id' => $employeeId,
        'order_id' => 4,
        'title' => 'Permintaan Pembayaran',
        'body' => 'Pesanan LD-2604-003 menunggu konfirmasi pembayaran dari customer',
        'type' => 'payment_request',
        'is_read' => true,
        'read_at' => now()->subMinutes(15),
        'created_at' => now()->subMinutes(45),
    ],
    [
        'user_id' => $employeeId,
        'order_id' => 5,
        'title' => 'Pengingat: Pickup Besok',
        'body' => 'Pesanan LD-2604-004 jadwal pickup besok pukul 10:00 AM',
        'type' => 'reminder',
        'is_read' => true,
        'read_at' => now()->subMinutes(10),
        'created_at' => now()->subMinutes(60),
    ],
];

echo "📝 Inserting test notifications for Employee (ID: $employeeId)...\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

try {
    DB::table('order_notifications')->insert($notifications);
    echo "✅ " . count($notifications) . " notifications created successfully!\n\n";
    
    // Show created notifications
    echo "🔔 Employee Notifications:\n";
    $created = DB::table('order_notifications')
        ->where('user_id', $employeeId)
        ->select('id', 'title', 'type', 'is_read', 'created_at')
        ->latest('created_at')
        ->get();
    
    foreach ($created as $n) {
        $read = $n->is_read ? '✓ Read' : '✗ Unread';
        echo "  • [$n->type] {$n->title} - {$read}\n";
    }
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
?>
