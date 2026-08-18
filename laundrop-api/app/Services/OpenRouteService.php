<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class OpenRouteService
{
    /**
     * OSRM (Open Source Routing Machine) API base URL
     * Public service, no API key needed, no authorization required
     */
    private const API_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

    /**
     * Get route from origin to destination using OpenRouteService
     * Supports caching and graceful fallback
     * 
     * @param float $originLat
     * @param float $originLng
     * @param float $destLat
     * @param float $destLng
     * @param array $options
     * @return array
     */
    public function getRoute($originLat, $originLng, $destLat, $destLng, $options = [])
    {
        // Validate coordinates
        if (!$this->validateCoordinates($originLat, $originLng, $destLat, $destLng)) {
            return $this->createFallbackRoute($originLat, $originLng, $destLat, $destLng);
        }

        // Create cache key
        $cacheKey = "route_direction_{$originLat},{$originLng}_to_{$destLat},{$destLng}";

        // Check cache (1 hour TTL)
        $cached = Cache::get($cacheKey);
        if ($cached) {
            Log::info('Route fetched from cache', ['key' => $cacheKey]);
            return $cached;
        }

        try {
            // Build OSRM URL: /route/v1/driving/lng,lat;lng,lat?overview=full&geometries=polyline
            // Note: geometries=polyline is explicit to ensure we get encoded polyline (not geojson)
            $url = self::API_BASE_URL . "/{$originLng},{$originLat};{$destLng},{$destLat}?overview=full&geometries=polyline";
            
            // Call OSRM API (no headers needed, no authorization)
            $response = Http::timeout(30)->get($url);

            if (!$response->successful()) {
                Log::warning('OSRM API failed', [
                    'status' => $response->status(),
                    'url' => $url
                ]);
                return $this->createFallbackRoute($originLat, $originLng, $destLat, $destLng);
            }

            $data = $response->json();

            // Check OSRM response code
            if (($data['code'] ?? '') !== 'Ok') {
                Log::warning('OSRM returned non-Ok code', [
                    'code' => $data['code'] ?? 'unknown',
                    'message' => $data['message'] ?? 'Unknown error'
                ]);
                return $this->createFallbackRoute($originLat, $originLng, $destLat, $destLng);
            }

            Log::info('OSRM API response received', [
                'routes_count' => count($data['routes'] ?? []),
                'distance' => $data['routes'][0]['distance'] ?? 0,
                'duration' => $data['routes'][0]['duration'] ?? 0,
                'has_geometry' => !empty($data['routes'][0]['geometry'] ?? null),
            ]);

            // Parse response and extract route info
            $route = $this->parseRoute($data);

            // Cache the result for 1 hour
            Cache::put($cacheKey, $route, 3600);

            Log::info('Route fetched from OpenRouteService', [
                'distance' => $route['distance'],
                'duration' => $route['duration'],
                'polyline_points_count' => count($route['polyline_points'])
            ]);

            return $route;
        } catch (\Exception $e) {
            Log::error('Error fetching route from OSRM', [
                'error' => $e->getMessage(),
                'origin' => "{$originLat},{$originLng}",
                'destination' => "{$destLat},{$destLng}"
            ]);

            return $this->createFallbackRoute($originLat, $originLng, $destLat, $destLng);
        }
    }

    /**
     * Parse OSRM response
     * 
     * @param array $data
     * @return array
     */
    private function parseRoute($data)
    {
        $route = $data['routes'][0] ?? null;
        
        if (!$route) {
            return $this->createEmptyRoute();
        }

        // OSRM format: distance and duration directly in route
        $distanceMeters = $route['distance'] ?? 0;
        $durationSeconds = $route['duration'] ?? 0;

        // Decode polyline from geometry (OSRM uses polyline encoding)
        $polylinePoints = [];
        $geometryString = $route['geometry'] ?? '';
        
        Log::info('OSRM parseRoute details', [
            'geometry_type' => gettype($geometryString),
            'geometry_length' => strlen($geometryString),
            'geometry_sample' => substr($geometryString, 0, 50),
        ]);
        
        if (!empty($geometryString)) {
            $polylinePoints = $this->decodePolylineEncoded($geometryString);
            
            Log::info('Polyline decoded', [
                'decoded_count' => count($polylinePoints),
                'first_point' => $polylinePoints[0] ?? null,
                'last_point' => end($polylinePoints) ?: null,
            ]);
        }

        return [
            'distance' => [
                'value' => $distanceMeters,
                'text' => number_format($distanceMeters, 0) . ' m',
                'km' => round($distanceMeters / 1000, 2),
            ],
            'duration' => [
                'value' => $durationSeconds,
                'text' => $this->formatDuration($durationSeconds),
            ],
            'polyline_points' => $polylinePoints,
            'steps' => [],  // OSRM steps parsing not implemented yet
            'source' => 'osrm',
        ];
    }

    /**
     * Decode OSRM polyline encoding
     * OSRM uses standard polyline encoding algorithm with precision 6
     * 
     * @param string $encoded Encoded polyline string
     * @return array Array of [lat, lng] coordinate pairs
     */
    private function decodePolylineEncoded($encoded)
    {
        if (!is_string($encoded) || empty($encoded)) {
            Log::warning('Invalid polyline input', [
                'type' => gettype($encoded),
                'value' => substr($encoded, 0, 50)
            ]);
            return [];
        }

        $points = [];
        $index = 0;
        $lat = 0;
        $lng = 0;
        $change = 0;
        $len = strlen($encoded);

        try {
            for ($i = 0; $i < $len; $i++) {
                $byte = ord($encoded[$i]) - 63;
                $value = 0;
                $shift = 0;

                while (($byte & 0x20) > 0) {
                    $value |= ($byte & 0x1f) << $shift;
                    $shift += 5;
                    $i++;
                    if ($i >= $len) break;
                    $byte = ord($encoded[$i]) - 63;
                }

                if ($i < $len) {
                    $value |= ($byte & 0x1f) << $shift;
                    $change = ($value & 1) ? ~($value >> 1) : ($value >> 1);

                    if ($index % 2 == 0) {
                        $lat += $change;
                    } else {
                        $lng += $change;
                        $points[] = [(float)($lat / 1e5), (float)($lng / 1e5)];
                    }

                    $index++;
                }
            }
        } catch (\Exception $e) {
            Log::error('Polyline decode error', [
                'error' => $e->getMessage(),
                'points_decoded' => count($points)
            ]);
        }

        return $points;
    }

    /**
     * Deprecated: Old method for OpenRouteService GeoJSON
     * Kept for reference only
     * 
     * @deprecated Use decodePolylineEncoded instead
     */
    private function decodePolyline($geometry)
    {
        $points = [];

        // OpenRouteService returns coordinates as array of [lng, lat, elevation?]
        if (isset($geometry['coordinates'])) {
            foreach ($geometry['coordinates'] as $coord) {
                if (is_array($coord) && count($coord) >= 2) {
                    // Swap from [lng, lat] to [lat, lng] for Leaflet
                    $points[] = [(float)$coord[1], (float)$coord[0]];
                }
            }
        }

        return $points;
    }

    /**
     * Parse turn-by-turn directions from segments
     * 
     * @param array $segments
     * @return array
     */
    private function parseSteps($segments)
    {
        $steps = [];

        foreach ($segments as $segment) {
            if (!isset($segment['steps'])) continue;

            foreach ($segment['steps'] as $step) {
                $steps[] = [
                    'distance' => $step['distance'] ?? 0,
                    'duration' => $step['duration'] ?? 0,
                    'instruction' => $step['instruction'] ?? 'Continue',
                    'name' => $step['name'] ?? '',
                ];
            }
        }

        return $steps;
    }

    /**
     * Validate coordinates
     * 
     * @param float $originLat
     * @param float $originLng
     * @param float $destLat
     * @param float $destLng
     * @return bool
     */
    private function validateCoordinates($originLat, $originLng, $destLat, $destLng)
    {
        $validateCoord = function ($lat, $lng) {
            return is_numeric($lat) && is_numeric($lng) &&
                   $lat >= -90 && $lat <= 90 &&
                   $lng >= -180 && $lng <= 180;
        };

        return $validateCoord($originLat, $originLng) && 
               $validateCoord($destLat, $destLng);
    }

    /**
     * Create fallback route using Haversine distance calculation
     * Used when API is unavailable or coordinates are invalid
     * 
     * @param float $originLat
     * @param float $originLng
     * @param float $destLat
     * @param float $destLng
     * @return array
     */
    private function createFallbackRoute($originLat, $originLng, $destLat, $destLng)
    {
        $distanceKm = $this->calculateHaversineDistance($originLat, $originLng, $destLat, $destLng);
        $distanceMeters = $distanceKm * 1000;

        // Estimate duration (average 60 km/h)
        $durationSeconds = ($distanceKm / 60) * 3600;

        // Simple straight line polyline
        $polylinePoints = [
            [(float)$originLat, (float)$originLng],
            [(float)$destLat, (float)$destLng],
        ];

        Log::warning('Using fallback route calculation', [
            'distance_km' => $distanceKm,
            'reason' => 'API unavailable or invalid coordinates'
        ]);

        return [
            'distance' => [
                'value' => $distanceMeters,
                'text' => number_format($distanceMeters, 0) . ' m',
                'km' => round($distanceKm, 2),
            ],
            'duration' => [
                'value' => $durationSeconds,
                'text' => $this->formatDuration($durationSeconds),
            ],
            'polyline_points' => $polylinePoints,
            'steps' => [],
            'source' => 'fallback',
            'warning' => 'Using straight-line distance estimate. OpenRouteService API unavailable.',
        ];
    }

    /**
     * Create empty route response
     * 
     * @return array
     */
    private function createEmptyRoute()
    {
        return [
            'distance' => ['value' => 0, 'text' => '0 m', 'km' => 0],
            'duration' => ['value' => 0, 'text' => '0 mins'],
            'polyline_points' => [],
            'steps' => [],
            'source' => 'empty',
            'warning' => 'No route found',
        ];
    }

    /**
     * Calculate Haversine distance between two points
     * 
     * @param float $lat1
     * @param float $lng1
     * @param float $lat2
     * @param float $lng2
     * @return float Distance in kilometers
     */
    private function calculateHaversineDistance($lat1, $lng1, $lat2, $lng2)
    {
        $R = 6371; // Earth radius in km

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $R * $c;

        return round($distance, 2);
    }

    /**
     * Format duration in human-readable format
     * 
     * @param int $seconds
     * @return string
     */
    private function formatDuration($seconds)
    {
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes} mins";
    }
}
