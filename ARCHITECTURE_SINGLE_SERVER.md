# Architecture: Single Server dengan Role-Based Access Control

## 📊 Arsitektur Deployment

```
┌────────────────────────────────────────────────────────────────┐
│                   SINGLE BACKEND SERVER                        │
│                    (Laravel API + SQLite)                      │
│                   http://localhost:8000                        │
└──────────────────────────┬─────────────────────────────────────┘
         │
         ├─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ CUSTOMER   │  │ EMPLOYEE   │  │   OWNER    │
    │ Frontend   │  │ Frontend   │  │ Frontend   │
    │ (React)    │  │ (React)    │  │ (React)    │
    │ PWA        │  │ PWA        │  │ PWA        │
    └────────────┘  └────────────┘  └────────────┘
         │              │                │
         └──────────────┴────────────────┘
                  │
         API Calls dengan Token
         (Laravel Sanctum)
                  │
         ┌────────▼────────┐
         │  ROLE MIDDLEWARE│
         │ CheckRole.php   │
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    ↓             ↓             ↓
 CUSTOMER      EMPLOYEE       OWNER
 Routes        Routes         Routes
  (API)         (API)          (API)
```

## 🗂️ Struktur Logical

### Backend Server (Satu Instance)
**Location**: `laundrop-api/`
**Port**: 8000 (development) atau 80/443 (production)
**Database**: SQLite (satu database untuk semua role)

### Frontend Applications (Sama/Unified)
**Location**: `laundrop-web/`
**Build Output**: SPA yang sama untuk semua role
**Port**: 3000 (dev) atau static hosting

---

## 👥 User Roles & Database

### Users Table
```sql
users (
  id INT PRIMARY KEY,
  name VARCHAR,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  password_hash VARCHAR,
  role ENUM('customer', 'employee', 'owner'),  -- ← Satu table, beda role
  is_active BOOLEAN,
  created_at TIMESTAMP
)
```

### Model: `User.php`
```php
public function scopeCustomers($query) {
  return $query->where('role', 'customer');
}

public function scopeEmployees($query) {
  return $query->where('role', 'employee');
}

public function scopeOwners($query) {
  return $query->where('role', 'owner');
}
```

---

## 🔐 Authentication Flow (Sama untuk Semua Role)

```
┌──────────────────────────────────────────────────────┐
│ 1. User Login (semua role)                          │
│    POST /api/auth/login                             │
│    {email, password, role}                          │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────▼───────────┐
        │ Verify Credentials   │
        │ Check role field     │
        │ Generate Token       │
        └──────────┬───────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│ 2. Return API Token (Sanctum)                        │
│    {token, user {id, name, email, role}}            │
│    Frontend: simpan di localStorage                 │
└──────────────────┬───────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────┐
│ 3. Subsequent Requests                              │
│    Headers: Authorization: Bearer {token}           │
│    Sanctum: Validate & load $user                   │
└──────────────────┬───────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │ CheckRole Middleware│
        │ Verify user->role   │
        │ Allow/Deny route    │
        └──────────┬──────────┘
                   │
                Success ↓
              Route Handler
```

---

## 📡 API Routes: Satu Server, Role-Based Access

### File: `routes/api.php`

#### Public Routes (Tidak perlu auth)
```php
// Semua bisa lihat layanan aktif
GET  /api/services                    // CUSTOMER: Lihat paket
POST /api/auth/login                  // Semua: Login
POST /api/auth/register               // Semua: Register
```

#### Authenticated Routes (Perlu token)

**Customer Routes** (`middleware('role:customer')`)
```php
POST   /api/orders                    // Buat order
GET    /api/orders                    // Lihat order sendiri
GET    /api/orders/{id}               // Detail order sendiri
PUT    /api/orders/{id}               // Update order sendiri
GET    /api/profile                   // Profil customer
PUT    /api/profile                   // Update profil
GET    /api/notifications             // Notifikasi untuk customer
```

**Employee Routes** (`middleware('role:employee,owner')`)
```php
GET    /api/orders                    // Lihat semua order
PATCH  /api/orders/{id}/status        // Update status order
GET    /api/orders/{id}               // Detail order apapun
POST   /api/orders/{id}/verify        // Verifikasi pickup
```

**Owner Routes** (`middleware('role:owner')`)
```php
GET    /api/admin/dashboard/stats     // Dashboard business AI
GET    /api/admin/customers           // Kelola customer
POST   /api/admin/customers           // Tambah customer
PUT    /api/admin/customers/{id}      // Edit customer
DELETE /api/admin/customers/{id}      // Hapus customer
GET    /api/admin/employees           // Kelola employee
POST   /api/admin/employees           // Tambah employee
PUT    /api/admin/employees/{id}      // Edit employee
DELETE /api/admin/employees/{id}      // Hapus employee
GET    /api/admin/services            // Kelola service
POST   /api/admin/services            // Tambah service
GET    /api/predict/revenue           // ML: Revenue prediction
GET    /api/predict/demand            // ML: Demand forecast
GET    /api/predict/churn             // ML: Churn analysis
GET    /api/predict/recommendation    // ML: Business recommendation
```

### Middleware: CheckRole

```php
// app/Http/Middleware/CheckRole.php
if (!in_array($user->role, $roles)) {
    return response()->json([
        'message' => 'Akses ditolak. Role Anda tidak memiliki izin.'
    ], 403);
}
```

---

## 🎨 Frontend: Unified SPA dengan Conditional Rendering

### Single React App
**File**: `laundrop-web/`
```
src/
├── components/
│   ├── Customer/              // ← Customer-specific components
│   │   ├── Layout.jsx
│   │   ├── Dashboard/
│   │   └── ...
│   ├── Dashboard/             // ← Employee/Owner components
│   │   ├── Orders/
│   │   ├── Customers/
│   │   ├── Employees/
│   │   ├── MLDashboard/       // ← Business AI (Owner only)
│   │   └── ...
│   └── ProtectedRoute.jsx     // ← Role checking
├── pages/
│   ├── customer/              // ← /customer/* routes
│   │   ├── Dashboard/
│   │   ├── Order/
│   │   ├── History/
│   │   └── ...
│   ├── dashboard/             // ← /dashboard/* routes (Employee/Owner)
│   │   ├── Orders/
│   │   ├── Customers/
│   │   ├── Employees/
│   │   ├── MLDashboard/       // ← /dashboard/ml-* (Owner only)
│   │   └── ...
│   └── auth/
│       └── Login.jsx
├── context/
│   └── RoleContext.jsx        // ← Global role management
└── routes/
    └── routes.jsx             // ← Routing definition
```

### RoleContext: Role Management

**File**: `context/RoleContext.jsx`
```javascript
const ROLE_PERMISSIONS = {
  owner: {
    label: 'Owner',
    menus: [
      'dashboard',           // Owner dashboard
      'orders',
      'customers',
      'employees',
      'services',
      'payment',
      'reports',
      'ml-dashboard',        // ← Business AI
      'ml-revenue',          // ← ML Revenue prediction
      'ml-demand',           // ← ML Demand forecast
      'ml-churn',            // ← ML Churn analysis
      'ml-recommendations',  // ← ML Recommendations
      'notifications',
      'profile',
      'settings',
      'tracking'
    ]
  },
  employee: {
    label: 'Karyawan',
    menus: [
      'orders',              // Order management
      'tracking',            // Map tracking
      'qr-scanner',          // QR scanning
      'notifications',
      'profile'
    ]
  },
  customer: {
    label: 'Customer',
    menus: [
      'dashboard',           // Customer dashboard
      'order',               // Buat order
      'history',             // Riwayat order
      'tracking',            // Track order
      'notifications',
      'profile',
      'saved-addresses',
      'settings'
    ]
  }
};
```

### Route Protection: ProtectedRoute.jsx

```javascript
function ProtectedRoute({ requiredRoles, children }) {
  const { role, isAuthenticated } = useRole();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

### Routing: App.jsx

```javascript
const routes = [
  // Public
  { path: '/',              element: <Landing /> },
  { path: '/login',         element: <Login /> },
  
  // Customer routes
  { path: '/customer/*',    element: <ProtectedRoute requiredRoles={['customer']}><CustomerApp /></ProtectedRoute> },
  
  // Employee/Owner routes
  { path: '/dashboard/*',   element: <ProtectedRoute requiredRoles={['employee', 'owner']}><DashboardApp /></ProtectedRoute> },
];
```

### Login Redirect: Based on Role

**File**: `pages/auth/Login.jsx`
```javascript
const REDIRECT_BY_ROLE = {
  customer: '/customer/dashboard',
  employee: '/dashboard/orders',
  owner: '/dashboard'
};

// After login:
const user = await api.post('/auth/login', { email, password });
navigate(REDIRECT_BY_ROLE[user.role]);
```

---

## 🔄 Data Flow: Multi-Role Example

### Scenario: Customer membuat order, Employee process, Owner review

#### 1️⃣ Customer membuat order
```
Customer App → POST /api/orders (role: customer)
              ├─ Middleware: role:customer ✓
              ├─ Request validation: $request->user()->role === 'customer' ✓
              └─ Order created with customer_id = Auth::id()
```

#### 2️⃣ Employee lihat & process order
```
Employee App → GET /api/orders?status=pending (role: employee)
              ├─ Middleware: role:employee,owner ✓
              ├─ Return semua orders di database
              └─ Employee bisa update status, assign diri sendiri

Employee App → PATCH /api/orders/123/status
              ├─ Middleware: role:employee,owner ✓
              ├─ Request validation: in_array(role, ['employee', 'owner']) ✓
              └─ Order status updated (employee_id = Auth::id())
```

#### 3️⃣ Owner review & business analytics
```
Owner App → GET /api/admin/dashboard/stats (role: owner)
           ├─ Middleware: role:owner ✓
           ├─ Return aggregated stats:
           │   - Total customers
           │   - Total employees
           │   - Total orders
           │   - Revenue metrics
           └─ Data untuk dashboard & ML predictions

Owner App → GET /api/predict/revenue (role: owner)
           ├─ Middleware: role:owner ✓
           ├─ Query ML Service (Flask)
           └─ Return AI prediction + Gemini summary
```

---

## 💾 Database: Satu Instance untuk Semua Role

### Sharing Data Pattern

**Users Table**
```
id | name     | email           | phone        | role     | is_active
1  | Budi     | budi@email.com  | 0812345...   | customer | true
2  | Andi     | andi@email.com  | 0812345...   | employee | true
3  | Tuan     | owner@email.com | 0812345...   | owner    | true
```

**Orders Table**
```
id | order_number | customer_id | employee_id | status    | total_amount
1  | LD-260429-1  | 1           | 2           | completed | 50000
2  | LD-260429-2  | 1           | NULL        | pending   | 75000
3  | LD-260429-3  | NULL        | 2           | delivery  | 60000
```

**Access Pattern**:
- **Customer (role=customer)**: Hanya bisa lihat order sendiri (`WHERE customer_id = Auth::id()`)
- **Employee (role=employee)**: Lihat semua order untuk processing (`WHERE status != 'completed'`)
- **Owner (role=owner)**: Lihat semua order untuk analytics & reporting

### Relationships
```
User (customer) ← 1:many → Orders → many:1 → User (employee)
User (owner)    ← 1:many → Customers (management)
                ← 1:many → Employees (management)
                ← 1:many → Services (management)
```

---

## 🎯 Benefits: Single Server, Multiple Roles

| Aspek | Benefit |
|-------|---------|
| **Database** | ✅ Satu database, easy to maintain & backup |
| **Consistency** | ✅ Real-time data sharing antar role |
| **Cost** | ✅ Single server instance (cheaper) |
| **Security** | ✅ Centralized auth & permission control |
| **Scalability** | ⚠️ Single point of failure (mitigated by caching) |
| **Deployment** | ✅ Satu deploy untuk semua role |
| **Data Sync** | ✅ Instant sync - tidak ada lag antar sistem |

---

## 🔌 ML Service Integration (Owner-Only Feature)

```
┌─────────────────────────────────────────────────┐
│ FRONTEND (Owner App)                            │
│ POST /api/predict/revenue                       │
└──────────────────┬──────────────────────────────┘
                   │ (role: owner) ✓
                   ↓
        ┌──────────────────────┐
        │ BACKEND (Laravel API)│
        │ MLController.php     │
        └──────────┬───────────┘
                   │
                   ↓ (HTTP call)
        ┌──────────────────────────┐
        │ ML SERVICE (Flask)       │
        │ http://localhost:5000   │
        │ /api/predict/revenue    │
        └──────────┬───────────────┘
                   │
                   ↓ (scikit-learn)
        ┌──────────────────────────┐
        │ ML Models (joblib)       │
        │ - revenue_model.joblib   │
        │ - demand_model.joblib    │
        │ - churn_model.joblib     │
        └──────────┬───────────────┘
                   │
                   ↓ (prediction)
        ┌──────────────────────────┐
        │ Gemini API               │
        │ AI Summary Generation    │
        └──────────┬───────────────┘
                   │
                   ↓ (formatted response)
        ┌──────────────────────────┐
        │ RESPONSE                 │
        │ {                        │
        │   items: [...],          │
        │   summary: "..."  ←──────┼─ Gemini AI text
        │ }                        │
        └──────────────────────────┘
```

---

## 📋 Summary

**Architecture Type**: Monolithic single-server
**Database**: SQLite (unified)
**Frontend**: SPA dengan role-based route guards
**Authentication**: Laravel Sanctum tokens
**Authorization**: Role-based middleware
**Scalability**: Vertical (add resources) atau horizontal (load balancer)
**Deployment**: Docker-ready, atau traditional LAMP stack

**Key Takeaway**: 
> Customer, Employee, dan Owner **satu backend server** yang sama, beda akses berdasarkan role dalam database `users` table. Frontend adalah React app yang sama, cuma render UI berbeda sesuai role.
