<?php

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use Laravel\Sanctum\Sanctum;

// Get an employee user untuk test
$employee = User::where('role', 'employee')->first();
if (!$employee) {
    echo "❌ Tidak ada employee di database\n";
    exit(1);
}

// ActingAs employee untuk simulate auth
Sanctum::actingAs($employee);

// Test endpoint
$response = app('Illuminate\Routing\Router')->getRoutes()->match(
    app('Illuminate\Http\Request')->create('/api/customers/search', 'GET')
);

echo "✅ Employee found: " . $employee->name . "\n";
echo "✅ Route exists for /api/customers/search\n";

// Get customers via controller
$customerController = new \App\Http\Controllers\CustomerController();
$request = app('Illuminate\Http\Request')->create('/api/customers/search?per_page=100', 'GET');
$request->setUserResolver(fn() => $employee);

try {
    $response = $customerController->index($request);
    echo "✅ Customers API Response:\n";
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
