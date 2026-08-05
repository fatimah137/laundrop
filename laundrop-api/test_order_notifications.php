#!/usr/bin/env php
<?php
/**
 * Test Order Creation & Employee Notifications
 * 
 * This script:
 * 1. Creates a test order as customer
 * 2. Verifies notification created in DB
 * 3. Checks if all employees were notified
 * 
 * Usage:
 *   php test_order_notifications.php
 */

require 'bootstrap/app.php';

use App\Models\User;
use App\Models\Order;
use App\Models\OrderNotification;
use App\Models\Service;
use Illuminate\Support\Facades\Log;

// Boot Laravel application
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║           Order Creation & Employee Notifications Test         ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// 1. Find or create customer
echo "1️⃣  Looking for customer user...\n";
$customer = User::where('role', 'customer')->first();

if (!$customer) {
    echo "   ❌ No customer found. Please create one first.\n";
    exit(1);
}

echo "   ✅ Found customer: {$customer->name} (ID: {$customer->id})\n\n";

// 2. Find service
echo "2️⃣  Looking for service...\n";
$service = Service::active()->first();

if (!$service) {
    echo "   ❌ No active service found.\n";
    exit(1);
}

echo "   ✅ Found service: {$service->name} (ID: {$service->id})\n\n";

// 3. Check employees count
echo "3️⃣  Checking employees...\n";
$employees = User::where('role', 'employee')->where('is_active', true)->get();

if ($employees->isEmpty()) {
    echo "   ⚠️  No active employees found.\n";
} else {
    echo "   ✅ Found {$employees->count()} active employee(s):\n";
    foreach ($employees as $emp) {
        echo "      - {$emp->name}\n";
    }
}
echo "\n";

// 4. Create test order
echo "4️⃣  Creating test order...\n";

$orderData = [
    'order_type'       => 'pickup',
    'service_id'       => $service->id,
    'customer_id'      => $customer->id,
    'pickup_address'   => 'Test Address, Street 123',
    'pickup_lat'       => -7.0715116551644055,
    'pickup_lng'       => 110.41728959200246,
    'pickup_date'      => now()->addDays(1)->format('Y-m-d'),
    'pickup_time'      => '10:00',
    'delivery_address' => 'Test Delivery Address',
    'delivery_lat'     => -7.075,
    'delivery_lng'     => 110.42,
    'estimated_weight' => 5,
    'payment_method'   => 'cash',
    'status'           => Order::STATUS_WAITING_CONFIRMATION,
    'delivery_distance_km' => 2,
    'delivery_fee'     => 6000,
];

$order = Order::create($orderData);
echo "   ✅ Test order created: #{$order->order_number} (ID: {$order->id})\n\n";

// 5. Check notifications created
echo "5️⃣  Checking notifications in database...\n";

$customerNotif = OrderNotification::where('user_id', $customer->id)
    ->where('order_id', $order->id)
    ->where('type', 'order_created')
    ->first();

if ($customerNotif) {
    echo "   ✅ Customer notification created\n";
} else {
    echo "   ❌ Customer notification NOT found\n";
}

echo "\n   Employee notifications:\n";
$employeeNotifs = OrderNotification::where('order_id', $order->id)
    ->where('type', 'order_created')
    ->get();

if ($employeeNotifs->count() > 0) {
    echo "   ✅ Found {$employeeNotifs->count()} notification(s):\n";
    foreach ($employeeNotifs as $notif) {
        $user = User::find($notif->user_id);
        $role = $user->role;
        echo "      - {$user->name} ({$role}): {$notif->title}\n";
    }
} else {
    echo "   ❌ No employee notifications found!\n";
}

// 6. Check push subscriptions for employees
echo "\n6️⃣  Checking push subscriptions for employees...\n";
foreach ($employees as $emp) {
    $subs = \App\Models\PushSubscription::where('user_id', $emp->id)->get();
    if ($subs->isNotEmpty()) {
        echo "   ✅ {$emp->name}: {$subs->count()} subscription(s)\n";
    } else {
        echo "   ⚠️  {$emp->name}: No subscriptions (won't receive push notifications)\n";
    }
}

echo "\n";
echo "═════════════════════════════════════════════════════════════════\n";

if ($employeeNotifs->count() >= $employees->count()) {
    echo "✅ SUCCESS: All employees were notified about new order!\n";
} else {
    echo "❌ ISSUE: Only {$employeeNotifs->count()} of {$employees->count()} employees notified\n";
}

if ($employees->where('id', $employeeNotifs->pluck('user_id'))->count() < $employees->count()) {
    echo "⚠️  Some employees may not have push subscriptions\n";
    echo "   To fix: Login as each employee and allow notification permission\n";
}

echo "═════════════════════════════════════════════════════════════════\n\n";

?>
