<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ocr_scans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                  ->constrained('orders')
                  ->cascadeOnDelete();

            $table->foreignId('scanned_by')
                  ->constrained('users')
                  ->cascadeOnDelete();
            // karyawan yang melakukan scan

            $table->string('image_path', 255);
            // path foto nota barcode yang di-upload

            $table->decimal('extracted_weight', 6, 2)->nullable();
            // berat hasil baca OCR

            $table->string('extracted_service', 100)->nullable();
            // jenis layanan hasil baca OCR

            $table->decimal('extracted_price', 10, 2)->nullable();
            // harga hasil baca OCR

            $table->text('raw_ocr_text')->nullable();
            // output mentah dari Google Vision API

            $table->boolean('is_corrected')->default(false);
            // apakah sudah dikoreksi manual oleh karyawan

            $table->decimal('corrected_weight', 6, 2)->nullable();
            // berat hasil koreksi manual (jika is_corrected = true)

            $table->float('accuracy_score')->nullable();
            // skor akurasi OCR antara 0.00 - 1.00

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocr_scans');
    }
};