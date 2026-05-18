<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            // satu user bisa punya banyak subscription (multi-device)

            $table->string('endpoint', 500);
            // URL push endpoint dari browser

            $table->text('p256dh');
            // public key enkripsi dari browser

            $table->text('auth_key');
            // auth secret dari browser

            $table->timestamps();

            // pastikan satu endpoint tidak terdaftar duplikat
            $table->unique(['user_id', 'endpoint'], 'unique_user_endpoint');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};