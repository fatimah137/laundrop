<?php
require __DIR__ . '/laundrop-api/vendor/autoload.php';

$app = require __DIR__ . '/laundrop-api/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "📊 DATABASE CHECK:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

// Check users
echo "\n👥 USERS:\n";
$users = DB::table('users')->select('id', 'name', 'email', 'role')->get();
foreach ($users as $user) {
    echo "  ID: {$user->id} | Name: {$user->name} | Email: {$user->email} | Role: {$user->role}\n";
}
echo "Total: " . count($users) . "\n";

// Check notifications
echo "\n🔔 NOTIFICATIONS:\n";
$notifications = DB::table('order_notifications')->count();
echo "Total: " . $notifications . "\n";

if ($notifications > 0) {
    $notifDetails = DB::table('order_notifications')
        ->select('id', 'user_id', 'title', 'type', 'is_read', 'created_at')
        ->limit(10)
        ->get();
    
    echo "\nFirst 10 notifications:\n";
    foreach ($notifDetails as $n) {
        $read = $n->is_read ? '✓ Read' : '✗ Unread';
        echo "  ID: {$n->id} | User: {$n->user_id} | Type: {$n->type} | {$read} | {$n->title}\n";
    }
}

echo "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
?>
