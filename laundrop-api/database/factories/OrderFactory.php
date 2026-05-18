<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $status = fake()->randomElement([
            Order::STATUS_PENDING,
            Order::STATUS_CONFIRMED,
            Order::STATUS_PICKING_UP,
            Order::STATUS_PICKED_UP,
            Order::STATUS_PROCESSING,
            Order::STATUS_PAID,
        ]);

        return [
            'order_number'     => 'LD-' . strtoupper(Str::random(8)),
            'customer_id'      => User::factory()->customer(),
            'employee_id'      => null,
            'service_id'       => Service::factory(),
            'pickup_address'   => fake()->address(),
            'pickup_lat'       => fake()->latitude(-7.05, -6.95),  // area Semarang Atas
            'pickup_lng'       => fake()->longitude(110.35, 110.45),
            'pickup_date'      => fake()->dateTimeBetween('now', '+7 days')->format('Y-m-d'),
            'pickup_time'      => fake()->time('H:i'),
            'estimated_weight' => fake()->randomFloat(1, 1, 15),
            'actual_weight'    => null,
            'status'           => $status,
            'payment_method'   => fake()->randomElement(['cash', 'qris']),
            'notes'            => fake()->optional()->sentence(),
            'cancelled_at'     => $status === Order::STATUS_CANCELLED ? now() : null,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => Order::STATUS_PENDING]);
    }

    public function confirmed(): static
    {
        return $this->state([
            'status'      => Order::STATUS_CONFIRMED,
            'employee_id' => User::factory()->employee(),
        ]);
    }

    public function paid(): static
    {
        return $this->state([
            'status'        => Order::STATUS_PAID,
            'employee_id'   => User::factory()->employee(),
            'actual_weight' => fake()->randomFloat(1, 1, 15),
        ]);
    }

    public function cancelled(): static
    {
        return $this->state([
            'status'       => Order::STATUS_CANCELLED,
            'cancelled_at' => now(),
        ]);
    }
}
