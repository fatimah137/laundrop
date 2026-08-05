<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "📸 CHECKING PHOTOS IN ORDERS:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$orders = DB::table('orders')
    ->select('id', 'order_number', 'status', 'photo_pickup', 'photo_scale', 'photo_delivery')
    ->latest()
    ->limit(10)
    ->get();

if ($orders->isEmpty()) {
    echo "❌ Tidak ada pesanan\n";
    exit;
}

foreach ($orders as $order) {
    echo "Order: {$order->order_number} (ID: {$order->id})\n";
    echo "Status: {$order->status}\n";
    echo "  • photo_pickup:   " . ($order->photo_pickup ? "✓ {$order->photo_pickup}" : "❌ kosong") . "\n";
    echo "  • photo_scale:    " . ($order->photo_scale ? "✓ {$order->photo_scale}" : "❌ kosong") . "\n";
    echo "  • photo_delivery: " . ($order->photo_delivery ? "✓ {$order->photo_delivery}" : "❌ kosong") . "\n";
    echo "\n";
}

// Check if files exist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📁 CHECKING IF FILES EXIST IN STORAGE:\n\n";

$storagePath = public_path('storage');
if (!is_dir($storagePath)) {
    echo "❌ Storage directory tidak ada: $storagePath\n";
    exit;
}

echo "✓ Storage directory ada: $storagePath\n";

$files = glob($storagePath . '/**/photo_*', GLOB_BRACE);
if (!empty($files)) {
    echo "\n📸 Files ditemukan:\n";
    foreach ($files as $file) {
        $size = filesize($file);
        echo "  • " . basename($file) . " (" . ($size / 1024) . " KB)\n";
    }
} else {
    echo "\n❌ Tidak ada file photo_ di storage\n";
}
