<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name',
        'address',
        'phone',
        'email',
        'logo_path',
        'operating_hours',
        'service_area',
    ];

    protected $casts = [
        'operating_hours' => 'array',
    ];

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Singleton: selalu ambil record pertama.
     */
    public static function get(): static
    {
        return static::firstOrCreate([], [
            'company_name'    => 'Laundrop',
            'operating_hours' => [],
        ]);
    }
}
