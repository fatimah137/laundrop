<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();
            // contoh format: LDP-20240427-001

            $table->foreignId('customer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('employee_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            // nullable: diisi saat karyawan menerima order

            $table->foreignId('service_id')
                  ->constrained('services')
                  ->restrictOnDelete();

            $table->text('pickup_address');
            $table->decimal('pickup_lat', 10, 7)->nullable();
            $table->decimal('pickup_lng', 10, 7)->nullable();
            $table->date('pickup_date');
            $table->time('pickup_time');

            $table->decimal('estimated_weight', 6, 2);
            // estimasi awal dari customer (kg)

            $table->decimal('actual_weight', 6, 2)->nullable();
            // berat real setelah ditimbang karyawan

            $table->enum('status', [
                'pending',
                'confirmed',
                'picking_up',
                'picked_up',
                'billed',
                'paid',
                'processing',
                'ready',
                'delivering',
                'delivered',
                'cancelled',
            ])->default('pending');

            $table->enum('payment_method', ['cash', 'qris']);

            $table->text('notes')->nullable();

            $table->string('photo_pickup', 255)->nullable();
            // bukti pakaian diambil

            $table->string('photo_scale', 255)->nullable();
            // bukti foto timbangan

            $table->string('photo_delivery', 255)->nullable();
            // bukti foto pengantaran selesai

            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};