<?php

namespace App\Http\Controllers;

use App\Services\OpenRouteService;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    /**
     * Get route between two coordinates
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRoute(Request $request, OpenRouteService $routeService)
    {
        // Validate request
        $validated = $request->validate([
            'origin_lat'      => 'required|numeric|between:-90,90',
            'origin_lng'      => 'required|numeric|between:-180,180',
            'destination_lat' => 'required|numeric|between:-90,90',
            'destination_lng' => 'required|numeric|between:-180,180',
            'mode'            => 'nullable|in:driving,walking,bicycling',
        ]);

        try {
            // Get route from OpenRouteService
            $route = $routeService->getRoute(
                $validated['origin_lat'],
                $validated['origin_lng'],
                $validated['destination_lat'],
                $validated['destination_lng'],
                ['mode' => $validated['mode'] ?? 'driving']
            );

            return response()->json([
                'success' => true,
                'data' => $route,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in RouteController.getRoute', [
                'error' => $e->getMessage(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch route',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
