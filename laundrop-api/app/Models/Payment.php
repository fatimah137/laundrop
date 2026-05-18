<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    const STATUS_PENDING  = 'pending';
    const STATUS_SUCCESS  = 'success';
    const STATUS_FAILED   = 'failed';
    const STATUS_EXPIRED  = 'expired';
    const STATUS_REFUNDED = 'refunded';

    const METHOD_CASH = 'cash';
    const METHOD_QRIS = 'qris';

    protected $fillable = [
        'transaction_id',
        'payment_method',
        'status',
        'midtrans_order_id',
        'midtrans_txn_id',
        'payment_url',
        'proof_path',
        'paid_at',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
    ];

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_SUCCESS;
    }

    public function markAsPaid(string $midtransTxnId = null): void
    {
        $this->update([
            'status'          => self::STATUS_SUCCESS,
            'midtrans_txn_id' => $midtransTxnId,
            'paid_at'         => now(),
        ]);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id');
    }
}
