// Laravel Trait - Copy ke app/Traits/MLIntegration.php
// Untuk memudahkan integrasi dengan ML Service

<?php

namespace App\Traits;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait MLIntegration
{
    /**
     * Base URL untuk ML Service
     */
    protected function mlServiceUrl()
    {
        return config('services.ml.url', 'http://localhost:5000/api');
    }
    
    /**
     * Call ML Service endpoint
     */
    protected function callMLService($endpoint, array $data = [])
    {
        try {
            $url = $this->mlServiceUrl() . '/' . ltrim($endpoint, '/');
            
            Log::info('Calling ML Service', [
                'endpoint' => $endpoint,
                'company_id' => $data['company_id'] ?? null
            ]);
            
            $response = Http::timeout(30)
                ->post($url, $data);
            
            if ($response->failed()) {
                Log::error('ML Service error', [
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                throw new \Exception('ML Service error: ' . $response->body());
            }
            
            return $response->json();
            
        } catch (\Exception $e) {
            Log::error('ML Integration error: ' . $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Get historical revenue data
     */
    protected function getRevenueData($company, $days = 90)
    {
        return $company->orders()
            ->where('status', 'completed')
            ->where('completed_at', '>=', now()->subDays($days))
            ->orderBy('completed_at')
            ->pluck('total_amount')
            ->map('floatval')
            ->toArray();
    }
    
    /**
     * Get order count by day
     */
    protected function getOrderCountByDay($company, $days = 30)
    {
        return $company->orders()
            ->where('status', 'completed')
            ->where('completed_at', '>=', now()->subDays($days))
            ->get()
            ->groupBy(fn($order) => $order->completed_at->format('d'))
            ->map(fn($group) => $group->count())
            ->values()
            ->toArray();
    }
    
    /**
     * Get customer metrics
     */
    protected function getCustomerMetrics($company, $customerId, $period = 30)
    {
        $customer = $company->users()
            ->where('id', $customerId)
            ->first();
        
        if (!$customer) {
            throw new \Exception('Customer not found');
        }
        
        $orders = $customer->orders()
            ->where('company_id', $company->id)
            ->get();
        
        $lastOrder = $orders->sortByDesc('completed_at')->first();
        
        return [
            'days_last_order' => $lastOrder 
                ? now()->diffInDays($lastOrder->completed_at) 
                : 999,
            'total_orders' => $orders->count(),
            'avg_order_value' => $orders->avg('total_amount') ?? 0,
            'membership_days' => now()->diffInDays($customer->created_at)
        ];
    }
    
    /**
     * Get company metrics for recommendations
     */
    protected function getCompanyMetrics($company, $period = 30)
    {
        $orders = $company->orders()
            ->where('completed_at', '>=', now()->subDays($period))
            ->get();
        
        $totalRevenue = $orders->sum('total_amount');
        $orderCount = $orders->count();
        $customerCount = $orders->pluck('user_id')->unique()->count();
        
        // Calculate churn rate
        $totalCustomers = $company->users()->count();
        $churnedCustomers = $this->getChurnedCustomersCount($company, 30);
        $churnRate = $totalCustomers > 0 ? $churnedCustomers / $totalCustomers : 0;
        
        return [
            'total_revenue' => $totalRevenue,
            'order_count' => $orderCount,
            'avg_order_value' => $orderCount > 0 ? $totalRevenue / $orderCount : 0,
            'customer_count' => $customerCount,
            'churn_rate' => $churnRate
        ];
    }
    
    /**
     * Get churned customers count
     */
    protected function getChurnedCustomersCount($company, $days = 30)
    {
        $allCustomers = $company->users()->pluck('id')->toArray();
        $activeCustomers = $company->orders()
            ->where('completed_at', '>=', now()->subDays($days))
            ->pluck('user_id')
            ->unique()
            ->toArray();
        
        return count(array_diff($allCustomers, $activeCustomers));
    }
    
    /**
     * Format ML response untuk API
     */
    protected function formatMLResponse($data, $message = 'Success')
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ]);
    }
}

// ============================================
// Penggunaan di Controller:
// ============================================

/*
use App\Traits\MLIntegration;

class MLController extends Controller
{
    use MLIntegration;
    
    public function predictRevenue(Request $request, Company $company)
    {
        $this->authorize('view', $company);
        
        try {
            $revenueData = $this->getRevenueData($company, 90);
            
            if (count($revenueData) < 5) {
                return response()->json([
                    'error' => 'Insufficient data'
                ], 422);
            }
            
            $result = $this->callMLService('predict/revenue', [
                'company_id' => $company->id,
                'period_days' => $request->get('period_days', 30),
                'historical_data' => $revenueData
            ]);
            
            return $this->formatMLResponse($result['prediction']);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
*/
