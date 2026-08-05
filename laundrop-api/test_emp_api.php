<?php

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use Illuminate\Http\Request;

// Get employee untuk ambil token
$employee = User::where('role', 'employee')->first();
if (!$employee) {
    echo "❌ Tidak ada employee di database\n";
    exit(1);
}

$token = $employee->createToken('test')->plainTextToken;
echo "✅ Employee: " . $employee->name . "\n";
echo "✅ Token: " . substr($token, 0, 30) . "...\n";
echo "✅ Full token: " . $token . "\n\n";

// Test dengan curl
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'http://localhost:8000/api/employees?per_page=10',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_VERBOSE => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "📨 HTTP Status: " . $httpCode . "\n";
if ($error) {
    echo "❌ Curl Error: " . $error . "\n";
}
echo "\n📋 Response:\n";
echo $response . "\n";
