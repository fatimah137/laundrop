<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStatusLog extends Model
{
    public $timestamps = false; // hanya created_at

    const UPDATED_AT = null;

    protected $fillable = [
        'order_id',
        'changed_by',
        'status_before',
        'status_after',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
