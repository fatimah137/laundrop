<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderStatusLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->id,
            'order_id'        => $this->order_id,
            'status_before'   => $this->status_before,
            'status_after'    => $this->status_after,
            'notes'           => $this->notes,
            'created_at'      => $this->created_at,
            'changed_by'      => new UserResource($this->whenLoaded('changedBy')),
        ];
    }
}
