<?php
/**
 * Generate DATA DUMMY BESAR untuk ML Service Predictions
 * - 180 hari history (vs 90 hari sebelumnya)
 * - 5-15 transaksi per hari (vs 2-5 sebelumnya)
 * - Higher volume, higher revenue for impressive predictions
 * 
 * Jalankan: php seed_ml_data_extensive.php
 * 
 * Expected Results:
 * - ~1800 transaksi total
 * - Revenue lebih tinggi untuk prediksi yang lebih signifikan
 * - Trend yang lebih terlihat jelas di chart
 */

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "🚀 Seeding EXTENSIVE ML historical data (180 hari, high volume)...\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Ambil data yang ada
$customerIds = DB::table('users')->where('role', 'customer')->pluck('id')->toArray();
$serviceIds  = DB::table('services')->pluck('id')->toArray();
$services    = DB::table('services')->select('id', 'price_per_kg')->get()->keyBy('id');

if (empty($customerIds)) {
    echo "❌ ERROR: Tidak ada customer di database!\n";
    exit(1);
}

if (empty($serviceIds)) {
    echo "❌ ERROR: Tidak ada service di database!\n";
    exit(1);
}

$insertedCount = 0;
$totalRevenue  = 0;
$today         = Carbon::today();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Generate 180 HARI data dengan volume tinggi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

for ($dayOffset = 179; $dayOffset >= 0; $dayOffset--) {
    $date = $today->copy()->subDays($dayOffset);
    $dayName = $date->format('l');
    
    // Pola minggu:
    // Senin-Jumat: 6-12 transaksi (busy weekdays)
    // Sabtu-Minggu: 10-15 transaksi (peak weekend)
    $isWeekend = in_array($date->dayOfWeek, [0, 6]); // 0=Sunday, 6=Saturday
    $ordersPerDay = $isWeekend 
        ? rand(10, 15)  // Weekend: lebih banyak order
        : rand(6, 12);   // Weekday: quite busy

    for ($j = 0; $j < $ordersPerDay; $j++) {
        $customerId = $customerIds[array_rand($customerIds)];
        $serviceId  = $serviceIds[array_rand($serviceIds)];
        
        // Weight distribution: most 3-8kg, some premium 8-15kg, rare 15-25kg
        $rand = rand(1, 100);
        if ($rand <= 70) {
            $weight = rand(30, 80) / 10;  // 3.0 - 8.0 kg (70% of orders)
        } elseif ($rand <= 90) {
            $weight = rand(80, 150) / 10; // 8.0 - 15.0 kg (20% premium)
        } else {
            $weight = rand(150, 250) / 10; // 15.0 - 25.0 kg (10% bulk orders)
        }
        
        $pricePerKg = (int) ($services[$serviceId]->price_per_kg ?? 7000);
        $subtotal   = $weight * $pricePerKg;
        
        // Delivery fee (banyak yang pake delivery)
        $deliveryFee = rand(0, 1) ? rand(5000, 15000) : 0;
        $total       = $subtotal + $deliveryFee;
        $method      = rand(0, 1) ? 'cash' : 'qris';  // enum('cash','qris')
        
        // Buat order dengan unique order_number menggunakan timestamp
        $uniqueSuffix = substr(str_shuffle('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0, 6);
        $orderId = DB::table('orders')->insertGetId([
            'order_number'        => 'ORD-' . $date->format('ymdHis') . '-' . $uniqueSuffix,
            'customer_id'         => $customerId,
            'service_id'          => $serviceId,
            'pickup_address'      => 'Jl. Merdeka No. ' . rand(1, 200),
            'pickup_lat'          => null,
            'pickup_lng'          => null,
            'pickup_date'         => $date->toDateString(),
            'pickup_time'         => sprintf('%02d:%02d:00', rand(8, 18), rand(0, 59)),
            'delivery_distance_km'=> rand(10, 100) / 10,
            'delivery_fee'        => $deliveryFee,
            'estimated_weight'    => $weight,
            'actual_weight'       => $weight,
            'status'              => 'completed',
            'payment_method'      => $method,
            'notes'               => null,
            'created_at'          => $date->copy()->setTime(rand(8, 18), rand(0, 59)),
            'updated_at'          => $date->copy()->addHours(rand(2, 12))->setTime(rand(8, 20), rand(0, 59)),
        ]);

        // Buat transaction
        $txId = DB::table('transactions')->insertGetId([
            'order_id'     => $orderId,
            'actual_weight'=> $weight,
            'price_per_kg' => $pricePerKg,
            'subtotal'     => $subtotal,
            'total_amount' => $total,
            'created_at'   => $date->copy()->setTime(rand(8, 18), rand(0, 59)),
            'updated_at'   => $date->copy()->addHours(rand(2, 12))->setTime(rand(8, 20), rand(0, 59)),
        ]);

        // Buat payment (always paid for historical data)
        DB::table('payments')->insert([
            'transaction_id' => $txId,
            'payment_method' => $method,
            'status'         => 'paid',
            'paid_at'        => $date->copy()->addHours(rand(0, 4))->setTime(rand(8, 22), rand(0, 59)),
            'created_at'     => $date->copy()->setTime(rand(8, 18), rand(0, 59)),
            'updated_at'     => $date->copy()->addHours(rand(1, 8))->setTime(rand(8, 22), rand(0, 59)),
        ]);

        $insertedCount++;
        $totalRevenue += $total;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Summary
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

$avgPerDay = round($totalRevenue / 180, 0);
$avgPerMonth = round($totalRevenue / 6, 0);  // 180/30 ≈ 6 bulan

echo "✅ Data Seeded Successfully!\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 STATISTICS:\n";
echo "  • Total Transaksi: " . number_format($insertedCount) . "\n";
echo "  • Total Revenue: Rp " . number_format((int)$totalRevenue, 0, ',', '.') . "\n";
echo "  • Rata-rata/hari: Rp " . number_format($avgPerDay, 0, ',', '.') . "\n";
echo "  • Rata-rata/bulan: Rp " . number_format($avgPerMonth, 0, ',', '.') . "\n";
echo "  • Periode: 180 hari\n";
echo "\n";
echo "🎯 EXPECTED ML PREDICTIONS:\n";
echo "  • Revenue 30-hari: ~Rp " . number_format((int)($avgPerDay * 30), 0, ',', '.') . "\n";
echo "  • Revenue 90-hari: ~Rp " . number_format((int)($avgPerDay * 90), 0, ',', '.') . "\n";
echo "  • Orders/hari avg: ~" . round($insertedCount / 180) . " orders/hari\n";
echo "\n";
echo "📌 Next Steps:\n";
echo "  1. Refresh halaman di browser (Ctrl+Shift+R)\n";
echo "  2. Buka Dashboard → Business Intelligence\n";
echo "  3. Lihat prediksi yang jauh lebih tinggi 📈\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
