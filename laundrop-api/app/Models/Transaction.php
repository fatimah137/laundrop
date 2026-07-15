<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'order_id',
        'actual_weight',
        'price_per_kg',
        'subtotal',
        'total_amount',
    ];

    protected $casts = [
        'actual_weight' => 'decimal:2',
        'price_per_kg'  => 'decimal:2',
        'subtotal'      => 'decimal:2',
        'total_amount'  => 'decimal:2',
    ];

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public static function calculateSubtotal(float $weight, float $pricePerKg): float
    {
        return round($weight * $pricePerKg, 2);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class, 'transaction_id');
    }
}
