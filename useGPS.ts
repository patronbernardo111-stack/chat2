// useGPS.ts — Hook centralizado de geolocalización para toda la app
import { useState, useEffect, useRef, useCallback } from 'react';

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  city?: string;
}

interface UseGPSOptions {
  watch?: boolean;          // true = seguimiento continuo, false = una sola vez
  highAccuracy?: boolean;   // true = GPS preciso (más batería)
  timeout?: number;         // ms antes de error
  onUpdate?: (pos: GPSPosition) => void;
  reverseGeocode?: boolean; // obtener nombre de ciudad
}

export function useGPS(options: UseGPSOptions = {}) {
  const {
    watch = false,
    highAccuracy = true,
    timeout = 10000,
    onUpdate,
    reverseGeocode = false,
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastCityFetch = useRef<{ lat: number; lng: number } | null>(null);

  const fetchCity = useCallback(async (lat: number, lng: number): Promise<string> => {
    // Solo buscar ciudad si nos movimos más de 2km
    if (lastCityFetch.current) {
      const dlat = Math.abs(lat - lastCityFetch.current.lat);
      const dlng = Math.abs(lng - lastCityFetch.current.lng);
      if (dlat < 0.02 && dlng < 0.02) return ''; // no ha cambiado suficiente
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      lastCityFetch.current = { lat, lng };
      return data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county || '';
    } catch {
      return '';
    }
  }, []);

  const handlePosition = useCallback(async (pos: GeolocationPosition) => {
    const { latitude: lat, longitude: lng, accuracy, heading, speed } = pos.coords;
    const newPos: GPSPosition = { lat, lng, accuracy, heading, speed, timestamp: pos.timestamp };

    if (reverseGeocode) {
      const city = await fetchCity(lat, lng);
      if (city) newPos.city = city;
    }

    setPosition(newPos);
    setLoading(false);
    setError(null);
    onUpdate?.(newPos);
  }, [reverseGeocode, fetchCity, onUpdate]);

  const handleError = useCallback((err: GeolocationPositionError) => {
    const messages: Record<number, string> = {
      1: 'Permiso de ubicación denegado. Actívalo en ajustes del navegador.',
      2: 'Ubicación no disponible. Verifica que el GPS esté activado.',
      3: 'Tiempo de espera agotado. Intenta de nuevo.',
    };
    setError(messages[err.code] || 'Error de geolocalización');
    setLoading(false);
  }, []);

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: highAccuracy,
      timeout,
      maximumAge: 5000,
    });
  }, [handlePosition, handleError, highAccuracy, timeout]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización');
      return;
    }

    setLoading(true);

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePosition, handleError,
        { enableHighAccuracy: highAccuracy, timeout, maximumAge: 2000 }
      );
    } else {
      navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
        enableHighAccuracy: highAccuracy,
        timeout,
        maximumAge: 10000,
      });
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watch, highAccuracy, timeout]);

  return { position, error, loading, requestPosition };
}

// Función utilitaria: distancia entre dos puntos en km
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Función utilitaria: formatear coordenadas
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
