<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ServiceController extends Controller
{
    // ─── GET /api/services ────────────────────────────────────────────────────
    // Public: semua role bisa lihat layanan aktif

    public function index(): JsonResponse
    {
        $services = Service::active()->get();
        return $this->success($services);
    }

    // ─── POST /api/services ───────────────────────────────────────────────────
    // Owner only

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'               => 'required|string|max:255|unique:services,name',
            'description'        => 'nullable|string',
            'price_per_kg'       => 'required|numeric|min:0',
            'est_duration_hours' => 'required|integer|min:1',
            'is_active'          => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $service = Service::create($validator->validated());

        return $this->success($service, 'Layanan berhasil ditambahkan', 201);
    }

    // ─── GET /api/services/{id} ───────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        return $this->success(Service::findOrFail($id));
    }

    // ─── PUT /api/services/{id} ───────────────────────────────────────────────
    // Owner only

    public function update(Request $request, int $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'               => "sometimes|string|max:255|unique:services,name,{$id}",
            'description'        => 'nullable|string',
            'price_per_kg'       => 'sometimes|numeric|min:0',
            'est_duration_hours' => 'sometimes|integer|min:1',
            'is_active'          => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $service->update($validator->validated());

        return $this->success($service, 'Layanan berhasil diperbarui');
    }

    // ─── DELETE /api/services/{id} ────────────────────────────────────────────
    // Soft delete: nonaktifkan saja, jangan hapus karena ada relasi ke orders

    public function destroy(int $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->update(['is_active' => false]);

        return $this->success(null, 'Layanan berhasil dinonaktifkan');
    }
}
