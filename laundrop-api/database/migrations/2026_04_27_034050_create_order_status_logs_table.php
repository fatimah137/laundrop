<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_status_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                  ->constrained('orders')
                  ->cascadeOnDelete();

            $table->foreignId('changed_by')
                  ->constrained('users')
                  ->cascadeOnDelete();
            // user yang mengubah status (karyawan/owner)

            $table->enum('status_before', [
                'menunggu_konfirmasi',
                'dalam_penjemputan',
                'pakaian_diambil',
                'menunggu_pembayaran',
                'proses_pencucian',
                'pencucian_selesai',
                'dalam_pengantaran',
                'selesai',
                'dibatalkan',
            ])->nullable();
            // nullable untuk status awal (pertama kali dibuat)

            $table->enum('status_after', [
                'menunggu_konfirmasi',
                'dalam_penjemputan',
                'pakaian_diambil',
                'menunggu_pembayaran',
                'proses_pencucian',
                'pencucian_selesai',
                'dalam_pengantaran',
                'selesai',
                'dibatalkan',
            ]);

            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // hanya created_at, log tidak boleh diupdate
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_status_logs');
    }
};