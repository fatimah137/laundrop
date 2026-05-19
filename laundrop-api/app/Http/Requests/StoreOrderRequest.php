<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Hanya customer yang bisa buat order
        return $this->user()->role === 'customer';
    }

    public function rules(): array
    {
        return [
            'service_id'       => 'required|exists:services,id',
            'pickup_address'   => 'required|string|max:500',
            'pickup_lat'       => 'nullable|numeric|between:-90,90',
            'pickup_lng'       => 'nullable|numeric|between:-180,180',
            'pickup_date'      => 'required|date|after_or_equal:today',
            'pickup_time'      => 'required|date_format:H:i',
            'estimated_weight' => 'nullable|numeric|min:0.1|max:100',
            'payment_method'   => 'required|in:cash,qris',
            'notes'            => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'pickup_date.after_or_equal' => 'Tanggal penjemputan tidak boleh di masa lalu.',
            'service_id.exists'          => 'Layanan yang dipilih tidak ditemukan.',
        ];
    }
}