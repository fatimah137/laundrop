<?php

namespace App\Http\Controllers;

use App\Models\OrderNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrderNotificationController extends Controller
{
    // ─── GET /api/notifications ───────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $notifications = OrderNotification::where('user_id', $request->user()->id)
            ->latest('created_at')
            ->paginate(20);

        $unreadCount = OrderNotification::where('user_id', $request->user()->id)
            ->unread()
            ->count();

        return $this->success([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    // ─── PATCH /api/notifications/{id}/read ──────────────────────────────────

    public function markRead(Request $request, int $id): JsonResponse
    {
        $notif = OrderNotification::where('user_id', $request->user()->id)->findOrFail($id);
        $notif->markAsRead();

        return $this->success(null, 'Notifikasi ditandai sudah dibaca');
    }

    // ─── PATCH /api/notifications/read-all ───────────────────────────────────

    public function markAllRead(Request $request): JsonResponse
    {
        OrderNotification::where('user_id', $request->user()->id)
            ->unread()
            ->update(['is_read' => true, 'read_at' => now()]);

        return $this->success(null, 'Semua notifikasi ditandai sudah dibaca');
    }
}
