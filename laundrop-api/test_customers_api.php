<?php

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/bootstrap/app.php';

use App\Models\User;

// Get employee untuk ambil token
$employee = User::where('role', 'employee')->first();
if (!$employee) {
    echo "❌ Tidak ada employee di database. Buat employee dulu!\n";
    exit(1);
}

echo "✅ Employee ditemukan: " . $employee->name . " (ID: " . $employee->id . ")\n";

// Generate token
$token = $employee->createToken('test')->plainTextToken;
echo "✅ Token: " . substr($token, 0, 20) . "...\n\n";

// Simulate HTTP request
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'http://localhost:8000/api/customers/search?per_page=5',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
        'Content-Type: application/json',
    ],
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "📨 HTTP Response Code: " . $httpCode . "\n\n";
echo "📋 Response:\n";

if ($httpCode === 200) {
    $decoded = json_decode($response, true);
    echo json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo $response . "\n";
}
