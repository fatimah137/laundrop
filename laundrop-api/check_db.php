<?php
require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$orders = DB::table('orders')->count();
$transactions = DB::table('transactions')
    ->join('payments', 'transactions.id', '=', 'payments.transaction_id')
    ->where('payments.status', 'paid')
    ->count();

$revenue = DB::table('transactions')
    ->join('payments', 'transactions.id', '=', 'payments.transaction_id')
    ->where('payments.status', 'paid')
    ->sum('transactions.total_amount');

echo "📊 DATABASE STATUS:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Total Orders: " . number_format($orders) . "\n";
echo "Total Paid Transactions: " . number_format($transactions) . "\n";
echo "Total Revenue: Rp " . number_format((int)$revenue, 0, ',', '.') . "\n";
if ($transactions > 0) {
    echo "Avg Revenue per Tx: Rp " . number_format((int)($revenue / $transactions), 0, ',', '.') . "\n";
    echo "Avg Daily Revenue: Rp " . number_format((int)($revenue / 180), 0, ',', '.') . "\n";
}
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
