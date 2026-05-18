<?php

namespace Database\Seeders;

use App\Models\CompanySetting;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Owner default ────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'owner@laundrop.id'],
            [
                'name'          => 'Owner Laundrop',
                'phone'         => '08112345678',
                'password_hash' => Hash::make('password123!'),
                'role'          => 'owner',
                'is_active'     => true,
            ]
        );

        // ── Employee demo ────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'karyawan@laundrop.id'],
            [
                'name'          => 'Budi Santoso',
                'phone'         => '08222345678',
                'password_hash' => Hash::make('password123!'),
                'role'          => 'employee',
                'is_active'     => true,
            ]
        );

        // ── Customer demo ────────────────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'customer@laundrop.id'],
            [
                'name'          => 'Ani Wijaya',
                'phone'         => '08333345678',
                'password_hash' => Hash::make('password123!'),
                'role'          => 'customer',
                'is_active'     => true,
            ]
        );

        // ── Services ─────────────────────────────────────────────────────────
        $services = [
            ['name' => 'Cuci Kering',   'description' => 'Cuci dan lipat pakaian dengan detergen standar.',             'price_per_kg' => 5000,  'est_duration_hours' => 48],
            ['name' => 'Cuci Setrika',   'description' => 'Cuci cepat, selesai dalam 6 jam.',                            'price_per_kg' => 6000, 'est_duration_hours' => 6],
            ['name' => 'Laundry Express', 'description' => 'Pakaian dicuci bersih kemudian disetrika rapi.',              'price_per_kg' => 20000, 'est_duration_hours' => 72],
            ['name' => 'Setrika Saja',   'description' => 'Pembersihan kimia untuk pakaian khusus (jas, gaun, blazer).', 'price_per_kg' => 5000, 'est_duration_hours' => 96],

        ];

        foreach ($services as $svc) {
            Service::firstOrCreate(['name' => $svc['name']], array_merge($svc, ['is_active' => true]));
        }

        // ── Company Settings ─────────────────────────────────────────────────
        CompanySetting::firstOrCreate([], [
            'company_name'    => 'Laundrop',
            'address'         => 'Jl. Gajah Mada No. 10, Semarang Atas, Jawa Tengah',
            'phone'           => '024-1234567',
            'email'           => 'info@laundrop.id',
            'operating_hours' => [
                'monday_friday' => '08:00 - 20:00',
                'saturday'      => '08:00 - 17:00',
                'sunday'        => 'Tutup',
            ],
            'service_area'    => 'Semarang Atas (Candisari, Gajahmungkur, Candi, Srondol)',
        ]);
    }
}
