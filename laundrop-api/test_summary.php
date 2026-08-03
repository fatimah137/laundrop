<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Test the service
$service = app('App\Services\GeminiSummaryService');
$summary = $service->summarize('revenue', [
    'predicted_total' => 5000000, 
    'trend' => 'upward',
    'confidence' => 0.85
]);

echo "Summary Generated:\n";
echo $summary . "\n";
