import { useState, useEffect, useCallback } from 'react';

/**
 * Hook untuk mendapatkan lokasi realtime customer menggunakan Geolocation API
 * @returns {Object} { location, loading, error, requestLocation }
 *   - location: { lat, lng } atau null
 *   - loading: boolean
 *   - error: string atau null
 *   - requestLocation: function untuk manual request lokasi
 */
export function useCustomerLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasRequested, setHasRequested] = useState(() => {
    try {
      return localStorage.getItem('location_permission_requested') === 'true';
    } catch {
      return false;
    }
  });

  // Function untuk request lokasi dari user
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung di browser Anda');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        };
        
        setLocation(locationData);
        setLoading(false);
        setHasRequested(true);
        
        try {
          localStorage.setItem('location_permission_requested', 'true');
          localStorage.setItem('last_customer_location', JSON.stringify(locationData));
        } catch {
          // Storage error, abaikan
        }
      },
      (err) => {
        setLoading(false);
        
        // Jika user deny permission, jangan show error berulang kali
        if (err.code === err.PERMISSION_DENIED) {
          setError('Lokasi ditolak. Silakan izinkan akses lokasi di browser untuk auto-detect lokasi.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Lokasi tidak tersedia. GPS mungkin sedang mati.');
        } else if (err.code === err.TIMEOUT) {
          setError('Timeout saat mencari lokasi. Coba refresh halaman.');
        } else {
          setError('Gagal mendapatkan lokasi');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Auto-request lokasi saat component mount (hanya sekali)
  useEffect(() => {
    // Cek localStorage untuk saved location
    try {
      const saved = localStorage.getItem('last_customer_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
          setLocation(parsed);
        }
      }
    } catch {
      // Ignore
    }

    // Hanya request sekali saat mount
    if (!hasRequested && navigator.geolocation) {
      requestLocation();
    }
  }, [hasRequested, requestLocation]);

  // Watch position changes setiap 30 detik
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId = null;
    const interval = setInterval(() => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = {
            lat: Number(latitude.toFixed(6)),
            lng: Number(longitude.toFixed(6)),
          };
          
          setLocation(locationData);
          
          // Cache ke localStorage
          try {
            localStorage.setItem('last_customer_location', JSON.stringify(locationData));
          } catch {
            // Storage error, abaikan
          }
        },
        () => {
          // Abaikan error untuk watch, user sudah tahu
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 30000, // Cache 30 detik
        }
      );
    }, 30000);

    return () => {
      clearInterval(interval);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
  };
}
