# Laundrop ML Service

Service machine learning terpisah untuk Laundrop, yang menyediakan prediksi dan insight bisnis untuk owner.

## 📋 Gambaran Umum

```
laundrop-web (React) 
    ↓
laundrop-api (Laravel) ←→ ml-service (Python Flask) ← You are here
    ↓                           ↓
  MySQL                   Model ML (.pkl)
```

## 🎯 Fitur

- **Revenue Prediction**: Prediksi revenue untuk periode mendatang
- **Demand Forecasting**: Prediksi demand untuk setiap service type
- **Churn Prediction**: Deteksi customer yang mungkin churn
- **Business Recommendations**: Rekomendasi aksi berdasarkan data

## 🛠️ Tech Stack

- **Python**: 3.9+
- **Framework**: Flask 3.0.0
- **ML Libraries**: scikit-learn, pandas, numpy
- **Model Storage**: joblib (.pkl files)

## 📁 Struktur Project

```
ml-service/
├── api/                          # API endpoints
│   ├── controllers/
│   │   ├── prediction_controller.py
│   │   ├── training_controller.py
│   │   └── __init__.py
│   ├── routes.py
│   └── __init__.py
├── training/                     # Training scripts
│   ├── train_models.py
│   └── __init__.py
├── models/                       # Stored ML models (.pkl)
│   └── .gitkeep
├── data/                         # Raw/training data
│   └── .gitkeep
├── app.py                        # Main Flask app
├── config.py                     # Configuration
├── utils.py                      # Utility functions
├── requirements.txt              # Python dependencies
├── .env.example                  # Environment variables template
├── .gitignore
└── README.md
```

## 🚀 Quickstart

### 1. Setup Python Environment

```bash
# Navigate ke ml-service folder
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Setup Environment Variables

```bash
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dengan konfigurasi Anda
# Minimal:
FLASK_ENV=development
PORT=5000
```

### 4. Run Service

```bash
python app.py
```

Server akan start di `http://localhost:5000`

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Predictions

#### 1. Revenue Prediction
```
POST /api/predict/revenue
Content-Type: application/json

{
  "company_id": 1,
  "period_days": 30,
  "historical_data": [100000, 120000, 95000, 110000, ...]
}

Response:
{
  "status": "success",
  "company_id": 1,
  "prediction": {
    "period_days": 30,
    "predicted_daily_average": 106250.50,
    "predicted_total": 3187515.00,
    "confidence": 0.75,
    "trend": "up"
  },
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

#### 2. Demand Prediction
```
POST /api/predict/demand
Content-Type: application/json

{
  "company_id": 1,
  "service_type": "regular_wash",
  "period_days": 7,
  "historical_orders": [5, 8, 6, 7, 9, 8, 7]
}

Response:
{
  "status": "success",
  "company_id": 1,
  "service_type": "regular_wash",
  "prediction": {
    "period_days": 7,
    "estimated_orders": 7,
    "range": {
      "min": 5,
      "max": 9
    },
    "confidence": 0.70
  },
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

#### 3. Churn Prediction
```
POST /api/predict/churn
Content-Type: application/json

{
  "company_id": 1,
  "days_last_order": 15,
  "total_orders": 25,
  "avg_order_value": 150000,
  "membership_days": 365
}

Response:
{
  "status": "success",
  "company_id": 1,
  "prediction": {
    "churn_risk_score": 0.214,
    "risk_level": "low",
    "days_since_last_order": 15,
    "total_orders": 25,
    "recommendation": "Monitor customer"
  },
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

#### 4. Business Recommendation
```
POST /api/predict/recommendation
Content-Type: application/json

{
  "company_id": 1,
  "total_revenue": 5000000,
  "order_count": 200,
  "avg_order_value": 25000,
  "customer_count": 50,
  "churn_rate": 0.05
}

Response:
{
  "status": "success",
  "company_id": 1,
  "metrics": {...},
  "recommendations": [
    {
      "category": "upsell",
      "message": "Revenue per customer masih rendah. Pertimbangkan upsell produk premium.",
      "priority": "high"
    },
    ...
  ],
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

### Training

#### 1. Train Revenue Model
```
POST /api/train/revenue
Content-Type: application/json

{
  "company_id": 1,
  "training_data": {
    "dates": ["2024-01-01", "2024-01-02", ...],
    "revenues": [100000, 120000, ...]
  }
}
```

#### 2. Train Demand Model
```
POST /api/train/demand
Content-Type: application/json

{
  "company_id": 1,
  "service_type": "regular_wash",
  "training_data": {
    "orders": [5, 8, 6, 7, 9, 8, 7, ...]
  }
}
```

#### 3. Get Models Status
```
GET /api/models/status
```

## 🔗 Integration dengan Laravel

### Di Laravel Api (laundrop-api)

Buat route baru untuk fetch data dan call ML service:

```php
// routes/api.php
Route::middleware('auth:sanctum')->prefix('ml')->group(function () {
    Route::get('revenue-prediction/{company}', [MLController::class, 'predictRevenue']);
    Route::get('demand-forecast/{company}', [MLController::class, 'forecastDemand']);
    Route::get('churn-risk/{company}', [MLController::class, 'predictChurn']);
    Route::get('recommendations/{company}', [MLController::class, 'getRecommendations']);
});
```

Buat MLController:

```php
// app/Http/Controllers/MLController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MLController extends Controller
{
    protected $mlServiceUrl = 'http://localhost:5000/api';
    
    public function predictRevenue($companyId)
    {
        // Gather historical data
        $company = Company::findOrFail($companyId);
        $orders = $company->orders()
            ->where('status', 'completed')
            ->pluck('total_amount')
            ->toArray();
        
        // Call ML Service
        $response = Http::post($this->mlServiceUrl . '/predict/revenue', [
            'company_id' => $companyId,
            'period_days' => 30,
            'historical_data' => $orders
        ]);
        
        return $response->json();
    }
    
    // ... methods lainnya
}
```

### Di React Frontend (laundrop-web)

Buat service untuk call Laravel API:

```javascript
// src/services/mlService.js
const API_BASE = 'http://localhost:8000/api/ml';

export const getRevenuePrediction = async (companyId) => {
    const response = await fetch(`${API_BASE}/revenue-prediction/${companyId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
};

export const getDemandForecast = async (companyId) => {
    const response = await fetch(`${API_BASE}/demand-forecast/${companyId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.json();
};

// ... methods lainnya
```

Gunakan di component:

```jsx
// src/pages/owner/Dashboard/MLDashboard.jsx
import { useEffect, useState } from 'react';
import { getRevenuePrediction, getDemandForecast } from '@/services/mlService';

export default function MLDashboard() {
    const [predictions, setPredictions] = useState(null);
    const companyId = useCompanyId(); // dari context/props
    
    useEffect(() => {
        const fetchPredictions = async () => {
            const [revenue, demand] = await Promise.all([
                getRevenuePrediction(companyId),
                getDemandForecast(companyId)
            ]);
            
            setPredictions({ revenue, demand });
        };
        
        fetchPredictions();
    }, [companyId]);
    
    if (!predictions) return <div>Loading...</div>;
    
    return (
        <div className="ml-dashboard">
            <h1>Business Intelligence Dashboard</h1>
            
            <div className="prediction-card">
                <h2>Revenue Prediction (30 days)</h2>
                <p className="value">
                    Rp {predictions.revenue.prediction.predicted_total.toLocaleString()}
                </p>
                <p className="trend">{predictions.revenue.prediction.trend}</p>
            </div>
            
            <div className="prediction-card">
                <h2>Demand Forecast</h2>
                <p className="value">
                    {predictions.demand.prediction.estimated_orders} orders
                </p>
            </div>
        </div>
    );
}
```

## 🧪 Testing API

### Menggunakan cURL

```bash
# Test health check
curl http://localhost:5000/health

# Test revenue prediction
curl -X POST http://localhost:5000/api/predict/revenue \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 1,
    "period_days": 30,
    "historical_data": [100000, 120000, 95000, 110000]
  }'
```

### Menggunakan Postman

1. Import requests ke Postman
2. Set base URL: `http://localhost:5000`
3. Test endpoints (postman collection tersedia di `/docs/postman-collection.json`)

## 🔧 Configuration

Edit `.env` untuk customize:

```env
# Flask
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

# Laravel Integration
LARAVEL_API_URL=http://localhost:8000/api
LARAVEL_API_KEY=your_api_key

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
```

## 📊 Training Models

### Demo Training

```bash
python training/train_models.py
```

Ini akan:
1. Generate sample data
2. Train revenue prediction model
3. Save model ke `models/revenue_model_company_1.joblib`
4. Show predictions

### Custom Training

Di Laravel/React, call training endpoint:

```
POST /api/train/revenue
{
  "company_id": 1,
  "training_data": {
    "revenues": [100000, 120000, 95000, ...]
  }
}
```

## 🚨 Error Handling

API akan return error responses yang konsisten:

```json
{
  "error": "Prediction failed",
  "details": "Error message details",
  "status": "error"
}
```

Common error codes:
- `400`: Bad request (missing/invalid data)
- `404`: Not found
- `500`: Server error

## 🔐 Security Considerations

1. **API Key**: Implementasikan API key authentication di production
2. **CORS**: Restrict origins sesuai environment
3. **Rate Limiting**: Add rate limiter untuk prevent abuse
4. **Input Validation**: Validate semua input sebelum processing
5. **Logging**: Log semua requests untuk audit trail

Contoh di production:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/api/predict/revenue', methods=['POST'])
@limiter.limit("100 per hour")
def predict_revenue():
    # ...
```

## 📦 Deployment

### Development
```bash
python app.py
```

### Production (menggunakan Gunicorn)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Atau dengan Docker:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## 📈 Performance Tips

1. **Model Caching**: Cache model di memory untuk repeated predictions
2. **Data Aggregation**: Pre-aggregate data di Laravel, tidak send raw data
3. **Async Processing**: Untuk heavy training, gunakan job queue
4. **Batch Predictions**: Support batch predictions untuk multiple companies

## 🐛 Troubleshooting

### Port sudah terpakai
```bash
# Find process on port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Import errors
```bash
# Ensure virtual environment aktif
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### CORS errors
- Pastikan `CORS_ORIGINS` di config include frontend URL
- Pastikan Flask-CORS properly configured

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request

## 📝 License

Bagian dari Laundrop Project

## 📞 Support

Untuk issues atau pertanyaan:
1. Check existing documentation
2. Review error logs
3. Contact development team

---

**Next Steps:**
1. Setup environment (follow Quickstart)
2. Run service: `python app.py`
3. Test endpoints dengan cURL/Postman
4. Integrate dengan Laravel API
5. Build frontend dashboard
