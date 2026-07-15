<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        try {
            $activeStatuses = ['waiting_confirmation', 'pickup', 'picked_up', 'waiting_payment', 'washing', 'washing_finished', 'delivery'];

            // Total orders
            $totalOrders = Order::count();

            // Total revenue - use raw SQL to get payment success total
            $totalRevenue = (int) DB::table('transactions')
                ->join('payments', 'transactions.id', '=', 'payments.transaction_id')
                ->where('payments.status', 'paid')
                ->sum('transactions.total_amount');

            // Active orders
            $activeOrders = Order::whereIn('status', $activeStatuses)->count();

            // Pending payments - count unique orders without successful payment
            $pendingPayments = DB::table('orders')
                ->where('orders.status', '!=', 'cancelled')
                ->whereNotIn('orders.status', ['waiting_confirmation'])
                ->leftJoin('transactions', 'orders.id', '=', 'transactions.order_id')
                ->leftJoin('payments', 'transactions.id', '=', 'payments.transaction_id')
                ->where(function($q) {
                    $q->whereNull('payments.id')->orWhere('payments.status', '!=', 'paid');
                })
                ->distinct('orders.id')
                ->count();

            // Recent orders
            $recentOrders = Order::with(['customer', 'service', 'employee'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($order) {
                    return [
                        'id'              => $order->id,
                        'order_number'    => $order->order_number,
                        'customer_name'   => $order->customer->name ?? 'Unknown',
                        'service_name'    => $order->service->name ?? 'Unknown',
                        'status'          => $order->status,
                        'payment_method'  => $order->payment_method,
                        'pickup_date'     => $order->pickup_date,
                        'created_at'      => $order->created_at,
                    ];
                });

            // Status breakdown
            $statusCounts = Order::select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            // Revenue by date (last 7 days)
            $last7Days = [];
            $today = Carbon::now();
            
            for ($i = 6; $i >= 0; $i--) {
                $date = $today->copy()->subDays($i);
                $dateStr = $date->format('Y-m-d');
                $revenue = (int) DB::table('transactions')
                    ->join('payments', 'transactions.id', '=', 'payments.transaction_id')
                    ->where('payments.status', 'paid')
                    ->whereDate('transactions.created_at', $dateStr)
                    ->sum('transactions.total_amount');
                
                $last7Days[] = [
                    'date'    => $date->format('M d'),
                    'revenue' => $revenue,
                ];
            }

            // Customer and employee counts
            $totalCustomers = User::where('role', 'customer')->count();
            $totalEmployees = User::where('role', 'employee')->count();

            return response()->json([
                'success' => true,
                'data'    => [
                    'total_orders'      => $totalOrders,
                    'total_revenue'     => $totalRevenue,
                    'active_orders'     => $activeOrders,
                    'pending_payments'  => $pendingPayments,
                    'total_customers'   => $totalCustomers,
                    'total_employees'   => $totalEmployees,
                    'recent_orders'     => $recentOrders,
                    'status_breakdown'  => $statusCounts,
                    'revenue_by_date'   => $last7Days,
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::error('Dashboard stats error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data dashboard',
            ], 500);
        }
    }
}
