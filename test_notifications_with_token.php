<?php
// First, get a valid token by logging in
$ch = curl_init('http://127.0.0.1:8000/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'budi@laundrop.io',
    'password' => 'password123'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "=== LOGIN RESPONSE ===\n";
echo "HTTP Code: $httpCode\n";

$loginData = json_decode($response, true);
var_dump($loginData);

if ($loginData['success'] && isset($loginData['data']['token'])) {
    $token = $loginData['data']['token'];
    
    echo "\n=== NOTIFICATIONS RESPONSE ===\n";
    $ch2 = curl_init('http://127.0.0.1:8000/api/notifications');
    curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch2, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json',
        'Authorization: Bearer ' . $token
    ]);
    curl_setopt($ch2, CURLOPT_TIMEOUT, 5);
    
    $response2 = curl_exec($ch2);
    $httpCode2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
    curl_close($ch2);
    
    echo "HTTP Code: $httpCode2\n";
    var_dump(json_decode($response2, true));
} else {
    echo "\nLogin failed, cannot test notifications endpoint\n";
}
?>
