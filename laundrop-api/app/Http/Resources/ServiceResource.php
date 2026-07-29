<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'description'         => $this->description,
            'price_per_kg'        => $this->price_per_kg,
            'est_duration_hours'  => $this->est_duration_hours,
            'is_active'           => $this->is_active,
        ];
    }
}
