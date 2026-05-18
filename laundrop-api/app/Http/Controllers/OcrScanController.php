<?php

namespace App\Http\Controllers;

use App\Models\OcrScan;
use App\Models\Order;
use App\Models\Transaction;
use App\Services\OcrService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class OcrScanController extends Controller
{
    public function __construct(private OcrService $ocrService) {}

    // ─── POST /api/ocr/scan ───────────────────────────────────────────────────
    // Employee upload foto nota → OCR otomatis

    public function scan(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'image'    => 'required|image|mimes:jpg,jpeg,png|max:10240',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $order = Order::findOrFail($request->order_id);

        // Simpan gambar
        $imagePath = $request->file('image')->store("ocr/{$order->id}", 'public');

        // Proses OCR via Google Vision
        $ocrResult = $this->ocrService->process(storage_path("app/public/{$imagePath}"));

        $scan = OcrScan::create([
            'order_id'          => $order->id,
            'scanned_by'        => $request->user()->id,
            'image_path'        => $imagePath,
            'extracted_weight'  => $ocrResult['weight'] ?? null,
            'extracted_service' => $ocrResult['service'] ?? null,
            'extracted_price'   => $ocrResult['price'] ?? null,
            'raw_ocr_text'      => $ocrResult['raw_text'] ?? null,
            'accuracy_score'    => $ocrResult['confidence'] ?? 0,
            'is_corrected'      => false,
        ]);

        return $this->success([
            'scan'            => $scan,
            'needs_correction' => $scan->needsCorrection(),
        ], 'Scan OCR berhasil');
    }

    // ─── PATCH /api/ocr/{id}/correct ─────────────────────────────────────────
    // Employee koreksi manual hasil OCR

    public function correct(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'corrected_weight' => 'required|numeric|min:0.1|max:100',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        $scan = OcrScan::findOrFail($id);

        $scan->update([
            'corrected_weight' => $request->corrected_weight,
            'is_corrected'     => true,
        ]);

        return $this->success($scan, 'Koreksi OCR berhasil disimpan');
    }

    // ─── POST /api/ocr/{id}/finalize ─────────────────────────────────────────
    // Setelah OCR selesai (dan koreksi jika perlu), buat transaksi

    public function finalize(Request $request, int $id): JsonResponse
    {
        $scan = OcrScan::with(['order.service'])->findOrFail($id);

        if ($scan->needsCorrection() && ! $scan->is_corrected) {
            return $this->error('Akurasi OCR rendah. Lakukan koreksi manual terlebih dahulu.', 422);
        }

        if ($scan->transaction) {
            return $this->error('Transaksi untuk scan ini sudah dibuat', 422);
        }

        $finalWeight = $scan->finalWeight();
        $pricePerKg  = $scan->order->service->price_per_kg;
        $subtotal    = Transaction::calculateSubtotal($finalWeight, $pricePerKg);

        $transaction = Transaction::create([
            'order_id'      => $scan->order_id,
            'ocr_scan_id'   => $scan->id,
            'actual_weight' => $finalWeight,
            'price_per_kg'  => $pricePerKg,
            'subtotal'      => $subtotal,
            'total_amount'  => $subtotal, // bisa ditambah biaya antar dsb
        ]);

        // Update actual_weight di order
        $scan->order->update([
            'actual_weight' => $finalWeight,
            'status'        => Order::STATUS_BILLED,
        ]);

        return $this->success($transaction->load('payment'), 'Transaksi berhasil dibuat');
    }
}
