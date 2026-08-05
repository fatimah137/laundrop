# Tech Stack Laundrop - Dokumentasi Lengkap

## 📋 Ringkasan Umum
Laundrop adalah platform laundry profesional yang dibangun dengan arsitektur full-stack modern:
- **Frontend**: React + Vite (PWA)
- **Backend**: Laravel 12 + PHP 8.2
- **ML Service**: Flask + Python
- **Database**: SQLite
- **Payment Gateway**: Midtrans (QRIS)
- **AI Integration**: Google Gemini

---

## 🎨 FRONTEND (Laundrop Web)

### Framework & Build Tools
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 19.2.4 | UI Framework utama |
| React DOM | 19.2.4 | DOM rendering untuk React |
| Vite | 8.0.0 | Build tool & dev server |
| Vite PWA Plugin | 1.3.0 | Progressive Web App support |

### UI & Styling
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Recharts | 3.8.1 | Library grafik & chart (revenue, demand, churn) |
| Lucide React | 1.14.0 | Icon library SVG |
| Leaflet | 1.9.4 | Mapping library untuk tracking lokasi |
| React Leaflet | 5.0.0 | React wrapper untuk Leaflet |

### Routing & State Management
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React Router | 6.30.3 | Client-side routing |
| TanStack React Query | 5.100.1 | Server state management & caching |

### API & Data Transfer
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Axios | 1.13.6 | HTTP client untuk API calls |

### Export & Report Generation
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| jsPDF | 4.2.1 | Generate PDF reports |
| jsPDF autoTable | 5.0.8 | Table formatting di PDF |
| HTML to Image | 1.11.13 | Screenshot/render HTML ke image |

### QR Code & Scanning
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| QRCode.React | 4.2.0 | Generate QR code |
| html5-qrcode | 2.3.8 | QR code scanning dari kamera |

### Notification
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Sonner | 2.0.7 | Toast notification library |

### Development Tools
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| ESLint | 9.39.4 | Linting & code quality |
| ESLint Plugin React Hooks | 7.0.1 | Hooks best practices |
| ESLint Plugin React Refresh | 0.5.2 | Fast Refresh support |
| Vite React Plugin | 6.0.0 | React HMR support |
| @types/React | 19.2.14 | TypeScript types |
| @types/React DOM | 19.2.3 | TypeScript types |
| Globals | 17.4.0 | Global variables config |

### Package Manager
- **npm** (Node Package Manager)

### Build Scripts
- `npm run dev` - Development server dengan HMR
- `npm run build` - Production build
- `npm run lint` - Linting dengan ESLint
- `npm run preview` - Preview production build

---

## 🔧 BACKEND (Laundrop API)

### Framework & Core
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Laravel Framework | 12.0 | Web framework utama |
| PHP | 8.2+ | Server-side language |

### Authentication & Authorization
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Laravel Sanctum | 4.3 | API token authentication & CSRF protection |

### Payment Integration
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Midtrans PHP SDK | 2.6 | Payment gateway (QRIS, e-wallet, transfer bank) |

### Email & Communication
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Resend PHP SDK | 1.4 | Email service provider |

### Database
| Teknologi | Tipe | Fungsi |
|-----------|------|--------|
| SQLite | Relational DB | Development & production database |
| Laravel Migrations | - | Schema versioning |

### Queue & Jobs
| Teknologi | Implementasi | Fungsi |
|-----------|-------------|--------|
| Queue System | Database driver | Async job processing |

### Caching
| Teknologi | Driver | Fungsi |
|-----------|--------|--------|
| Cache System | Database | Application caching layer |

### Mail Configuration
- **Provider**: Gmail SMTP
- **Port**: 587 (TLS)
- **Authentication**: App password (2FA)

### Development Tools
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Laravel Tinker | 2.10.1 | Interactive shell untuk debugging |
| Laravel Pail | 1.2.2 | Tail log files real-time |
| Laravel Pint | 1.24 | Code formatter & fixer |
| Laravel Sail | 1.41 | Docker environment setup |
| PHPUnit | 11.5.50 | Unit testing framework |
| Mockery | 1.6 | Mocking library untuk tests |
| FakerPHP | 1.23 | Fake data generator untuk seeding |
| Nunomaduro Collision | 8.6 | Debugging assistant |

### Build & Deployment
| Teknologi | Fungsi |
|-----------|--------|
| Laravel Vite Plugin | Asset bundling dengan Vite |
| Composer | PHP Package manager |

### Database Schema
| Table | Fungsi |
|-------|--------|
| users | Customer & admin accounts |
| services | Laundry services (regular wash, dry clean, dll) |
| orders | Pesanan dari customer |
| order_status_logs | History status orders |
| transactions | Payment records |
| payments | Payment verification |
| ocr_scans | OCR data untuk item tracking |
| company_settings | Business configuration |

### Key Services & Features
- Authentication & authorization (Sanctum tokens)
- Order management system
- Payment processing (Midtrans QRIS)
- ML prediction endpoints (revenue, demand, churn)
- Recommendation engine
- Email notifications
- Real-time order tracking
- Admin dashboard APIs

### Build Scripts
- `composer install` - Install dependencies
- `php artisan serve` - Run development server
- `php artisan migrate` - Run database migrations
- `php artisan seed` - Seed database
- `php artisan queue:listen` - Listen to queued jobs
- `php artisan pail` - Monitor logs in real-time
- `composer test` - Run PHPUnit tests

---

## 🤖 ML SERVICE (Python)

### Framework & Core
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Python | 3.8+ | Programming language |
| Flask | 3.0.0 | Web framework untuk API |
| Flask CORS | 4.0.0 | CORS middleware |
| Gunicorn | 21.2.0 | Production WSGI server |
| Werkzeug | 3.0.1 | WSGI toolkit |

### Machine Learning
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| scikit-learn | 1.5.0+ | ML algorithms (linear regression, etc) |
| pandas | 2.1.3+ | Data manipulation & analysis |
| numpy | 2.0.0+ | Numerical computing |
| joblib | 1.3.2+ | Model persistence & serialization |

### Configuration & Environment
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| python-dotenv | 1.0.0 | Environment variables management |

### HTTP & Communication
| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| requests | 2.31.0 | HTTP library untuk external API calls |

### ML Models
| Model | Input | Output | Fungsi |
|-------|-------|--------|--------|
| Revenue Prediction | Historical daily revenue | Predicted total & daily avg | Forecasting revenue 30 hari ke depan |
| Demand Forecast | Historical order count | Estimated daily orders + range | Forecasting demand per service |
| Churn Prediction | Customer activity metrics | Churn risk score & level | Customer retention risk scoring |
| Recommendation Engine | Business metrics (revenue, churn) | Prioritized action recommendations | Actionable business insights |

### Model Serialization
- Format: joblib (.joblib)
- Location: `ml_models/` directory
- Models: churn_model, demand_model (regular_wash, all), revenue_model

### API Endpoints
- `POST /api/predict/revenue` - Revenue prediction
- `POST /api/predict/demand` - Demand forecasting
- `POST /api/predict/churn` - Churn risk assessment
- `POST /api/predict/recommendation` - Business recommendations
- `GET /api/models/status` - Model status & version

### Configuration Files
- `config.py` - Flask & app configuration
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies

---

## 🗄️ DATABASE

### Type
- **SQLite** (Development & Production)

### Key Tables
1. **users** - Customer & admin accounts
2. **services** - Laundry services catalog
3. **orders** - Customer orders
4. **order_status_logs** - Order history tracking
5. **transactions** - Financial transactions
6. **payments** - Payment records & verification
7. **ocr_scans** - Item scanning records
8. **company_settings** - Business configuration

### Relationships
- Users → Orders (1:many)
- Users → Transactions (1:many)
- Orders → Services (many:many)
- Orders → OrderStatusLogs (1:many)
- Orders → Payments (1:1)
- Orders → OCRScans (1:many)

---

## 🔐 Authentication & Security

| Teknologi | Implementasi | Fungsi |
|-----------|-------------|--------|
| Laravel Sanctum | Token-based | API authentication |
| CSRF Protection | Middleware | Form submission protection |
| Password Hashing | bcrypt | Secure password storage |
| CORS | Laravel config | Cross-origin request handling |

---

## 🌐 Third-Party Integrations

### Payment Gateway
| Service | Provider | Implementasi |
|---------|----------|-------------|
| Midtrans | Payment aggregator | QRIS, e-wallet, transfer bank |

### AI Service
| Service | Provider | Implementasi |
|---------|----------|-------------|
| Google Gemini | LLM API | Natural language insights untuk prediksi |

### Email
| Service | Provider | Implementasi |
|---------|----------|-------------|
| Gmail SMTP | Google | Transactional emails |

### Optional Services
| Service | Provider | Status |
|---------|----------|--------|
| Resend | Email API | Installed (alternative email provider) |

---

## 📦 Development & DevOps Tools

### Version Control
- Git
- GitHub (repository hosting)

### Package Managers
- **npm** (Node.js/JavaScript)
- **Composer** (PHP)
- **pip** (Python)

### Local Development Stack
- **XAMPP** (Apache, MySQL/SQLite, PHP)
- **Node.js + npm**
- **Python + venv**

### Environment Setup
- `.env` files for configuration
- `.env.example` as template
- Docker-ready (Laravel Sail available)

### Testing
- PHPUnit (Backend)
- ESLint (Frontend)
- No dedicated ML testing framework (inference-based)

### Monitoring & Logging
- Laravel Pail (real-time logs)
- Logging configuration in `config/logging.php`
- Application logs in `storage/logs/`

### Build & Deployment
- Vite (frontend build)
- Laravel Mix (asset pipeline)
- Gunicorn (ML service production)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│           LAUNDROP PLATFORM                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────┐  ┌───────────────┐   │
│  │  FRONTEND        │  │  BACKEND      │   │
│  │  (React + Vite)  │  │  (Laravel 12) │   │
│  │  - PWA           │  │  - Sanctum    │   │
│  │  - Charts        │  │  - Midtrans   │   │
│  │  - QR Scanning   │  │  - Queue Job  │   │
│  │  - Notifications │  │  - Caching    │   │
│  └────────┬─────────┘  └───────┬───────┘   │
│           │                    │           │
│           └────────┬───────────┘           │
│                    │                       │
│           ┌────────▼────────┐             │
│           │   REST API      │             │
│           │   (Axios)       │             │
│           └────────┬────────┘             │
│                    │                       │
│  ┌────────────────▼──────────────────┐    │
│  │   ML SERVICE (Flask + Python)     │    │
│  │   - Revenue Prediction            │    │
│  │   - Demand Forecasting            │    │
│  │   - Churn Risk Assessment         │    │
│  │   - Business Recommendations      │    │
│  └────────────────┬──────────────────┘    │
│                   │                        │
│  ┌────────────────▼──────────────────┐    │
│  │   INTEGRATIONS                    │    │
│  │   - Midtrans Payment              │    │
│  │   - Google Gemini AI              │    │
│  │   - Gmail SMTP                    │    │
│  └───────────────────────────────────┘    │
│                                             │
│  ┌───────────────────────────────────┐    │
│  │   DATABASE (SQLite)               │    │
│  │   - Users, Orders, Services       │    │
│  │   - Transactions, Payments        │    │
│  └───────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📊 Deployment Topology

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Reverse Proxy** | nginx/Apache | Load balancing & SSL termination |
| **Frontend** | Vite SPA | React application |
| **Backend** | Laravel + PHP-FPM | Business logic & APIs |
| **ML Service** | Gunicorn + Flask | ML predictions |
| **Database** | SQLite | Data persistence |
| **Cache** | Database | Session & data caching |
| **Queue** | Database | Job processing |

---

## 📝 Summary Tech Stack Table

### Frontend
- **Language**: JavaScript (ES6+)
- **Framework**: React 19.2.4
- **Build Tool**: Vite 8.0.0
- **PWA**: Workbox + Vite PWA Plugin
- **Charts**: Recharts 3.8.1
- **Icons**: Lucide React 1.14.0
- **Routing**: React Router 6.30.3
- **State**: React Query 5.100.1
- **HTTP**: Axios 1.13.6
- **Export**: jsPDF + autoTable
- **QR**: QRCode.React + html5-qrcode
- **Maps**: Leaflet + React Leaflet
- **Notifications**: Sonner 2.0.7

### Backend
- **Language**: PHP 8.2+
- **Framework**: Laravel 12.0
- **Auth**: Sanctum 4.3
- **Payment**: Midtrans SDK 2.6
- **Email**: Resend SDK 1.4
- **DB**: SQLite
- **Testing**: PHPUnit 11.5.50
- **Deployment**: Gunicorn/Apache

### ML/AI
- **Language**: Python 3.8+
- **Framework**: Flask 3.0.0
- **ML**: scikit-learn 1.5.0+
- **Data**: pandas 2.1.3+, numpy 2.0.0+
- **Serialization**: joblib 1.3.2+
- **CORS**: Flask-CORS 4.0.0
- **Server**: Gunicorn 21.2.0

### Infrastructure & Services
- **Version Control**: Git
- **Package Managers**: npm, Composer, pip
- **Payment**: Midtrans (QRIS, e-wallet)
- **AI**: Google Gemini API
- **Email**: Gmail SMTP
- **Local Dev**: XAMPP (Apache + PHP)
- **Container**: Docker support (Sail)

---

## 🎯 Feature Stack Mapping

| Feature | Stack |
|---------|-------|
| Order Management | Laravel + SQLite + React |
| Payment Processing | Midtrans SDK + Laravel |
| Real-time Tracking | Leaflet/React + GPS |
| QR Code Scanning | html5-qrcode + React |
| Revenue Prediction | Flask + scikit-learn + Recharts |
| Demand Forecasting | Flask + scikit-learn + Recharts |
| Churn Risk Analysis | Flask + scikit-learn + React |
| AI Insights | Google Gemini + Recharts |
| Report Generation | jsPDF + React |
| Email Notifications | Laravel + Gmail SMTP |
| Mobile Support | PWA + Responsive React |
| Admin Dashboard | React + API |

---

**Last Updated**: August 3, 2026
**Project**: Laundrop - Laundry Platform
