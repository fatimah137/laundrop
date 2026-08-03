<?php
require 'laundrop-api/vendor/autoload.php';
require 'laundrop-api/bootstrap/app.php';

$app = require 'laundrop-api/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

// Setup database
$app['config']['database.default'] = 'mysql';

$admin = \App\Models\User::where('email','owner@laundrop.id')->first();
if ($admin) {
    $token = $admin->createToken('test')->plainTextToken;
    echo "Token: " . $token . "\n";
} else {
    echo "User not found\n";
}
