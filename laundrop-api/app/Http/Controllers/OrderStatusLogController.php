<?php

namespace App\Http\Controllers;

use App\Models\OrderStatusLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrderStatusLogController extends Controller
{
    // ─── GET /api/orders/{orderId}/logs ──────────────────────────────────────

    public function index(Request $request, int $orderId): JsonResponse
    {
        $logs = OrderStatusLog::with('changedBy:id,name,role')
            ->where('order_id', $orderId)
            ->oldest('created_at')
            ->get();

        return $this->success($logs);
    }
}
