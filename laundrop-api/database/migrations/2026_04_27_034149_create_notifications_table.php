<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_notifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            // penerima notifikasi

            $table->foreignId('order_id')
                  ->nullable()
                  ->constrained('orders')
                  ->cascadeOnDelete();
            // order yang memicu notifikasi ini

            $table->string('title', 150);
            $table->text('body');

            $table->enum('type', [
                'order_created',
                'status_changed',
                'payment_request',
                'payment_success',
                'reminder',
            ]);

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // hanya created_at, notifikasi tidak diupdate
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_notifications');
    }
};