<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    // Status enum values — sesuai alur bisnis terbaru
    const STATUS_WAITING_CONFIRMATION = 'waiting_confirmation';
    const STATUS_PICKUP               = 'pickup';
    const STATUS_PICKED_UP            = 'picked_up';
    const STATUS_WAITING_PAYMENT      = 'waiting_payment';
    const STATUS_WASHING              = 'washing';
    const STATUS_WASHING_FINISHED     = 'washing_finished';
    const STATUS_DELIVERY             = 'delivery';
    const STATUS_COMPLETED            = 'completed';
    const STATUS_CANCELLED            = 'cancelled';

    const PAYMENT_CASH = 'cash';
    const PAYMENT_QRIS = 'qris';

    protected $fillable = [
        'order_number',
        'customer_id',
        'employee_id',
        'service_id',
        'pickup_address',
        'pickup_lat',
        'pickup_lng',
        'pickup_date',
        'pickup_time',
        'estimated_weight',
        'actual_weight',
        'status',
        'payment_method',
        'notes',
        'photo_pickup',
        'photo_scale',
        'photo_delivery',
        'cancelled_at',
    ];

    protected $casts = [
        'pickup_date'      => 'date',
        'pickup_time'      => 'datetime',
        'estimated_weight' => 'decimal:2',
        'actual_weight'    => 'decimal:2',
        'pickup_lat'       => 'decimal:8',
        'pickup_lng'       => 'decimal:8',
        'cancelled_at'     => 'datetime',
    ];

    // ─── Boot: auto-generate order_number ─────────────────────────────────────

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = 'LD-' . strtoupper(Str::random(8));
            }
        });
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_WAITING_CONFIRMATION);
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);
    }

    public function scopeForCustomer($query, int $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    public function scopeForEmployee($query, int $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isCancellable(): bool
    {
        return $this->status === self::STATUS_WAITING_CONFIRMATION;
    }

    public function canUpdateStatus(string $newStatus): bool
    {
        $flow = [
            self::STATUS_WAITING_CONFIRMATION => [self::STATUS_PICKUP, self::STATUS_CANCELLED],
            self::STATUS_PICKUP               => [self::STATUS_PICKED_UP],
            self::STATUS_PICKED_UP            => [self::STATUS_WAITING_PAYMENT],
            self::STATUS_WAITING_PAYMENT      => [self::STATUS_WASHING],
            self::STATUS_WASHING              => [self::STATUS_WASHING_FINISHED],
            self::STATUS_WASHING_FINISHED     => [self::STATUS_DELIVERY],
            self::STATUS_DELIVERY             => [self::STATUS_COMPLETED],
        ];

        return in_array($newStatus, $flow[$this->status] ?? []);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function statusLogs()
    {
        return $this->hasMany(OrderStatusLog::class, 'order_id')->latest();
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'order_id');
    }

    public function notifications()
    {
        return $this->hasMany(OrderNotification::class, 'order_id');
    }
}
