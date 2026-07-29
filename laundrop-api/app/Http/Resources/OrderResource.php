<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->id,
            'order_number'     => $this->order_number,
            'status'           => $this->status,
            'order_type'       => $this->order_type,
            'payment_method'   => $this->payment_method,
            'pickup_address'   => $this->pickup_address,
            'delivery_address' => $this->delivery_address,
            'pickup_lat'       => $this->pickup_lat,
            'pickup_lng'       => $this->pickup_lng,
            'delivery_lat'     => $this->delivery_lat,
            'delivery_lng'     => $this->delivery_lng,
            'pickup_date'      => $this->pickup_date?->format('Y-m-d'),
            'pickup_time'      => $this->pickup_time,
            'delivery_distance_km' => $this->delivery_distance_km,
            'delivery_fee'     => $this->delivery_fee,
            'estimated_weight' => $this->estimated_weight,
            'actual_weight'    => $this->actual_weight,
            'notes'            => $this->notes,
            'photos'           => [
                'pickup'   => $this->photo_pickup
                    ? asset('storage/' . $this->photo_pickup) : null,
                'scale'    => $this->photo_scale
                    ? asset('storage/' . $this->photo_scale) : null,
                'delivery' => $this->photo_delivery
                    ? asset('storage/' . $this->photo_delivery) : null,
            ],
            // Backward compatibility — raw photo fields untuk frontend yang masih menggunakan field lama
            'photo_pickup'     => $this->photo_pickup
                ? asset('storage/' . $this->photo_pickup) : null,
            'photo_scale'      => $this->photo_scale
                ? asset('storage/' . $this->photo_scale) : null,
            'photo_delivery'   => $this->photo_delivery
                ? asset('storage/' . $this->photo_delivery) : null,
            'cancelled_at'     => $this->cancelled_at,
            'created_at'       => $this->created_at,

            // Relasi — hanya dimuat kalau di-load
            'service'          => new ServiceResource($this->whenLoaded('service')),
            'customer'         => new UserResource($this->whenLoaded('customer')),
            'employee'         => new UserResource($this->whenLoaded('employee')),
            'transaction'      => $this->whenLoaded('transaction'),
            'status_logs'      => OrderStatusLogResource::collection(
                $this->whenLoaded('statusLogs')
            ),
        ];
    }
}