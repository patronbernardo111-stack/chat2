import { useState, useEffect, useRef } from 'react';

interface GPSPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  city?: string;
}

interface UseGPSOptions {
  watch?: boolean;
  highAccuracy?: boolean;
  reverseGeocode?: boolean;
}

interface UseGPSResult {
  position: GPSPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGPS({ watch = false, highAccuracy = true, reverseGeocode = false }: UseGPSOptions = {}): UseGPSResult {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 5000,
    };

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      let city: string | undefined;

      if (reverseGeocode) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb;
        } catch {
          // silently fail
        }
      }

      setPosition({ lat, lng, accuracy, city });
      setLoading(false);
      setError(null);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err.message);
      setLoading(false);
    };

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, options);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [watch, highAccuracy, reverseGeocode]);

  return { position, error, loading };
}

// Calcula distancia en km entre dos coordenadas (fórmula Haversine)
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
