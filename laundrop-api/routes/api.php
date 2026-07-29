<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderNotificationController;
use App\Http\Controllers\OrderStatusLogController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\MLController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('register',       [AuthController::class, 'register']);
    Route::post('login',          [AuthController::class, 'login']);
    Route::post('google',         [AuthController::class, 'google']);
    Route::post('forgot-password',[AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Info perusahaan (untuk landing page)
Route::get('company', [CompanySettingController::class, 'show']);

// Layanan aktif (untuk form order customer)
Route::get('services', [ServiceController::class, 'index']);
Route::get('services/{id}', [ServiceController::class, 'show']);

// Webhook Midtrans — TANPA auth (IP Midtrans yang diverifikasi via signature)
Route::post('payments/webhook', [PaymentController::class, 'webhook']);
Route::post('webhooks/midtrans', [PaymentController::class, 'webhookMidtrans']);

// ─── Authenticated ────────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    Route::get('auth/me',   [AuthController::class, 'me']);
    Route::patch('auth/me', [AuthController::class, 'updateMe']);
    Route::patch('auth/change-password', [AuthController::class, 'changePassword']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Dashboard stats
    Route::middleware('role:employee,owner')->get('dashboard/stats', [DashboardController::class, 'stats']);

    // Push Subscription
    Route::post('push/subscribe',   [PushSubscriptionController::class, 'subscribe']);
    Route::delete('push/unsubscribe',[PushSubscriptionController::class, 'unsubscribe']);

    // Notifikasi
    Route::prefix('notifications')->group(function () {
        Route::get('/',              [OrderNotificationController::class, 'index']);
        Route::patch('read-all',     [OrderNotificationController::class, 'markAllRead']);
        Route::patch('{id}/read',    [OrderNotificationController::class, 'markRead']);
    });

    // ── Customer & Employee ──────────────────────────────────────────────────

    Route::middleware('role:customer,employee,owner')->group(function () {

        // Orders
        Route::get('orders',                   [OrderController::class, 'index']);
        Route::get('orders/{id}',              [OrderController::class, 'show']);
        Route::get('orders/{orderId}/logs',    [OrderStatusLogController::class, 'index']);

        // Transactions
        Route::get('transactions',             [TransactionController::class, 'index']);
        Route::get('transactions/{id}',        [TransactionController::class, 'show']);

        // Payments
        Route::get('payments/{transactionId}', [PaymentController::class, 'show']);
    });

    // ── Customer only ────────────────────────────────────────────────────────

    Route::middleware('role:customer')->group(function () {
        Route::post('orders',              [OrderController::class, 'store']);
        Route::patch('orders/{id}/cancel', [OrderController::class, 'cancel']);
        Route::post('payments/create',     [PaymentController::class, 'create']);
        
        // QRIS payment endpoints
        Route::post('orders/{orderId}/generate-qris', [PaymentController::class, 'generateQris']);
        Route::get('orders/{orderId}/payment-status', [PaymentController::class, 'checkPaymentStatus']);
    });

    // ── Employee only ────────────────────────────────────────────────────────

    Route::middleware('role:employee,owner')->group(function () {
        Route::patch('orders/{id}/status',          [OrderController::class, 'updateStatus']);
        Route::post('orders/{id}/bill',             [OrderController::class, 'bill']);
        Route::post('orders/{id}/confirm-cash-payment', [OrderController::class, 'confirmCashPayment']);
        Route::post('orders/{id}/photos',           [OrderController::class, 'uploadPhoto']);
        Route::post('payments/{id}/proof',          [PaymentController::class, 'uploadProof']);
    });

    // ── Owner only ───────────────────────────────────────────────────────────

    Route::middleware('role:owner')->prefix('admin')->group(function () {

        // Customer management
        Route::get('customers', [CustomerController::class, 'index']);
        Route::post('customers', [CustomerController::class, 'store']);
        Route::get('customers/{id}', [CustomerController::class, 'show']);
        Route::put('customers/{id}', [CustomerController::class, 'update']);
        Route::delete('customers/{id}', [CustomerController::class, 'destroy']);

        // Employee management
        Route::get('employees', [EmployeeController::class, 'index']);
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::get('employees/{id}', [EmployeeController::class, 'show']);
        Route::put('employees/{id}', [EmployeeController::class, 'update']);
        Route::delete('employees/{id}', [EmployeeController::class, 'destroy']);

        // Company settings
        Route::put('company', [CompanySettingController::class, 'update']);

        // Services management
        Route::get('services',      [ServiceController::class, 'adminIndex']);
        Route::post('services',        [ServiceController::class, 'store']);
        Route::put('services/{id}',    [ServiceController::class, 'update']);
        Route::delete('services/{id}', [ServiceController::class, 'destroy']);

        // Payments management
        Route::get('payments', [PaymentController::class, 'adminIndex']);
        Route::patch('payments/{transactionId}/mark-paid', [PaymentController::class, 'markPaid']);

        // Reports
        Route::get('reports', [ReportController::class, 'overview']);
        Route::get('reports/export', [ReportController::class, 'export']);

        // Machine Learning — prediksi & rekomendasi bisnis
        Route::prefix('ml')->group(function () {
            Route::get('predict/revenue',  [MLController::class, 'predictRevenue']);
            Route::get('predict/demand',   [MLController::class, 'predictDemand']);
            Route::get('predict/churn',    [MLController::class, 'predictChurn']);
            Route::get('recommendations',  [MLController::class, 'getRecommendations']);
            Route::get('models/status',    [MLController::class, 'modelsStatus']);
        });

        // Assign employee ke order
        Route::patch('orders/{id}/assign', [OrderController::class, 'assign']);

        // Employee management (pakai UserController — buat sendiri jika perlu)
        // Route::apiResource('employees', EmployeeController::class);

        // Reports (buat ReportController terpisah)
        // Route::get('reports/transactions', [ReportController::class, 'transactions']);
        // Route::get('reports/employees',    [ReportController::class, 'employees']);
        // Route::get('reports/customers',    [ReportController::class, 'customers']);
        // Route::get('reports/export',       [ReportController::class, 'export']);
    });
});
