<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    // ─── GET /api/transactions ────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Transaction::with(['order:id,order_number,customer_id,status', 'payment'])
            ->latest();

        if ($user->isCustomer()) {
            $query->whereHas('order', fn ($q) => $q->where('customer_id', $user->id));
        } elseif ($user->isEmployee()) {
            $query->whereHas('order', fn ($q) => $q->where('employee_id', $user->id));
        }

        return $this->success($query->paginate(15));
    }

    // ─── GET /api/transactions/{id} ───────────────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $transaction = Transaction::with([
            'order.customer:id,name,phone',
            'order.service:id,name',
            'payment',
        ])->findOrFail($id);

        if ($request->user()->isCustomer() && $transaction->order->customer_id !== $request->user()->id) {
            return $this->error('Akses ditolak', 403);
        }

        return $this->success($transaction);
    }
}
