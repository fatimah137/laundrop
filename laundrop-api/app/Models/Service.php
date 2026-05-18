<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price_per_kg',
        'est_duration_hours',
        'is_active',
    ];

    protected $casts = [
        'price_per_kg'       => 'decimal:2',
        'est_duration_hours' => 'integer',
        'is_active'          => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function orders()
    {
        return $this->hasMany(Order::class, 'service_id');
    }
}
