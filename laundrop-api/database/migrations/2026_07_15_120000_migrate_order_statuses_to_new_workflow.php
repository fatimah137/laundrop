<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: allow both old and new values temporarily.
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','waiting_confirmation','pickup','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_before ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','waiting_confirmation','pickup','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NULL");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_after ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','waiting_confirmation','pickup','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NOT NULL");

        // Step 2: normalize existing rows.
        DB::statement("UPDATE orders SET status = 'waiting_confirmation' WHERE status = 'pending'");
        DB::statement("UPDATE orders SET status = 'pickup' WHERE status IN ('confirmed', 'picking_up')");
        DB::statement("UPDATE orders SET status = 'picked_up' WHERE status = 'picked_up'");
        DB::statement("UPDATE orders SET status = 'waiting_payment' WHERE status = 'billed'");
        DB::statement("UPDATE orders SET status = 'washing' WHERE status IN ('paid', 'processing')");
        DB::statement("UPDATE orders SET status = 'washing_finished' WHERE status = 'ready'");
        DB::statement("UPDATE orders SET status = 'delivery' WHERE status = 'delivering'");
        DB::statement("UPDATE orders SET status = 'completed' WHERE status = 'delivered'");

        DB::statement("UPDATE order_status_logs SET status_before = 'waiting_confirmation' WHERE status_before = 'pending'");
        DB::statement("UPDATE order_status_logs SET status_before = 'pickup' WHERE status_before IN ('confirmed', 'picking_up')");
        DB::statement("UPDATE order_status_logs SET status_before = 'waiting_payment' WHERE status_before = 'billed'");
        DB::statement("UPDATE order_status_logs SET status_before = 'washing' WHERE status_before IN ('paid', 'processing')");
        DB::statement("UPDATE order_status_logs SET status_before = 'washing_finished' WHERE status_before = 'ready'");
        DB::statement("UPDATE order_status_logs SET status_before = 'delivery' WHERE status_before = 'delivering'");
        DB::statement("UPDATE order_status_logs SET status_before = 'completed' WHERE status_before = 'delivered'");

        DB::statement("UPDATE order_status_logs SET status_after = 'waiting_confirmation' WHERE status_after = 'pending'");
        DB::statement("UPDATE order_status_logs SET status_after = 'pickup' WHERE status_after IN ('confirmed', 'picking_up')");
        DB::statement("UPDATE order_status_logs SET status_after = 'waiting_payment' WHERE status_after = 'billed'");
        DB::statement("UPDATE order_status_logs SET status_after = 'washing' WHERE status_after IN ('paid', 'processing')");
        DB::statement("UPDATE order_status_logs SET status_after = 'washing_finished' WHERE status_after = 'ready'");
        DB::statement("UPDATE order_status_logs SET status_after = 'delivery' WHERE status_after = 'delivering'");
        DB::statement("UPDATE order_status_logs SET status_after = 'completed' WHERE status_after = 'delivered'");

        // Step 3: tighten enum to new workflow only.
        DB::statement("ALTER TABLE orders MODIFY status ENUM('waiting_confirmation','pickup','picked_up','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NOT NULL DEFAULT 'waiting_confirmation'");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_before ENUM('waiting_confirmation','pickup','picked_up','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NULL");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_after ENUM('waiting_confirmation','pickup','picked_up','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NOT NULL");
    }

    public function down(): void
    {
        // Step 1: allow both new and old values temporarily.
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','waiting_confirmation','pickup','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NOT NULL DEFAULT 'waiting_confirmation'");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_before ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','waiting_confirmation','pickup','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NULL");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_after ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','waiting_confirmation','pickup','waiting_payment','washing','washing_finished','delivery','completed','cancelled') NOT NULL");

        // Step 2: map back to old statuses.
        DB::statement("UPDATE orders SET status = 'pending' WHERE status = 'waiting_confirmation'");
        DB::statement("UPDATE orders SET status = 'picking_up' WHERE status = 'pickup'");
        DB::statement("UPDATE orders SET status = 'billed' WHERE status = 'waiting_payment'");
        DB::statement("UPDATE orders SET status = 'processing' WHERE status = 'washing'");
        DB::statement("UPDATE orders SET status = 'ready' WHERE status = 'washing_finished'");
        DB::statement("UPDATE orders SET status = 'delivering' WHERE status = 'delivery'");
        DB::statement("UPDATE orders SET status = 'delivered' WHERE status = 'completed'");

        DB::statement("UPDATE order_status_logs SET status_before = 'pending' WHERE status_before = 'waiting_confirmation'");
        DB::statement("UPDATE order_status_logs SET status_before = 'picking_up' WHERE status_before = 'pickup'");
        DB::statement("UPDATE order_status_logs SET status_before = 'billed' WHERE status_before = 'waiting_payment'");
        DB::statement("UPDATE order_status_logs SET status_before = 'processing' WHERE status_before = 'washing'");
        DB::statement("UPDATE order_status_logs SET status_before = 'ready' WHERE status_before = 'washing_finished'");
        DB::statement("UPDATE order_status_logs SET status_before = 'delivering' WHERE status_before = 'delivery'");
        DB::statement("UPDATE order_status_logs SET status_before = 'delivered' WHERE status_before = 'completed'");

        DB::statement("UPDATE order_status_logs SET status_after = 'pending' WHERE status_after = 'waiting_confirmation'");
        DB::statement("UPDATE order_status_logs SET status_after = 'picking_up' WHERE status_after = 'pickup'");
        DB::statement("UPDATE order_status_logs SET status_after = 'billed' WHERE status_after = 'waiting_payment'");
        DB::statement("UPDATE order_status_logs SET status_after = 'processing' WHERE status_after = 'washing'");
        DB::statement("UPDATE order_status_logs SET status_after = 'ready' WHERE status_after = 'washing_finished'");
        DB::statement("UPDATE order_status_logs SET status_after = 'delivering' WHERE status_after = 'delivery'");
        DB::statement("UPDATE order_status_logs SET status_after = 'delivered' WHERE status_after = 'completed'");

        // Step 3: tighten enum to old workflow only.
        DB::statement("ALTER TABLE orders MODIFY status ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','cancelled') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_before ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','cancelled') NULL");
        DB::statement("ALTER TABLE order_status_logs MODIFY status_after ENUM('pending','confirmed','picking_up','picked_up','billed','paid','processing','ready','delivering','delivered','cancelled') NOT NULL");
    }
};
