<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔗 TESTING PHOTO URLs:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$order = DB::table('orders')
    ->select('id', 'order_number', 'photo_pickup', 'photo_scale', 'photo_delivery')
    ->where('id', 4049)
    ->first();

if (!$order) {
    echo "❌ Order tidak ditemukan\n";
    exit;
}

echo "Order: {$order->order_number}\n\n";

// Test asset URLs
$photos = [
    'pickup' => $order->photo_pickup,
    'scale' => $order->photo_scale,
    'delivery' => $order->photo_delivery,
];

foreach ($photos as $type => $path) {
    if ($path) {
        $url = asset('storage/' . $path);
        echo "📸 {$type}:\n";
        echo "   Path: {$path}\n";
        echo "   URL: {$url}\n";
        echo "\n";
    }
}
