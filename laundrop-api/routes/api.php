<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\OcrScanController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderNotificationController;
use App\Http\Controllers\OrderStatusLogController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('register',       [AuthController::class, 'register']);
    Route::post('login',          [AuthController::class, 'login']);
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

// ─── Authenticated ────────────────────────────────────────────────────────────

Route::middleware('auth:sanctum')->group(function () {

    Route::get('auth/me',   [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

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
    });

    // ── Employee only ────────────────────────────────────────────────────────

    Route::middleware('role:employee,owner')->group(function () {
        Route::patch('orders/{id}/status',          [OrderController::class, 'updateStatus']);
        Route::post('orders/{id}/photos',           [OrderController::class, 'uploadPhoto']);
        Route::post('ocr/scan',                     [OcrScanController::class, 'scan']);
        Route::patch('ocr/{id}/correct',            [OcrScanController::class, 'correct']);
        Route::post('ocr/{id}/finalize',            [OcrScanController::class, 'finalize']);
        Route::post('payments/{id}/proof',          [PaymentController::class, 'uploadProof']);
    });

    // ── Owner only ───────────────────────────────────────────────────────────

    Route::middleware('role:owner')->prefix('admin')->group(function () {

        // Company settings
        Route::put('company', [CompanySettingController::class, 'update']);

        // Services management
        Route::post('services',        [ServiceController::class, 'store']);
        Route::put('services/{id}',    [ServiceController::class, 'update']);
        Route::delete('services/{id}', [ServiceController::class, 'destroy']);

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
