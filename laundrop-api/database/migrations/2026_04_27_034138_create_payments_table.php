<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('transaction_id')
                  ->unique()
                  ->constrained('transactions')
                  ->cascadeOnDelete();
            // unique: satu transaksi hanya punya satu payment

            $table->enum('payment_method', ['cash', 'qris']);

            $table->enum('status', [
                'pending',
                'paid',
                'failed',
                'cancelled',
                'expired',
            ])->default('pending');

            $table->string('midtrans_order_id', 100)->nullable();
            // order ID yang dikirim ke Midtrans

            $table->string('midtrans_txn_id', 100)->nullable();
            // transaction ID balikan dari Midtrans

            $table->string('payment_url', 255)->nullable();
            // link pembayaran QRIS dari Midtrans

            $table->string('proof_path', 255)->nullable();
            // path bukti pembayaran digital untuk customer

            $table->timestamp('paid_at')->nullable();
            // waktu pembayaran dikonfirmasi sukses

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};