<?php

namespace Database\Seeders;

use App\Models\CompanySetting;
use Illuminate\Database\Seeder;

class CompanySettingSeeder extends Seeder
{
    public function run(): void
    {
        CompanySetting::updateOrCreate(
            ['id' => 1],
            [
                'company_name' => 'Laundrop',
                'address' => 'Jl. Gajah Mada No. 10, Semarang',
                'phone' => '024-1234567',
                'email' => 'laundropbusiness@gmail.com',
                'operating_hours' => [
                    'monday_friday' => '08:00 - 20:00',
                    'saturday' => '08:00 - 17:00',
                    'sunday' => 'Tutup',
                ],
                'service_area' => 'Tembalang dan sekitarnya',
            ]
        );
    }
}
