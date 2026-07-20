# ML Service - Arsitektur & Quick Reference

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                   │
│                    laundrop-web/src/pages                       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ML Dashboard / Owner Panel                            │    │
│  │  - Revenue Predictions                                 │    │
│  │  - Demand Forecasts                                    │    │
│  │  - Churn Predictions                                   │    │
│  │  - Business Recommendations                            │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓ (HTTP)                               │
│  src/services/mlService.js                                      │
└─────────────────────────────────────────────────────────────────┘
                           ↓ HTTP Request
                    (Sanctum Token Auth)
┌─────────────────────────────────────────────────────────────────┐
│               Laravel API (Port 8000)                           │
│               laundrop-api/app/Http/Controllers                 │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  MLController.php                                      │    │
│  │  • predictRevenue()      - routes/api.php             │    │
│  │  • forecastDemand()      - /ml/predict/revenue        │    │
│  │  • predictChurn()        - /ml/predict/demand         │    │
│  │  • getRecommendations()  - /ml/predict/churn          │    │
│  │  • trainRevenueModel()   - /ml/recommendations         │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Eloquent ORM                                         │        │
│  │ • Fetch orders, customers, transactions             │        │
│  │ • Query building & aggregation                       │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
           ↓ HTTP Request (POST JSON)        ↓ Database Query
        (Company & Order Data)               (Read-only)
┌─────────────────────────────────────────────────────────────────┐
│              MySQL Database                                     │
│              (laundrop database)                                │
│                                                                 │
│  • orders (total_amount, completed_at, etc)                    │
│  • users (customers data)                                      │
│  • services                                                    │
│  • transactions                                                │
│  • companies                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         Python ML Service (Port 5000) ← You are here            │
│         ml-service/                                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Flask Application (app.py)                             │    │
│  │ • CORS enabled                                         │    │
│  │ • Error handling                                       │    │
│  │ • Health check endpoint                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ API Routes (api/routes.py)                             │    │
│  │ • /api/predict/revenue   [POST]                        │    │
│  │ • /api/predict/demand    [POST]                        │    │
│  │ • /api/predict/churn     [POST]                        │    │
│  │ • /api/predict/recommendation [POST]                   │    │
│  │ • /api/train/revenue     [POST]                        │    │
│  │ • /api/train/demand      [POST]                        │    │
│  │ • /api/models/status     [GET]                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Controllers                                            │    │
│  │ • prediction_controller.py                             │    │
│  │ • training_controller.py                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ ML Algorithms (scikit-learn, numpy, pandas)            │    │
│  │ • Linear Regression (Revenue)                          │    │
│  │ • Moving Average (Demand)                              │    │
│  │ • Risk Scoring (Churn)                                 │    │
│  │ • Rule-based Logic (Recommendations)                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                          ↓                                       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Model Storage                                          │    │
│  │ • models/revenue_model_company_X.joblib               │    │
│  │ • models/demand_model_company_X_SERVICE.joblib         │    │
│  │ • Persisted with joblib (pickle)                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Configuration: config.py, .env                                 │
│  Utils: utils.py (LaravelIntegration, formatters)              │
│  Training: training/train_models.py (demo scripts)             │
└─────────────────────────────────────────────────────────────────┘
                      ↓ JSON Response
              (Predictions & Metrics)
┌─────────────────────────────────────────────────────────────────┐
│               Back to Laravel API                               │
│  → Response parsing & formatting                                │
│  → Pass to React frontend                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 Data Flow Example: Revenue Prediction

```
1. Owner clicks "Revenue Prediction" di Dashboard
   ↓
2. React calls: mlService.getRevenuePrediction(companyId, 30)
   ↓
3. Request dikirim ke Laravel:
   GET http://localhost:8000/api/ml/predict/revenue/1?period_days=30
   Headers: Authorization: Bearer <token>
   ↓
4. MLController.predictRevenue()
   • Query Database: last 90 days completed orders
   • Extract revenues: [100000, 120000, 95000, ...]
   ↓
5. POST ke ML Service:
   POST http://localhost:5000/api/predict/revenue
   Body: {
     "company_id": 1,
     "period_days": 30,
     "historical_data": [100000, 120000, ...]
   }
   ↓
6. ML Service Processing:
   • Calculate average: 107500
   • Calculate trend: +2%
   • Apply formula: daily_avg * (1 + trend * 0.5)
   • Predict 30 days: 30 * predicted_daily
   ↓
7. Return Response:
   {
     "status": "success",
     "prediction": {
       "predicted_daily_average": 109462.50,
       "predicted_total": 3283875.00,
       "confidence": 0.75,
       "trend": "up"
     }
   }
   ↓
8. Laravel returns to React
   ↓
9. React displays in RevenuePredictionCard component
```

---

## 🔑 Key Files & Directories

### ML Service Structure
```
ml-service/
├── app.py                          # Main Flask app entry point
├── config.py                       # Configuration management
├── utils.py                        # Helper functions
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── README.md                       # Full documentation
├── SETUP_GUIDE.md                  # Setup instructions
│
├── api/                            # API implementation
│   ├── __init__.py
│   ├── routes.py                   # Route registration
│   └── controllers/
│       ├── __init__.py
│       ├── prediction_controller.py # Prediction endpoints
│       └── training_controller.py  # Training endpoints
│
├── training/                       # Model training scripts
│   ├── __init__.py
│   └── train_models.py             # Training implementations
│
├── models/                         # Stored ML models (.pkl)
│   └── .gitkeep
│
└── data/                           # Raw/training data
    └── .gitkeep
```

### Laravel Integration
```
laundrop-api/
├── app/Http/Controllers/
│   └── MLController.php            # New - handles ML requests
└── routes/
    └── api.php                     # Add ML routes here
```

### React Components
```
laundrop-web/src/
├── services/
│   └── mlService.js                # New - API calls
└── pages/owner/
    └── MLDashboard/                # New - Dashboard pages
        ├── MLDashboard.jsx
        └── components/
            ├── RevenuePredictionCard.jsx
            ├── DemandForecastCard.jsx
            └── RecommendationsCard.jsx
```

---

## 🚀 Quick Commands

### Start ML Service
```bash
cd ml-service

# Activate venv
venv\Scripts\activate           # Windows
source venv/bin/activate        # macOS/Linux

# Start server
python app.py                   # Development
gunicorn -w 4 app:app         # Production
```

### Test Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Revenue prediction
curl -X POST http://localhost:5000/api/predict/revenue \
  -H "Content-Type: application/json" \
  -d '{"company_id": 1, "period_days": 30, "historical_data": [100000, 120000]}'

# Run training demo
python training/train_models.py
```

### Check Models
```bash
# List trained models
ls models/

# Check model details
python -c "import joblib; m=joblib.load('models/revenue_model_company_1.joblib'); print(m)"
```

---

## 📊 API Endpoint Reference

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/health` | GET | Health check | No |
| `/api/predict/revenue` | POST | Revenue prediction | Yes (Laravel) |
| `/api/predict/demand` | POST | Demand forecasting | Yes (Laravel) |
| `/api/predict/churn` | POST | Churn prediction | Yes (Laravel) |
| `/api/predict/recommendation` | POST | Business recommendations | Yes (Laravel) |
| `/api/train/revenue` | POST | Train revenue model | Yes (Laravel) |
| `/api/train/demand` | POST | Train demand model | Yes (Laravel) |
| `/api/models/status` | GET | List trained models | Yes (Laravel) |

---

## 🔐 Authentication Flow

```
Client (React)
    ↓ sends token
Laravel API (auth:sanctum middleware)
    ↓ validates token
    ↓ authorized?
    ├─ YES: extract data from DB
    ├─ NO: return 401 Unauthorized
    ↓
ML Service (no auth - behind Laravel)
    ↓ receives verified data
    ↓ processes prediction
    ↓
Return to Laravel → Return to React
```

**Note:** ML Service tidak perlu authentication karena hanya diakses dari Laravel (internal).

---

## 🎯 Response Format

### Success Response
```json
{
  "status": "success",
  "data": { /* prediction/recommendation data */ },
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

### Error Response
```json
{
  "status": "error",
  "error": "Error description",
  "details": "Optional detailed error info"
}
```

---

## 📈 Performance Considerations

| Factor | Optimization |
|--------|---------------|
| **Large Datasets** | Aggregate in Laravel before sending |
| **Repeated Calls** | Cache predictions for 1 hour |
| **Slow Queries** | Index `completed_at`, `company_id` in orders table |
| **Model Loading** | Keep models in memory, don't reload each request |
| **API Latency** | Use async training for heavy models |

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Port 5000 already in use** | `lsof -i :5000` or `netstat -ano \| findstr :5000` |
| **CORS errors** | Check `CORS_ORIGINS` in config.py |
| **Import errors** | Ensure venv activated, pip install -r requirements.txt |
| **Insufficient data** | Need at least 5-10 historical data points |
| **Model not found** | Train model first via `/api/train/*` endpoint |
| **Timeout errors** | ML Service down or Laravel can't reach it |

---

## 🔄 Next Steps

- [ ] Setup Python environment (Step 1)
- [ ] Configure environment variables (Step 2)
- [ ] Test ML Service endpoints (Step 3)
- [ ] Create Laravel MLController (Step 4)
- [ ] Build React components (Step 5)
- [ ] Test end-to-end (Step 6)
- [ ] Deploy to production
- [ ] Monitor & optimize
- [ ] Add advanced ML models
- [ ] Implement scheduled retraining

---

## 📚 References

- [Full README](./README.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [scikit-learn Guide](https://scikit-learn.org/)
- [Laravel HTTP Client](https://laravel.com/docs/http-client)

---

Last Updated: 2024-01-15
