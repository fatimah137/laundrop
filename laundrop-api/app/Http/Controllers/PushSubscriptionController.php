<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class PushSubscriptionController extends Controller
{
    // ─── POST /api/push/subscribe ─────────────────────────────────────────────

    public function subscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string|url',
            'p256dh'   => 'required|string',
            'auth_key' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        // Upsert: 1 endpoint = 1 subscription
        $subscription = PushSubscription::updateOrCreate(
            ['endpoint' => $request->endpoint],
            [
                'user_id'  => $request->user()->id,
                'p256dh'   => $request->p256dh,
                'auth_key' => $request->auth_key,
            ]
        );

        return $this->success($subscription, 'Push subscription berhasil disimpan', 201);
    }

    // ─── DELETE /api/push/unsubscribe ─────────────────────────────────────────

    public function unsubscribe(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors(), 422);
        }

        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return $this->success(null, 'Unsubscribe berhasil');
    }
}
