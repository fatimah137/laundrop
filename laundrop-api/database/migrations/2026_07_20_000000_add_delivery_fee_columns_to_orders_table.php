<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_distance_km', 8, 2)->default(0)->after('pickup_time');
            $table->unsignedInteger('delivery_fee')->default(0)->after('delivery_distance_km');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['delivery_distance_km', 'delivery_fee']);
        });
    }
};
