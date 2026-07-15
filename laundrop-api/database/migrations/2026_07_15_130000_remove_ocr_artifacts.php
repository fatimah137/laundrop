<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'ocr_scan_id')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropForeign(['ocr_scan_id']);
                $table->dropColumn('ocr_scan_id');
            });
        }

        Schema::dropIfExists('ocr_scans');
    }

    public function down(): void
    {
        if (!Schema::hasTable('ocr_scans')) {
            Schema::create('ocr_scans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
                $table->foreignId('scanned_by')->constrained('users')->cascadeOnDelete();
                $table->string('image_path');
                $table->decimal('extracted_weight', 6, 2)->nullable();
                $table->string('extracted_service')->nullable();
                $table->decimal('extracted_price', 12, 2)->nullable();
                $table->text('raw_ocr_text')->nullable();
                $table->decimal('accuracy_score', 4, 2)->default(0);
                $table->decimal('corrected_weight', 6, 2)->nullable();
                $table->boolean('is_corrected')->default(false);
                $table->timestamps();
            });
        }

        if (Schema::hasTable('transactions') && !Schema::hasColumn('transactions', 'ocr_scan_id')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->foreignId('ocr_scan_id')
                    ->nullable()
                    ->after('order_id')
                    ->constrained('ocr_scans')
                    ->nullOnDelete();
            });
        }
    }
};
