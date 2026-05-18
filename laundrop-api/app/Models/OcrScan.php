<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OcrScan extends Model
{
    protected $fillable = [
        'order_id',
        'scanned_by',
        'image_path',
        'extracted_weight',
        'extracted_service',
        'extracted_price',
        'raw_ocr_text',
        'is_corrected',
        'corrected_weight',
        'accuracy_score',
    ];

    protected $casts = [
        'extracted_weight' => 'decimal:2',
        'extracted_price'  => 'decimal:2',
        'corrected_weight' => 'decimal:2',
        'accuracy_score'   => 'float',
        'is_corrected'     => 'boolean',
    ];

    // Threshold akurasi OCR — jika di bawah ini, karyawan wajib koreksi manual
    const ACCURACY_THRESHOLD = 0.80;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function needsCorrection(): bool
    {
        return $this->accuracy_score < self::ACCURACY_THRESHOLD;
    }

    public function finalWeight(): float
    {
        return $this->is_corrected
            ? (float) $this->corrected_weight
            : (float) $this->extracted_weight;
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }

    public function scannedBy()
    {
        return $this->belongsTo(User::class, 'scanned_by');
    }

    public function transaction()
    {
        return $this->hasOne(Transaction::class, 'ocr_scan_id');
    }
}
