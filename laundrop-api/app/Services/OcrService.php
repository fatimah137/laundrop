<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OcrService
{
    /**
     * Proses gambar dengan OCR.space API.
     * Mengembalikan array: weight, service, price, raw_text, confidence.
     */
    public function process(string $imagePath): array
    {
        try {
            $apiKey = config('services.ocr_space.api_key');
            $apiUrl = config('services.ocr_space.url');

            $response = Http::attach(
                    'file', file_get_contents($imagePath), basename($imagePath)
                )
                ->asMultipart()
                ->post($apiUrl, [
                    'apikey'    => $apiKey,
                    'language'  => 'eng',
                    'OCREngine' => '2',
                    'scale'     => 'true',
                ]);

            if ($response->failed()) {
                Log::error('OCR.space request gagal', ['status' => $response->status()]);
                return $this->emptyResult();
            }

            $data = $response->json();

            if (!empty($data['IsErroredOnProcessing'])) {
                Log::error('OCR.space gagal proses gambar', [
                    'error' => $data['ErrorMessage'][0] ?? 'unknown',
                ]);
                return $this->emptyResult();
            }

            $rawText = $data['ParsedResults'][0]['ParsedText'] ?? '';

            if (empty(trim($rawText))) {
                return $this->emptyResult();
            }

            return $this->parseOcrText($rawText);
        } catch (\Throwable $e) {
            Log::error('OCR gagal', ['error' => $e->getMessage(), 'image' => $imagePath]);
            return $this->emptyResult();
        }
    }

    /**
     * Parse teks OCR mentah menjadi data terstruktur.
     *
     * Catatan penting: nota laundry berbentuk tabel, jadi OCR membaca teks
     * secara berurutan tanpa struktur kolom. Strategi:
     * - BERAT diambil dari baris angka tunggal setelah kata "BERAT"
     * - PRICE diambil dari nilai Rp TERAKHIR yang muncul (biasanya = total akhir)
     * - SERVICE sebaiknya TIDAK diandalkan dari OCR — gunakan service_id dari
     *   order yang sudah dipilih customer saat membuat pesanan. Field ini
     *   hanya best-effort, jangan jadi sumber utama.
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

        $lines = preg_split('/\r\n|\r|\n/', $text);
        $lines = array_values(array_filter(array_map('trim', $lines), fn($l) => $l !== ''));

        // ─── Ekstrak BERAT: cari angka berdiri sendiri setelah baris "BERAT" ───
        $beratIndex = null;
        foreach ($lines as $i => $line) {
            if (stripos($line, 'berat') !== false) {
                $beratIndex = $i;
                break;
            }
        }

        if ($beratIndex !== null) {
            for ($i = $beratIndex; $i < count($lines); $i++) {
                if (preg_match('/^(\d+(?:[.,]\d+)?)$/', $lines[$i], $m)) {
                    $result['weight'] = (float) str_replace(',', '.', $m[1]);
                    $fieldsParsed++;
                    break;
                }
            }
        }

        // ─── Ekstrak TOTAL HARGA: ambil nilai Rp TERAKHIR yang muncul ──────────
        if (preg_match_all('/Rp\.?\s*([\d.]+)/i', $text, $matches)) {
            $values = array_map(function ($v) {
                return (float) str_replace('.', '', rtrim($v, '.'));
            }, $matches[1]);

            $values = array_values(array_filter($values, fn($v) => $v > 0));

            if (!empty($values)) {
                $result['price'] = end($values); // nilai terakhir = total akhir
                $fieldsParsed++;
            }
        }

        // ─── Ekstrak jenis layanan (best-effort saja, JANGAN diandalkan) ───────
        // Service sebaiknya diambil dari order->service_id yang sudah dipilih
        // customer, bukan dari hasil OCR. Field ini hanya pelengkap.
        $services = ['cuci & setrika', 'cuci dan setrika', 'cuci saja', 'setrika saja', 'express', 'dry cleaning', 'sepatu'];
        foreach ($services as $svc) {
            if (stripos($text, $svc) !== false) {
                $result['service'] = ucwords($svc);
                $fieldsParsed++;
                break;
            }
        }

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