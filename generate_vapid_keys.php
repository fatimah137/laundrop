<?php
// Generate VAPID keys manually using base64 encoding
// VAPID keys should be 65 bytes (base64url encoded)

function generateVAPIDKeys() {
    // Generate 2 random 32-byte keys
    $publicKeyBytes = random_bytes(65);
    $privateKeyBytes = random_bytes(32);
    
    // Base64url encode (no padding)
    $publicKey = rtrim(strtr(base64_encode($publicKeyBytes), '+/', '-_'), '=');
    $privateKey = rtrim(strtr(base64_encode($privateKeyBytes), '+/', '-_'), '=');
    
    return [
        'publicKey' => $publicKey,
        'privateKey' => $privateKey,
    ];
}

$vapid = generateVAPIDKeys();

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║           VAPID KEYS FOR WEB PUSH NOTIFICATIONS                ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "📝 Public Key (share with clients):\n";
echo $vapid['publicKey'] . "\n\n";

echo "📝 Private Key (keep secret!):\n";
echo $vapid['privateKey'] . "\n\n";

echo "═════════════════════════════════════════════════════════════════\n\n";

echo "Add to laundrop-api/.env:\n";
echo "VAPID_PUBLIC_KEY=\"" . $vapid['publicKey'] . "\"\n";
echo "VAPID_PRIVATE_KEY=\"" . $vapid['privateKey'] . "\"\n";
?>
