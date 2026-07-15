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
            'status'      => 'required|in:waiting_confirmation,pickup,picked_up,waiting_payment,washing,washing_finished,delivery,completed,cancelled',
            'notes'       => 'nullable|string|max:500',
            'photo'       => 'nullable|image|max:5120', // 5MB
        ];
    }
}