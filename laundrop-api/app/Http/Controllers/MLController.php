<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MLController extends Controller
{
    private string $mlServiceUrl;

    public function __construct()
    {
        $this->mlServiceUrl = config('services.ml.url', 'http://localhost:5000/api');
    }

    /**
     * Prediksi revenue untuk N hari ke depan.
     * GET /admin/ml/predict/revenue?days=30&history_days=90
     */
    public function predictRevenue(Request $request): JsonResponse
    {
        $periodDays  = (int) $request->query('days', 30);
        $historyDays = (int) $request->query('history_days', 90);

        // Ambil data revenue harian dari transaksi yang sudah dibayar
        $rows = DB::table('transactions')
            ->join('payments', 'transactions.id', '=', 'payments.transaction_id')
            ->where('payments.status', 'paid')
            ->where('transactions.created_at', '>=', now()->subDays($historyDays))
            ->selectRaw('DATE(transactions.created_at) as date, COALESCE(SUM(transactions.total_amount), 0) as revenue')
            ->groupByRaw('DATE(transactions.created_at)')
            ->orderBy('date')
            ->get();

        if ($rows->count() < 5) {
            return $this->error(
                'Data historis tidak cukup. Butuh minimal 5 hari data transaksi.',
                422
            );
        }

        $historicalData = $rows->pluck('revenue')->map(fn ($v) => (float) $v)->values()->toArray();

        $result = $this->callML('predict/revenue', [
            'company_id'      => 1,
            'period_days'     => $periodDays,
            'historical_data' => $historicalData,
        ]);

        if (! $result) {
            return $this->error('ML Service tidak dapat dihubungi.', 503);
        }

        return $this->success($result['prediction'] ?? $result);
    }

    /**
     * Prediksi demand (jumlah order) per hari untuk N hari ke depan.
     * GET /admin/ml/predict/demand?days=7&history_days=30&service_id=
     */
    public function predictDemand(Request $request): JsonResponse
    {
        $periodDays  = (int) $request->query('days', 7);
        $historyDays = (int) $request->query('history_days', 30);
        $serviceId   = $request->query('service_id');

        $query = DB::table('orders')
            ->where('orders.created_at', '>=', now()->subDays($historyDays))
            ->whereNotIn('orders.status', ['cancelled']);

        if ($serviceId) {
            $query->where('orders.service_id', $serviceId);
        }

        $rows = $query
            ->selectRaw('DATE(orders.created_at) as date, COUNT(*) as total')
            ->groupByRaw('DATE(orders.created_at)')
            ->orderBy('date')
            ->get();

        if ($rows->count() < 5) {
            return $this->error(
                'Data historis tidak cukup. Butuh minimal 5 hari data order.',
                422
            );
        }

        $serviceType = $serviceId
            ? (DB::table('services')->where('id', $serviceId)->value('name') ?? 'unknown')
            : 'all';

        $result = $this->callML('predict/demand', [
            'company_id'        => 1,
            'service_type'      => $serviceType,
            'period_days'       => $periodDays,
            'historical_orders' => $rows->pluck('total')->map(fn ($v) => (int) $v)->values()->toArray(),
        ]);

        if (! $result) {
            return $this->error('ML Service tidak dapat dihubungi.', 503);
        }

        return $this->success($result['prediction'] ?? $result);
    }

    /**
     * Hitung churn risk untuk semua customer atau satu customer.
     * GET /admin/ml/predict/churn?customer_id=
     */
    public function predictChurn(Request $request): JsonResponse
    {
        $customerId = $request->query('customer_id');

        if ($customerId) {
            // Churn risk untuk satu customer
            $metrics = $this->getCustomerChurnMetrics((int) $customerId);
            if (! $metrics) {
                return $this->error('Customer tidak ditemukan.', 404);
            }

            $result = $this->callML('predict/churn', $metrics);
            if (! $result) {
                return $this->error('ML Service tidak dapat dihubungi.', 503);
            }

            return $this->success($result['prediction'] ?? $result);
        }

        // Batch: hitung churn risk untuk semua customer aktif (max 50)
        $customers = DB::table('users')
            ->where('role', 'customer')
            ->select('id', 'name', 'created_at')
            ->limit(50)
            ->get();

        $results = [];
        foreach ($customers as $customer) {
            $metrics = $this->getCustomerChurnMetrics($customer->id);
            if (! $metrics) {
                continue;
            }

            $ml = $this->callML('predict/churn', $metrics);
            if ($ml) {
                $results[] = [
                    'customer_id'   => $customer->id,
                    'customer_name' => $customer->name,
                    'churn_risk'    => $ml['prediction'] ?? null,
                ];
            }
        }

        // Urutkan dari risiko tertinggi
        usort($results, fn ($a, $b) =>
            ($b['churn_risk']['churn_risk_score'] ?? 0) <=> ($a['churn_risk']['churn_risk_score'] ?? 0)
        );

        return $this->success($results);
    }

    /**
     * Rekomendasi bisnis berdasarkan performa 30 hari terakhir.
     * GET /admin/ml/recommendations?period=30
     */
    public function getRecommendations(Request $request): JsonResponse
    {
        $period = (int) $request->query('period', 30);
        $period = min(max($period, 7), 365); // clamp 7-365 hari

        $startDate = now()->subDays($period)->toDateString();

        // Revenue total
        $totalRevenue = (float) DB::table('transactions')
            ->join('payments', 'transactions.id', '=', 'payments.transaction_id')
            ->where('payments.status', 'paid')
            ->where('transactions.created_at', '>=', $startDate)
            ->sum('transactions.total_amount');

        // Order count
        $orderCount = DB::table('orders')
            ->where('created_at', '>=', $startDate)
            ->whereNotIn('status', ['cancelled'])
            ->count();

        // Unique active customers dalam periode ini
        $activeCustomers = DB::table('orders')
            ->where('created_at', '>=', $startDate)
            ->whereNotIn('status', ['cancelled'])
            ->distinct()
            ->count('customer_id');

        // Total customer terdaftar
        $totalCustomers = DB::table('users')->where('role', 'customer')->count();

        // Churn rate: customer terdaftar yang tidak order dalam periode ini
        $churnedCount  = max(0, $totalCustomers - $activeCustomers);
        $churnRate     = $totalCustomers > 0 ? round($churnedCount / $totalCustomers, 4) : 0;

        $avgOrderValue = $orderCount > 0 ? round($totalRevenue / $orderCount, 2) : 0;

        $result = $this->callML('predict/recommendation', [
            'company_id'      => 1,
            'total_revenue'   => $totalRevenue,
            'order_count'     => $orderCount,
            'avg_order_value' => $avgOrderValue,
            'customer_count'  => $activeCustomers,
            'churn_rate'      => $churnRate,
        ]);

        if (! $result) {
            return $this->error('ML Service tidak dapat dihubungi.', 503);
        }

        // Sertakan ringkasan metrik juga
        return $this->success([
            'period_days'    => $period,
            'summary' => [
                'total_revenue'   => $totalRevenue,
                'order_count'     => $orderCount,
                'avg_order_value' => $avgOrderValue,
                'active_customers'=> $activeCustomers,
                'churn_rate'      => $churnRate,
            ],
            'recommendations' => $result['recommendations'] ?? [],
        ]);
    }

    /**
     * Status dan daftar model ML yang sudah di-train.
     * GET /admin/ml/models/status
     */
    public function modelsStatus(): JsonResponse
    {
        $result = Http::timeout(10)->get($this->mlServiceUrl . '/models/status');

        if ($result->failed()) {
            return $this->error('ML Service tidak dapat dihubungi.', 503);
        }

        return $this->success($result->json());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /**
     * Kirim POST request ke ML service.
     * Return array hasil, atau null jika gagal.
     */
    private function callML(string $endpoint, array $payload): ?array
    {
        try {
            $response = Http::timeout(30)
                ->post("{$this->mlServiceUrl}/{$endpoint}", $payload);

            if ($response->failed()) {
                Log::error("ML Service error [{$endpoint}]", [
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error("ML Service unreachable [{$endpoint}]: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Kumpulkan metrik churn untuk satu customer.
     */
    private function getCustomerChurnMetrics(int $customerId): ?array
    {
        $customer = DB::table('users')
            ->where('id', $customerId)
            ->where('role', 'customer')
            ->select('id', 'created_at')
            ->first();

        if (! $customer) {
            return null;
        }

        $orders = DB::table('orders')
            ->where('customer_id', $customerId)
            ->whereNotIn('status', ['cancelled'])
            ->select('created_at')
            ->orderByDesc('created_at')
            ->get();

        $lastOrder       = $orders->first();
        $daysLastOrder   = $lastOrder
            ? (int) Carbon::parse($lastOrder->created_at)->diffInDays(now())
            : 999;

        $totalOrders     = $orders->count();
        $membershipDays  = (int) Carbon::parse($customer->created_at)->diffInDays(now());

        $avgOrderValue   = (float) DB::table('transactions')
            ->join('orders', 'orders.id', '=', 'transactions.order_id')
            ->where('orders.customer_id', $customerId)
            ->avg('transactions.total_amount') ?? 0;

        return [
            'company_id'       => 1,
            'days_last_order'  => $daysLastOrder,
            'total_orders'     => $totalOrders,
            'avg_order_value'  => round($avgOrderValue, 2),
            'membership_days'  => $membershipDays,
        ];
    }
}
