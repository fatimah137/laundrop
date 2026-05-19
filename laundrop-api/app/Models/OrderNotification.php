<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderNotification extends Model
{
    public $timestamps = false;
    const UPDATED_AT = null;

    const TYPE_ORDER_CREATED   = 'order_created';
    const TYPE_STATUS_UPDATED  = 'status_updated';
    const TYPE_PAYMENT_DUE     = 'payment_due';
    const TYPE_PAYMENT_SUCCESS = 'payment_success';
    const TYPE_ORDER_CANCELLED = 'order_cancelled';

    protected $table = 'order_notifications';

    protected $fillable = [
        'user_id',
        'order_id',
        'title',
        'body',
        'type',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_read'    => 'boolean',
        'read_at'    => 'datetime',
        'created_at' => 'datetime',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
