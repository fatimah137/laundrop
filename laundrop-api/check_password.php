<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$customer = \App\Models\User::where('role', 'customer')->first();
if ($customer) {
    echo 'Customer: ' . $customer->name . PHP_EOL;
    echo 'Email: ' . $customer->email . PHP_EOL;
    echo 'Password Hash: ' . $customer->password_hash . PHP_EOL;
    
    // Coba hash password 'password' dengan bcrypt
    $hashedPassword = password_hash('password', PASSWORD_BCRYPT);
    echo PHP_EOL . 'Test password hash: ' . $hashedPassword . PHP_EOL;
    echo 'Match stored: ' . (password_verify('password', $customer->password_hash) ? 'YES' : 'NO') . PHP_EOL;
    
    // Check if password_hash field is actually using bcrypt
    if (preg_match('/^\$2[aby]\$/', $customer->password_hash)) {
        echo 'Stored hash IS bcrypt' . PHP_EOL;
    } else {
        echo 'Stored hash is NOT bcrypt - might be plain or different format' . PHP_EOL;
    }
}
