<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Cuci Kering',
                'description' => 'Cuci dan kering pakaian dengan deterjen berkualitas.',
                'price_per_kg' => 5000,
                'est_duration_hours' => 48,
            ],
            [
                'name' => 'Cuci Setrika',
                'description' => 'Pakaian dicuci bersih lalu disetrika rapi.',
                'price_per_kg' => 6000,
                'est_duration_hours' => 72,
            ],
            [
                'name' => 'Laundry Express',
                'description' => 'Layanan prioritas untuk kebutuhan cepat.',
                'price_per_kg' => 20000,
                'est_duration_hours' => 6,
            ],
            [
                'name' => 'Setrika Saja',
                'description' => 'Layanan setrika untuk pakaian yang sudah dicuci.',
                'price_per_kg' => 5000,
                'est_duration_hours' => 24,
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['name' => $service['name']],
                [
                    'description' => $service['description'],
                    'price_per_kg' => $service['price_per_kg'],
                    'est_duration_hours' => $service['est_duration_hours'],
                    'is_active' => true,
                ]
            );
        }
    }
}
