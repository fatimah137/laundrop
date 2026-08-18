import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

/**
 * React hook for managing route directions from OpenRouteService
 * 
 * @returns {Object} { route, loading, error, getRoute, clearRoute, clearError }
 */
export function useRoute() {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch route between origin and destination
   * 
   * @param {Object} params - Route parameters
   * @param {number} params.origin_lat - Origin latitude
   * @param {number} params.origin_lng - Origin longitude
   * @param {number} params.destination_lat - Destination latitude
   * @param {number} params.destination_lng - Destination longitude
   * @param {string} params.mode - Route mode (driving, walking, bicycling)
   * @returns {Promise<Object|null>} Route data or null on error
   */
  const getRoute = useCallback(async (params) => {
    console.log('🛣️ getRoute called with params:', params);
    setLoading(true);
    setError(null);

    try {
      console.log('📡 Sending request to /route/directions');
      const response = await api.post('/route/directions', params);
      
      console.log('✅ Response received:', response.data);
      console.log('📦 Response structure:', {
        success: response.data?.success,
        hasData: !!response.data?.data,
        dataKeys: response.data?.data ? Object.keys(response.data.data) : [],
        polylinePointsType: typeof response.data?.data?.polyline_points,
        polylinePointsLength: response.data?.data?.polyline_points?.length,
        polylinePointsFirst: response.data?.data?.polyline_points?.[0],
        polylinePointsLast: response.data?.data?.polyline_points?.[response.data?.data?.polyline_points?.length - 1],
      });

      if (response.data?.success) {
        console.log('✅ Route success! polyline_points count:', response.data.data?.polyline_points?.length);
        console.log('📊 Setting route state:', {
          distance: response.data.data?.distance,
          polylinePoints: response.data.data?.polyline_points?.length,
          timestamp: new Date().toLocaleTimeString(),
        });
        setRoute(response.data.data);
        return response.data.data;
      } else {
        const errorMsg = response.data?.message || 'Failed to fetch route';
        setError(errorMsg);
        console.error('❌ Route fetch failed:', errorMsg);
        return null;
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Network error';
      setError(errorMsg);
      console.error('❌ Error fetching route:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear route data
   */
  const clearRoute = useCallback(() => {
    console.log('🗑️ clearRoute called - clearing route state');
    setRoute(null);
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    console.log('🗑️ clearError called - clearing error state');
    setError(null);
  }, []);

  // 🐛 Track route state changes in the hook
  useEffect(() => {
    console.log('🎯 useRoute state changed:', {
      hasRoute: !!route,
      polylinePointsCount: route?.polyline_points?.length || 0,
      distance: route?.distance,
      loading,
      error,
      timestamp: new Date().toLocaleTimeString(),
    });
  }, [route, loading, error]);

  return {
    route,
    loading,
    error,
    getRoute,
    clearRoute,
    clearError,
  };
}
