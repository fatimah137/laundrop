# Setup Guide: ML Service Integration

Panduan lengkap untuk setup ML service dan mengintegrasikannya dengan Laundrop.

## 📋 Checklist Setup

- [ ] Setup Python virtual environment
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Test ML service
- [ ] Create Laravel ML Controller
- [ ] Create Laravel routes
- [ ] Setup React components
- [ ] Test end-to-end integration

---

## Step 1: Setup Python Environment

### 1.1 Navigate to ml-service
```bash
cd c:\xampp\htdocs\laundrop\ml-service
```

### 1.2 Create Virtual Environment
```bash
# Windows
python -m venv venv

# macOS/Linux
python3 -m venv venv
```

### 1.3 Activate Virtual Environment
```bash
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

Anda akan lihat `(venv)` di terminal prompt jika berhasil.

### 1.4 Upgrade pip
```bash
python -m pip install --upgrade pip
```

### 1.5 Install Requirements
```bash
pip install -r requirements.txt
```

Tunggu sampai semua package terinstall (bisa ambil beberapa menit karena scikit-learn cukup besar).

Verify installation:
```bash
python -c "import flask, sklearn, pandas, numpy; print('All packages OK!')"
```

---

## Step 2: Setup Environment Variables

### 2.1 Copy .env.example ke .env
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### 2.2 Edit .env file
```env
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
LARAVEL_API_URL=http://localhost:8000/api
LARAVEL_API_KEY=your_laravel_api_key_here
```

---

## Step 3: Test ML Service

### 3.1 Start Service
```bash
# Make sure venv is activated
python app.py
```

Anda akan lihat output seperti:
```
2024-01-15 10:30:00,000 - __main__ - INFO - Starting Laundrop ML Service on port 5000
 * Running on http://0.0.0.0:5000
```

### 3.2 Test Health Endpoint
Buka terminal/PowerShell baru:
```bash
curl http://localhost:5000/health
```

Atau gunakan Postman/browser:
- URL: `http://localhost:5000/health`
- Method: GET

Response yang diharapkan:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000000",
  "service": "Laundrop ML Service"
}
```

### 3.3 Test Prediction Endpoint
```bash
curl -X POST http://localhost:5000/api/predict/revenue \
  -H "Content-Type: application/json" \
  -d "{\"company_id\": 1, \"period_days\": 30, \"historical_data\": [100000, 120000, 95000, 110000, 125000, 98000, 115000, 120000, 105000, 125000]}"
```

---

## Step 4: Create Laravel ML Controller

### 4.1 Generate Controller
```bash
cd laundrop-api
php artisan make:controller MLController --api
```

### 4.2 Edit Controller (app/Http/Controllers/MLController.php)
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\Company;
use App\Models\Order;
use App\Models\Service;
use Illuminate\Support\Facades\Auth;

class MLController extends Controller
{
    protected $mlServiceUrl = 'http://localhost:5000/api';
    
    /**
     * Get revenue prediction for company
     */
    public function predictRevenue(Request $request, Company $company)
    {
        // Authorize
        $this->authorize('view', $company);
        
        try {
            // Get historical revenue data (last 90 days)
            $orders = $company->orders()
                ->where('status', 'completed')
                ->where('completed_at', '>=', now()->subDays(90))
                ->orderBy('completed_at')
                ->pluck('total_amount')
                ->toArray();
            
            if (count($orders) < 5) {
                return response()->json([
                    'error' => 'Insufficient data',
                    'message' => 'Need at least 5 orders untuk prediction'
                ], 422);
            }
            
            // Convert to numeric array
            $historicalData = array_map('floatval', $orders);
            
            // Call ML Service
            $response = Http::post($this->mlServiceUrl . '/predict/revenue', [
                'company_id' => $company->id,
                'period_days' => $request->get('period_days', 30),
                'historical_data' => $historicalData
            ]);
            
            if ($response->failed()) {
                throw new \Exception('ML Service error: ' . $response->body());
            }
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            \Log::error('Revenue prediction error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Prediction failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get demand forecast for company
     */
    public function forecastDemand(Request $request, Company $company)
    {
        $this->authorize('view', $company);
        
        try {
            $serviceType = $request->get('service_type', 'all');
            $days = $request->get('days', 7);
            
            // Get historical order count
            $query = $company->orders()
                ->where('status', 'completed')
                ->where('completed_at', '>=', now()->subDays(30));
            
            if ($serviceType !== 'all') {
                $query->whereHas('services', function($q) use ($serviceType) {
                    $q->where('type', $serviceType);
                });
            }
            
            $orders = $query->pluck('id')
                ->countBy(function($item) {
                    return \Carbon\Carbon::parse($item)->format('d');
                })
                ->values()
                ->toArray();
            
            if (empty($orders)) {
                return response()->json([
                    'error' => 'No data',
                    'message' => 'No completed orders found'
                ], 422);
            }
            
            // Call ML Service
            $response = Http::post($this->mlServiceUrl . '/predict/demand', [
                'company_id' => $company->id,
                'service_type' => $serviceType,
                'period_days' => $days,
                'historical_orders' => $orders
            ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            \Log::error('Demand forecast error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Forecast failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get churn risk prediction
     */
    public function predictChurn(Request $request, Company $company)
    {
        $this->authorize('view', $company);
        
        try {
            $customerId = $request->get('customer_id');
            
            if (!$customerId) {
                return response()->json([
                    'error' => 'Missing customer_id'
                ], 400);
            }
            
            // Get customer data
            $customer = User::find($customerId);
            if (!$customer) {
                return response()->json([
                    'error' => 'Customer not found'
                ], 404);
            }
            
            // Get metrics
            $lastOrder = $customer->orders()
                ->where('company_id', $company->id)
                ->latest('completed_at')
                ->first();
            
            $daysLastOrder = $lastOrder 
                ? now()->diffInDays($lastOrder->completed_at) 
                : 999;
            
            $totalOrders = $customer->orders()
                ->where('company_id', $company->id)
                ->count();
            
            $avgOrderValue = $customer->orders()
                ->where('company_id', $company->id)
                ->avg('total_amount') ?? 0;
            
            $membershipDays = now()->diffInDays($customer->created_at);
            
            // Call ML Service
            $response = Http::post($this->mlServiceUrl . '/predict/churn', [
                'company_id' => $company->id,
                'days_last_order' => $daysLastOrder,
                'total_orders' => $totalOrders,
                'avg_order_value' => $avgOrderValue,
                'membership_days' => $membershipDays
            ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            \Log::error('Churn prediction error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Prediction failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get business recommendations
     */
    public function getRecommendations(Request $request, Company $company)
    {
        $this->authorize('view', $company);
        
        try {
            $period = $request->get('period', 30);
            
            // Gather metrics
            $orders = $company->orders()
                ->where('completed_at', '>=', now()->subDays($period))
                ->get();
            
            $totalRevenue = $orders->sum('total_amount');
            $orderCount = $orders->count();
            $avgOrderValue = $orderCount > 0 ? $totalRevenue / $orderCount : 0;
            $customerCount = $orders->pluck('user_id')->unique()->count();
            
            // Calculate churn rate (customers who haven't ordered in 30 days)
            $totalCustomers = $company->customers()->count();
            $churnedCustomers = $this->getChurnedCustomers($company, 30);
            $churnRate = $totalCustomers > 0 ? $churnedCustomers / $totalCustomers : 0;
            
            // Call ML Service
            $response = Http::post($this->mlServiceUrl . '/predict/recommendation', [
                'company_id' => $company->id,
                'total_revenue' => $totalRevenue,
                'order_count' => $orderCount,
                'avg_order_value' => $avgOrderValue,
                'customer_count' => $customerCount,
                'churn_rate' => $churnRate
            ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            \Log::error('Recommendation error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Recommendation failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get models status
     */
    public function modelsStatus()
    {
        try {
            $response = Http::get($this->mlServiceUrl . '/models/status');
            return response()->json($response->json());
        } catch (\Exception $e) {
            \Log::error('Models status error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to get models status'
            ], 500);
        }
    }
    
    /**
     * Helper: Get churned customers count
     */
    private function getChurnedCustomers(Company $company, $days = 30)
    {
        // Customers yang tidak ada order dalam N hari terakhir
        $allCustomers = $company->customers()->pluck('id');
        $activeCustomers = $company->orders()
            ->where('completed_at', '>=', now()->subDays($days))
            ->pluck('user_id')
            ->unique();
        
        return $allCustomers->diff($activeCustomers)->count();
    }
    
    /**
     * Train revenue model (admin only)
     */
    public function trainRevenueModel(Request $request, Company $company)
    {
        $this->authorize('update', $company);
        
        try {
            // Get training data
            $orders = $company->orders()
                ->where('status', 'completed')
                ->orderBy('completed_at')
                ->get(['total_amount', 'completed_at']);
            
            if ($orders->count() < 10) {
                return response()->json([
                    'error' => 'Insufficient data',
                    'message' => 'Need at least 10 orders untuk training'
                ], 422);
            }
            
            $trainingData = [
                'dates' => $orders->pluck('completed_at')->map(fn($d) => $d->toDateString())->toArray(),
                'revenues' => $orders->pluck('total_amount')->map('floatval')->toArray()
            ];
            
            // Call ML Service
            $response = Http::post($this->mlServiceUrl . '/train/revenue', [
                'company_id' => $company->id,
                'training_data' => $trainingData
            ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            \Log::error('Model training error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Training failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
```

### 4.3 Create Routes (routes/api.php)
```php
// Add ke routes/api.php - dalam middleware auth:sanctum
Route::middleware('auth:sanctum')->prefix('ml')->group(function () {
    Route::get('predict/revenue/{company}', [App\Http\Controllers\MLController::class, 'predictRevenue']);
    Route::get('predict/demand/{company}', [App\Http\Controllers\MLController::class, 'forecastDemand']);
    Route::get('predict/churn/{company}', [App\Http\Controllers\MLController::class, 'predictChurn']);
    Route::get('recommendations/{company}', [App\Http\Controllers\MLController::class, 'getRecommendations']);
    Route::get('models/status', [App\Http\Controllers\MLController::class, 'modelsStatus']);
    
    // Admin only
    Route::post('train/revenue/{company}', [App\Http\Controllers\MLController::class, 'trainRevenueModel']);
});
```

---

## Step 5: Create React Components

### 5.1 Create ML Service Hook (src/services/mlService.js)
```javascript
import { API_BASE_URL } from '@/config';

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
});

export const mlService = {
    // Revenue Prediction
    getRevenuePrediction: async (companyId, periodDays = 30) => {
        const response = await fetch(
            `${API_BASE_URL}/ml/predict/revenue/${companyId}?period_days=${periodDays}`,
            { headers: getHeaders() }
        );
        if (!response.ok) throw new Error('Revenue prediction failed');
        return response.json();
    },
    
    // Demand Forecast
    getDemandForecast: async (companyId, serviceType = 'all', days = 7) => {
        const response = await fetch(
            `${API_BASE_URL}/ml/predict/demand/${companyId}?service_type=${serviceType}&days=${days}`,
            { headers: getHeaders() }
        );
        if (!response.ok) throw new Error('Demand forecast failed');
        return response.json();
    },
    
    // Churn Prediction
    getChurnPrediction: async (companyId, customerId) => {
        const response = await fetch(
            `${API_BASE_URL}/ml/predict/churn/${companyId}?customer_id=${customerId}`,
            { headers: getHeaders() }
        );
        if (!response.ok) throw new Error('Churn prediction failed');
        return response.json();
    },
    
    // Business Recommendations
    getRecommendations: async (companyId, period = 30) => {
        const response = await fetch(
            `${API_BASE_URL}/ml/recommendations/${companyId}?period=${period}`,
            { headers: getHeaders() }
        );
        if (!response.ok) throw new Error('Recommendations failed');
        return response.json();
    },
    
    // Models Status
    getModelsStatus: async () => {
        const response = await fetch(
            `${API_BASE_URL}/ml/models/status`,
            { headers: getHeaders() }
        );
        if (!response.ok) throw new Error('Models status failed');
        return response.json();
    }
};
```

### 5.2 Create ML Dashboard Component
```jsx
// src/pages/owner/MLDashboard/MLDashboard.jsx
import { useState, useEffect } from 'react';
import { mlService } from '@/services/mlService';
import RevenuePredictionCard from './components/RevenuePredictionCard';
import DemandForecastCard from './components/DemandForecastCard';
import RecommendationsCard from './components/RecommendationsCard';
import './MLDashboard.css';

export default function MLDashboard() {
    const [predictions, setPredictions] = useState(null);
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const companyId = useCompanyId(); // Get from context/props
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [revenue, demand, recs] = await Promise.all([
                    mlService.getRevenuePrediction(companyId),
                    mlService.getDemandForecast(companyId),
                    mlService.getRecommendations(companyId)
                ]);
                
                setPredictions({ revenue, demand });
                setRecommendations(recs);
            } catch (err) {
                setError(err.message);
                console.error('ML Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
        
        // Refresh every 1 hour
        const interval = setInterval(fetchData, 3600000);
        return () => clearInterval(interval);
    }, [companyId]);
    
    if (loading) return <div className="loading">Loading predictions...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    
    return (
        <div className="ml-dashboard">
            <h1>Business Intelligence Dashboard</h1>
            <p className="subtitle">Prediksi dan rekomendasi berbasis AI untuk bisnis Anda</p>
            
            <div className="dashboard-grid">
                <RevenuePredictionCard data={predictions?.revenue} />
                <DemandForecastCard data={predictions?.demand} />
                <RecommendationsCard data={recommendations} />
            </div>
        </div>
    );
}

// Helper hook
function useCompanyId() {
    const { company } = useContext(CompanyContext);
    return company?.id;
}
```

### 5.3 Revenue Prediction Card Component
```jsx
// src/pages/owner/MLDashboard/components/RevenuePredictionCard.jsx
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function RevenuePredictionCard({ data }) {
    if (!data?.prediction) return null;
    
    const { predicted_total, predicted_daily_average, trend, confidence } = data.prediction;
    const isUpTrend = trend === 'up';
    
    return (
        <div className="prediction-card revenue-card">
            <div className="card-header">
                <h3>Revenue Prediction</h3>
                <span className="confidence">{Math.round(confidence * 100)}% confident</span>
            </div>
            
            <div className="prediction-value">
                <span className="label">30 Hari ke depan</span>
                <span className="value">
                    Rp {predicted_total.toLocaleString('id-ID', {
                        maximumFractionDigits: 0
                    })}
                </span>
            </div>
            
            <div className="daily-average">
                <span className="label">Rata-rata harian</span>
                <span className="value">
                    Rp {predicted_daily_average.toLocaleString('id-ID', {
                        maximumFractionDigits: 0
                    })}
                </span>
            </div>
            
            <div className={`trend ${trend}`}>
                {isUpTrend ? 
                    <TrendingUp className="icon" /> : 
                    <TrendingDown className="icon" />
                }
                <span>{trend === 'up' ? 'Tren Naik' : trend === 'down' ? 'Tren Turun' : 'Stabil'}</span>
            </div>
        </div>
    );
}
```

---

## Step 6: Test End-to-End Integration

### 6.1 Test from Frontend
1. Navigate ke ML Dashboard di owner panel
2. Verify data loading dari API
3. Check console untuk errors

### 6.2 Debug steps
```bash
# Terminal 1: Start ML Service
cd ml-service
python app.py

# Terminal 2: Start Laravel (jika belum jalan)
cd laundrop-api
php artisan serve

# Terminal 3: Start React
cd laundrop-web
npm run dev

# Terminal 4: Check ML Service logs
curl http://localhost:5000/health
```

---

## 📊 Example Test Data

Untuk quick testing, bisa gunakan sample commands:

```bash
# Test Revenue Prediction
curl -X POST http://localhost:5000/api/predict/revenue \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "period_days": 30,
    "historical_data": [
      100000, 120000, 95000, 110000, 125000,
      98000, 115000, 120000, 105000, 125000,
      110000, 118000, 102000, 122000, 128000,
      105000, 125000, 120000, 110000, 115000
    ]
  }' | jq
```

---

## 🚀 Next Steps After Setup

1. ✅ ML Service running
2. ✅ Laravel integration done
3. **Next:** Create advanced visualizations in React
4. **Next:** Setup scheduled model retraining
5. **Next:** Add more ML models (seasonal analysis, etc)
6. **Next:** Deploy to production

---

## 🆘 Troubleshooting

### ML Service won't start
```bash
# Check Python version
python --version  # Should be 3.8+

# Check if port 5000 is available
netstat -ano | findstr :5000  # Windows
lsof -i :5000  # macOS/Linux
```

### Laravel can't connect to ML Service
```bash
# Make sure ML Service is running
curl http://localhost:5000/health

# Check firewall settings
# Ensure localhost:5000 is accessible
```

### CORS errors in React
```
# In ml-service/.env, ensure:
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
```

---

Untuk pertanyaan lebih lanjut, refer ke [README.md](./README.md) utama atau konsultasi dengan tim development.
