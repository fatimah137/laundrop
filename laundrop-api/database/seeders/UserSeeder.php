<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'email' => 'owner@laundrop.id',
                'name' => 'Owner Laundrop',
                'phone' => '08112345678',
                'role' => 'owner',
            ],
            [
                'email' => 'employee@laundrop.id',
                'name' => 'Budi Santoso',
                'phone' => '08222345678',
                'role' => 'employee',
            ],
            [
                'email' => 'customer@laundrop.id',
                'name' => 'Ani Wijaya',
                'phone' => '08333345678',
                'role' => 'customer',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'phone' => $user['phone'],
                    'password_hash' => Hash::make('password123!'),
                    'role' => $user['role'],
                    'is_active' => true,
                ]
            );
        }
    }
}
