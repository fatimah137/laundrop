<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\OcrService;

echo "=== Test OcrService::process() ===\n";

$imagePath = storage_path('app/public/test-image.png');

if (!file_exists($imagePath)) {
    echo "ERROR: File gambar tidak ditemukan di: {$imagePath}\n";
    exit(1);
}

echo "File gambar ditemukan: {$imagePath}\n";
echo "Memanggil OcrService->process()...\n\n";

$ocrService = new OcrService();
$result = $ocrService->process($imagePath);

echo "=== HASIL ===\n";
echo "Raw text:\n" . ($result['raw_text'] ?? '(kosong)') . "\n\n";
echo "Weight     : " . ($result['weight'] ?? 'null') . "\n";
echo "Service    : " . ($result['service'] ?? 'null') . "\n";
echo "Price      : " . ($result['price'] ?? 'null') . "\n";
echo "Confidence : " . $result['confidence'] . "\n";

echo "\n=== SELESAI ===\n";