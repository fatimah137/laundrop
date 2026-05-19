<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OcrService
{
    /**
     * Proses gambar dengan Google Cloud Vision API.
     * Mengembalikan array: weight, service, price, raw_text, confidence.
     *
     * Pastikan sudah install: composer require google/cloud-vision
     * dan GOOGLE_APPLICATION_CREDENTIALS di .env
     */
    public function process(string $imagePath): array
    {
        try {
            $imageClient = new \Google\Cloud\Vision\V1\ImageAnnotatorClient([
                'credentials' => config('services.google.credentials_path'),
            ]);

            $image    = file_get_contents($imagePath);
            $response = $imageClient->textDetection($image);
            $texts    = $response->getTextAnnotations();

            $imageClient->close();

            if ($texts->count() === 0) {
                return $this->emptyResult();
            }

            $rawText = $texts[0]->getDescription();

            return $this->parseOcrText($rawText);
        } catch (\Throwable $e) {
            Log::error('OCR gagal', ['error' => $e->getMessage(), 'image' => $imagePath]);
            return $this->emptyResult();
        }
    }

    /**
     * Parse teks OCR mentah menjadi data terstruktur.
     * Sesuaikan pattern regex dengan format nota laundry yang digunakan.
     */
    private function parseOcrText(string $text): array
    {
        $result = [
            'raw_text'   => $text,
            'weight'     => null,
            'service'    => null,
            'price'      => null,
            'confidence' => 0.0,
        ];

        $fieldsParsed = 0;

        // Ekstrak berat (misal: "3.5 kg", "2,5 Kg", "berat: 4 kg")
        if (preg_match('/(?:berat|weight)?\s*[:\s]?\s*(\d+[.,]\d+|\d+)\s*kg/i', $text, $m)) {
            $result['weight'] = (float) str_replace(',', '.', $m[1]);
            $fieldsParsed++;
        }

        // Ekstrak jenis layanan
        $services = ['reguler', 'express', 'setrika', 'dry cleaning', 'sepatu'];
        foreach ($services as $svc) {
            if (stripos($text, $svc) !== false) {
                $result['service'] = ucfirst($svc);
                $fieldsParsed++;
                break;
            }
        }

        // Ekstrak harga (misal: "Total: Rp 35.000", "Rp35000")
        if (preg_match('/(?:total|harga|price)?\s*[:\s]?\s*Rp\.?\s*([\d.,]+)/i', $text, $m)) {
            $result['price'] = (float) str_replace(['.', ','], ['', '.'], $m[1]);
            $fieldsParsed++;
        }

        // Hitung confidence berdasarkan kelengkapan field
        $result['confidence'] = round($fieldsParsed / 3, 2);

        return $result;
    }

    private function emptyResult(): array
    {
        return [
            'raw_text'   => null,
            'weight'     => null,
            'service'    => null,
            'price'      => null,
            'confidence' => 0.0,
        ];
    }
}
