<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                  ->unique()
                  ->constrained('orders')
                  ->cascadeOnDelete();
            // unique: satu order hanya punya satu transaksi

            $table->foreignId('ocr_scan_id')
                  ->nullable()
                  ->constrained('ocr_scans')
                  ->nullOnDelete();
            // scan OCR yang menjadi dasar tagihan ini

            $table->decimal('actual_weight', 6, 2);
            // berat final yang dipakai untuk hitung tagihan

            $table->decimal('price_per_kg', 10, 2);
            // snapshot harga saat transaksi dibuat
            // (agar perubahan harga layanan tidak pengaruhi histori)

            $table->decimal('subtotal', 12, 2);
            // actual_weight × price_per_kg

            $table->decimal('total_amount', 12, 2);
            // total akhir (bisa ditambah diskon/biaya lain nanti)

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};