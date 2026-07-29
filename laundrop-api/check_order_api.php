<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Get specific order or completed order with customer
$order = \App\Models\Order::where('order_number', 'like', 'ML-260720%')->first()
    ?? \App\Models\Order::where('status', 'completed')->first();

if (!$order) {
    echo "Getting first non-cancelled order...\n";
    $order = \App\Models\Order::where('status', '!=', 'cancelled')->first();
}

if ($order) {
    echo "Order ID: {$order->id}\n";
    echo "Order Number: {$order->order_number}\n";
    echo "Status: {$order->status}\n";
    echo "Photo Pickup: " . ($order->photo_pickup ? $order->photo_pickup : "NULL") . "\n";
    echo "Photo Scale: " . ($order->photo_scale ? $order->photo_scale : "NULL") . "\n";
    echo "Photo Delivery: " . ($order->photo_delivery ? $order->photo_delivery : "NULL") . "\n";
    echo "\n---API Resource Output---\n";
    $resource = new \App\Http\Resources\OrderResource($order);
    echo json_encode($resource->resolve(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
} else {
    echo "No orders found\n";
}
