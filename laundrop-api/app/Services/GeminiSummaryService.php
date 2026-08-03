<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiSummaryService
{
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->model = config('services.gemini.model', 'gemini-2.0-flash');
    }

    /**
     * Generate kesimpulan bahasa natural dari data prediksi ML.
     *
     * @param string $type  'revenue' | 'demand' | 'churn'
     * @param array  $predictionData  hasil dari ml-service (raw JSON)
     * @param array  $context  data tambahan (nama laundry, periode, dll) - opsional
     * @return string|null  kesimpulan dalam Bahasa Indonesia, atau null kalau gagal
     */
    public function summarize(string $type, array $predictionData, array $context = []): ?string
    {
        if (empty($this->apiKey)) {
            Log::warning('GEMINI_API_KEY belum di-set, skip summary generation');
            return $this->getMockSummary($type, $predictionData);
        }

        $prompt = $this->buildPrompt($type, $predictionData, $context);

        try {
            $response = Http::timeout(15)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post(
                    "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent?key={$this->apiKey}",
                    [
                        'contents' => [
                            ['parts' => [['text' => $prompt]]],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.25,
                            'maxOutputTokens' => 700,
                        ],
                    ]
                );

            if (!$response->successful()) {
                Log::error('Gemini API error', ['status' => $response->status(), 'body' => $response->body()]);
                return $this->getMockSummary($type, $predictionData); // fallback to mock
            }

            $text = $response->json('candidates.0.content.parts.0.text');
            return $text ? trim($text) : null;

        } catch (\Exception $e) {
            Log::error('Gemini summary generation failed: ' . $e->getMessage());
            return $this->getMockSummary($type, $predictionData); // fallback ke mock kalau quota habis
        }
    }

    /**
     * Mock summary untuk testing atau ketika Gemini API gagal/quota habis.
     * Ini adalah temporary fallback sampai quota reset atau upgrade ke paid plan.
     */
    protected function getMockSummary(string $type, array $data): string
    {
        return match ($type) {
            'revenue' => sprintf(
                "1. Ringkasan Utama\nPrediksi revenue menunjukkan total Rp %s dengan rata-rata Rp %s per hari.\n\n2. Statistik Kunci\n- Total revenue prediksi: Rp %s\n- Rata-rata revenue per hari: Rp %s\n- Tren: %s\n- Akurasi model: %d%%\n\n3. Interpretasi Tren\nTren ini menunjukkan arah pendapatan bisnis dalam periode prediksi, sehingga pengaturan kapasitas layanan perlu disesuaikan.\n\n4. Risiko yang Perlu Diwaspadai\nJika akurasi rendah, hasil prediksi sebaiknya dipakai sebagai indikasi awal dan dikonfirmasi dengan data aktual harian.\n\n5. Rekomendasi Tindakan\n1) Jaga kualitas layanan tetap konsisten di jam sibuk.\n2) Dorong repeat order dengan promo ringan mingguan.\n3) Pantau gap prediksi vs realisasi setiap minggu.",
                number_format((int)($data['predicted_total'] ?? 0), 0, ',', '.'),
                number_format((int)($data['predicted_daily_average'] ?? 0), 0, ',', '.'),
                number_format((int)($data['predicted_total'] ?? 0), 0, ',', '.'),
                number_format((int)($data['predicted_daily_average'] ?? 0), 0, ',', '.'),
                match($data['trend'] ?? 'stable') { 'up' => 'positif (naik)', 'down' => 'negatif (turun)', default => 'stabil' },
                (int)(($data['confidence'] ?? 0) * 100)
            ),

            'demand' => sprintf(
                "1. Ringkasan Utama\nPrediksi demand memperkirakan sekitar %d order per hari pada periode analisis.\n\n2. Statistik Kunci\n- Estimasi order harian: %d\n- Rentang prediksi: %d - %d order\n- Akurasi model: %d%%\n\n3. Interpretasi Tren\nRentang demand ini dapat digunakan untuk menentukan kebutuhan staf, kapasitas mesin, dan target SLA operasional harian.\n\n4. Risiko yang Perlu Diwaspadai\nJika permintaan aktual melampaui batas atas, potensi antrean dan keterlambatan meningkat.\n\n5. Rekomendasi Tindakan\n1) Atur shift staf mengikuti jam puncak order.\n2) Siapkan buffer kapasitas mesin untuk lonjakan permintaan.\n3) Evaluasi realisasi order harian untuk penyesuaian cepat.",
                (int)($data['estimated_orders'] ?? 0),
                (int)($data['estimated_orders'] ?? 0),
                (int)($data['range']['min'] ?? 0),
                (int)($data['range']['max'] ?? 0),
                (int)(($data['confidence'] ?? 0) * 100)
            ),

            'churn' => sprintf(
                "1. Ringkasan Utama\nPelanggan ini memiliki indikasi risiko churn %s berdasarkan pola aktivitas terakhir.\n\n2. Statistik Kunci\n- Level risiko: %s\n- Skor churn: %.2f\n- Hari sejak order terakhir: %d hari\n\n3. Interpretasi Tren\nSemakin lama jeda order dan semakin tinggi skor, semakin besar peluang pelanggan tidak kembali dalam waktu dekat.\n\n4. Risiko yang Perlu Diwaspadai\nJika tidak ada intervensi, pelanggan berpotensi berpindah ke layanan lain dan menurunkan retensi.\n\n5. Rekomendasi Tindakan\n1) Lakukan follow-up personal dalam 24-72 jam.\n2) Berikan promo retensi yang relevan dengan histori order.\n3) Pantau respons pelanggan selama 7-14 hari.",
                match($data['risk_level'] ?? 'low') { 'high' => 'tinggi', 'medium' => 'sedang', default => 'rendah' },
                strtoupper((string)($data['risk_level'] ?? 'low')),
                (float)($data['churn_risk_score'] ?? 0),
                (int)($data['days_since_last_order'] ?? 0)
            ),

            'churn_portfolio' => sprintf(
                "1. Ringkasan Utama\nPortofolio pelanggan menunjukkan sebaran risiko churn yang perlu diprioritaskan berdasarkan level risiko tertinggi.\n\n2. Statistik Kunci\n- Total pelanggan dianalisis: %d\n- Rata-rata skor risiko: %.3f\n- High risk: %d\n- Medium risk: %d\n- Low risk: %d\n\n3. Interpretasi Tren\nKomposisi level risiko membantu menentukan fokus retensi, terutama pada pelanggan high dan medium yang membutuhkan tindak lanjut cepat.\n\n4. Risiko yang Perlu Diwaspadai\nTanpa intervensi prioritas, kelompok risiko tinggi dapat meningkatkan churn rate aktual dalam periode berikutnya.\n\n5. Rekomendasi Tindakan\n1) Prioritaskan kontak personal untuk pelanggan high risk.\n2) Jalankan promo targeted untuk medium risk.\n3) Pertahankan engagement rutin untuk low risk agar tidak naik level.",
                (int)($data['total_customers'] ?? 0),
                (float)($data['average_risk_score'] ?? 0),
                (int)($data['risk_distribution']['high'] ?? 0),
                (int)($data['risk_distribution']['medium'] ?? 0),
                (int)($data['risk_distribution']['low'] ?? 0)
            ),

            'recommendation' => sprintf(
                "1. Ringkasan Utama\nEvaluasi performa bisnis menunjukkan revenue Rp %s dari %d order, dengan churn rate %.1f%% pada periode analisis.\n\n2. Statistik Kunci\n- Total revenue: Rp %s\n- Jumlah order: %d\n- Rata-rata nilai order: Rp %s\n- Churn rate: %.1f%%\n\n3. Interpretasi Tren\nMetrik ini menunjukkan ruang optimasi pada retensi pelanggan dan peningkatan nilai transaksi rata-rata.\n\n4. Risiko yang Perlu Diwaspadai\nJika churn rate meningkat tanpa tindakan, pertumbuhan revenue berisiko melambat meski order masih stabil.\n\n5. Rekomendasi Tindakan\n1) Eksekusi rekomendasi prioritas tinggi lebih dahulu.\n2) Pantau dampak tindakan pada churn rate mingguan.\n3) Optimalkan upsell untuk menaikkan rata-rata nilai order.",
                number_format((int)($data['summary']['total_revenue'] ?? 0), 0, ',', '.'),
                (int)($data['summary']['order_count'] ?? 0),
                (float)(($data['summary']['churn_rate'] ?? 0) * 100),
                number_format((int)($data['summary']['total_revenue'] ?? 0), 0, ',', '.'),
                (int)($data['summary']['order_count'] ?? 0),
                number_format((int)($data['summary']['avg_order_value'] ?? 0), 0, ',', '.'),
                (float)(($data['summary']['churn_rate'] ?? 0) * 100)
            ),

            default => 'Prediksi tersimpan dengan baik.',
        };
    }

    /**
     * Bikin prompt berbeda tergantung jenis prediksi.
     * Prompt ditulis eksplisit dalam Bahasa Indonesia, gaya bahasa awam (bukan teknis),
     * karena target pembaca adalah pemilik usaha laundry, bukan data analyst.
     */
    protected function buildPrompt(string $type, array $data, array $context): string
    {
        $businessName = $context['business_name'] ?? 'usaha laundry ini';
        $dataJson = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $commonRules = "Kamu adalah analis bisnis untuk {$businessName}.\n"
            . "Gunakan Bahasa Indonesia yang jelas, padat, dan actionable untuk pemilik usaha laundry.\n"
            . "Jangan halusinasi, hanya gunakan angka dari JSON. Jika data tidak ada, tulis 'data tidak tersedia'.\n"
            . "Jika confidence <= 0.05 atau confidence tidak tersedia, tulis catatan bahwa akurasi masih rendah.\n"
            . "Output WAJIB tepat 5 bagian berurutan berikut:\n"
            . "1. Ringkasan Utama\n"
            . "2. Statistik Kunci\n"
            . "3. Interpretasi Tren\n"
            . "4. Risiko yang Perlu Diwaspadai\n"
            . "5. Rekomendasi Tindakan\n"
            . "Di bagian 5, berikan tepat 3 poin tindakan bernomor.\n"
            . "Total panjang 8-12 kalimat.\n\n";

        $instructions = match ($type) {
            'revenue' => $commonRules
                . "Fokus analisis: predicted_total, predicted_daily_average, trend, confidence.\n"
                . "Formatkan nominal sebagai Rupiah dengan pemisah ribuan titik.\n"
                . "Data JSON:\n{$dataJson}",

            'demand' => $commonRules
                . "Fokus analisis: estimated_orders, range.min, range.max, confidence, period_days.\n"
                . "Jelaskan implikasi ke staf, mesin, dan SLA operasional.\n"
                . "Data JSON:\n{$dataJson}",

            'churn' => $commonRules
                . "Fokus analisis: churn_risk_score, risk_level, days_since_last_order.\n"
                . "Tekankan prioritas retensi pelanggan sesuai level risiko.\n"
                . "Data JSON:\n{$dataJson}",

            'churn_portfolio' => $commonRules
                . "Fokus analisis: total_customers, average_risk_score, risk_distribution, top_risk_customers.\n"
                . "Jelaskan prioritas tindakan untuk level high, medium, low.\n"
                . "Data JSON:\n{$dataJson}",

            'recommendation' => $commonRules
                . "Fokus analisis: summary.total_revenue, summary.order_count, summary.avg_order_value, summary.churn_rate, recommendations.\n"
                . "Susun rekomendasi berdasarkan prioritas high > medium > low.\n"
                . "Data JSON:\n{$dataJson}",

            default => $commonRules . "Data JSON:\n{$dataJson}",
        };

        return $instructions;
    }
}
