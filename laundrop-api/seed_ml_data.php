<?php
/**
 * Seed data historis transaksi untuk ML Service (90 hari terakhir)
 * Jalankan: php seed_ml_data.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

echo "Seeding ML historical transaction data...\n";

// Ambil order yang sudah ada untuk dijadikan referensi customer & service
$existingOrders = DB::table('orders')
    ->where('status', 'completed')
    ->orWhere('status', 'washing_finished')
    ->select('id', 'customer_id', 'service_id', 'payment_method')
    ->limit(5)
    ->get();

// Ambil data service untuk pricing
$services = DB::table('services')->select('id', 'price_per_kg')->get()->keyBy('id');

// Ambil customer ids
$customerIds = DB::table('users')->where('role', 'customer')->pluck('id')->toArray();

if (empty($customerIds)) {
    echo "ERROR: Tidak ada customer di database!\n";
    exit(1);
}

$serviceIds = DB::table('services')->pluck('id')->toArray();
if (empty($serviceIds)) {
    echo "ERROR: Tidak ada service di database!\n";
    exit(1);
}

// Hapus data dummy lama (tandai dengan notes khusus pada orders)
// Agar aman, kita hanya insert tanpa hapus

$insertedCount = 0;
$today = Carbon::today();

// Generate 90 hari data — 2-5 transaksi per hari
for ($i = 89; $i >= 0; $i--) {
    $date = $today->copy()->subDays($i);
    
    // Weekend lebih banyak order
    $isWeekend = in_array($date->dayOfWeek, [0, 6]);
    $ordersPerDay = $isWeekend ? rand(4, 7) : rand(2, 5);

    for ($j = 0; $j < $ordersPerDay; $j++) {
        $customerId = $customerIds[array_rand($customerIds)];
        $serviceId  = $serviceIds[array_rand($serviceIds)];
        $weight     = rand(15, 60) / 10; // 1.5 - 6 kg
        $pricePerKg = $services[$serviceId]->price_per_kg ?? 7000;
        $subtotal   = $weight * $pricePerKg;
        $deliveryFee= rand(0, 1) ? 5000 : 0;
        $total      = $subtotal + $deliveryFee;
        $method     = rand(0, 1) ? 'cash' : 'qris';

        // Buat order dummy
        $orderId = DB::table('orders')->insertGetId([
            'order_number'        => 'ML-' . $date->format('ymd') . '-' . str_pad($insertedCount + 1, 4, '0', STR_PAD_LEFT),
            'customer_id'         => $customerId,
            'service_id'          => $serviceId,
            'pickup_address'      => 'Jl. Sample No. ' . rand(1, 100),
            'pickup_lat'          => null,
            'pickup_lng'          => null,
            'pickup_date'         => $date->toDateString(),
            'pickup_time'         => sprintf('%02d:00:00', rand(8, 17)),
            'delivery_distance_km'=> rand(10, 50) / 10,
            'delivery_fee'        => $deliveryFee,
            'estimated_weight'    => $weight,
            'actual_weight'       => $weight,
            'status'              => 'completed',
            'payment_method'      => $method,
            'notes'               => null,
            'created_at'          => $date->copy()->setHour(rand(8, 17)),
            'updated_at'          => $date->copy()->setHour(rand(8, 18)),
        ]);

        // Buat transaction
        $txId = DB::table('transactions')->insertGetId([
            'order_id'     => $orderId,
            'actual_weight'=> $weight,
            'price_per_kg' => $pricePerKg,
            'subtotal'     => $subtotal,
            'total_amount' => $total,
            'created_at'   => $date->copy()->setHour(rand(8, 18)),
            'updated_at'   => $date->copy()->setHour(rand(8, 18)),
        ]);

        // Buat payment (paid)
        DB::table('payments')->insert([
            'transaction_id' => $txId,
            'payment_method' => $method,
            'status'         => 'paid',
            'paid_at'        => $date->copy()->setHour(rand(9, 20)),
            'created_at'     => $date->copy()->setHour(rand(8, 18)),
            'updated_at'     => $date->copy()->setHour(rand(8, 18)),
        ]);

        $insertedCount++;
    }
}

echo "✅ Selesai! Total inserted: {$insertedCount} transaksi selama 90 hari.\n";
echo "Sekarang refresh halaman Business AI di dashboard.\n";
