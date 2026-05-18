<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class CompanySettingController extends Controller
{
    // ─── GET /api/company ─────────────────────────────────────────────────────
    // Public: dipakai frontend untuk tampilan info perusahaan

    public function show(): JsonResponse
    {
        return $this->success(CompanySetting::get());
    }

    // ─── PUT /api/admin/company ───────────────────────────────────────────────
    // Owner only

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_name'    => 'sometimes|string|max:255',
            'address'         => 'sometimes|string',
            'phone'           => 'sometimes|string|max:20',
            'email'           => 'sometimes|email',
            'operating_hours' => 'sometimes|array',
            'service_area'    => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $setting = CompanySetting::get();

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $request->validate(['logo' => 'image|max:2048']);
            $path = $request->file('logo')->store('company', 'public');
            $setting->logo_path = $path;
        }

        $setting->fill($validator->validated());
        $setting->save();

        return $this->success($setting, 'Pengaturan perusahaan berhasil diperbarui');
    }
}
