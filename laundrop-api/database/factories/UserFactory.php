<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'name'          => fake()->name(),
            'email'         => fake()->unique()->safeEmail(),
            'phone'         => fake()->numerify('08##########'),
            'password_hash' => Hash::make('password'),
            'role'          => 'customer',
            'is_active'     => true,
        ];
    }

    public function customer(): static
    {
        return $this->state(['role' => 'customer']);
    }

    public function employee(): static
    {
        return $this->state(['role' => 'employee']);
    }

    public function owner(): static
    {
        return $this->state(['role' => 'owner']);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
