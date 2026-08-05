<?php

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use Illuminate\Foundation\Testing\Concerns\MakesHttpRequests;

// Create Artisan instance
$kernel = app(\Illuminate\Contracts\Console\Kernel::class);

// Get an employee user
$employee = User::where('role', 'employee')->first();
if (!$employee) {
    echo "❌ Tidak ada employee di database\n";
    exit(1);
}

echo "✅ Employee: " . $employee->name . " (ID: {$employee->id})\n";
echo "✅ Role: " . $employee->role . "\n\n";

// Create a test request using Laravel's testing utilities
$request = new \Illuminate\Http\Request();
$request->setMethod('GET');
$request->server->set('REQUEST_METHOD', 'GET');
$request->server->set('REQUEST_URI', '/api/employees?per_page=10');

// Set the authenticated user
$request->setUserResolver(function () use ($employee) {
    return $employee;
});

// Create controller instance and call index
try {
    $controller = new \App\Http\Controllers\EmployeeController();
    $response = $controller->index($request);
    
    echo "✅ Controller Response:\n";
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack:\n" . $e->getTraceAsString() . "\n";
}
