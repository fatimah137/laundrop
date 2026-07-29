<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$customer = \App\Models\User::where('role', 'customer')->first();
if ($customer) {
    $newPassword = 'customer123';
    $customer->password_hash = bcrypt($newPassword);
    $customer->save();
    
    echo 'Password updated for: ' . $customer->email . PHP_EOL;
    echo 'New password: ' . $newPassword . PHP_EOL;
    echo 'New hash: ' . $customer->password_hash . PHP_EOL;
    
    // Verify it works
    echo 'Verify hash: ' . (password_verify($newPassword, $customer->password_hash) ? 'SUCCESS' : 'FAILED') . PHP_EOL;
}
