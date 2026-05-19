<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role, ['employee', 'owner']);
    }

    public function rules(): array
    {
        return [
            'status'      => 'required|in:confirmed,picking_up,picked_up,processing,ready,delivering,delivered',
            'notes'       => 'nullable|string|max:500',
            'photo'       => 'nullable|image|max:5120', // 5MB
        ];
    }
}