<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceFactory extends Factory
{
    protected $model = Service::class;

    // Data layanan laundry realistis
    private array $services = [
        ['name' => 'Cuci Reguler',   'price' => 7000,  'hours' => 48, 'desc' => 'Cuci dan lipat pakaian dengan detergen standar.'],
        ['name' => 'Cuci Express',   'price' => 12000, 'hours' => 6,  'desc' => 'Cuci cepat selesai dalam 6 jam.'],
        ['name' => 'Cuci + Setrika', 'price' => 10000, 'hours' => 72, 'desc' => 'Cuci bersih lalu disetrika rapi.'],
        ['name' => 'Dry Cleaning',   'price' => 25000, 'hours' => 96, 'desc' => 'Pembersihan kimia untuk pakaian khusus (jas, gaun).'],
        ['name' => 'Cuci Sepatu',    'price' => 30000, 'hours' => 48, 'desc' => 'Cuci sepatu dengan sikat khusus.'],
    ];

    public function definition(): array
    {
        $service = fake()->randomElement($this->services);

        return [
            'name'               => $service['name'] . ' ' . fake()->unique()->numerify('#'),
            'description'        => $service['desc'],
            'price_per_kg'       => $service['price'],
            'est_duration_hours' => $service['hours'],
            'is_active'          => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
