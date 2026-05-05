// useGPS.ts — Hook centralizado de geolocalización para React Native + Expo
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

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
  watch?: boolean;
  highAccuracy?: boolean;
  timeout?: number;
  onUpdate?: (pos: GPSPosition) => void;
  reverseGeocode?: boolean;
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
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastCityFetch = useRef<{ lat: number; lng: number } | null>(null);

  const fetchCity = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (lastCityFetch.current) {
      const dlat = Math.abs(lat - lastCityFetch.current.lat);
      const dlng = Math.abs(lng - lastCityFetch.current.lng);
      if (dlat < 0.02 && dlng < 0.02) return '';
    }
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      lastCityFetch.current = { lat, lng };
      return result?.city || result?.subregion || result?.region || '';
    } catch {
      return '';
    }
  }, []);

  const handlePosition = useCallback(async (loc: Location.LocationObject) => {
    const { latitude: lat, longitude: lng, accuracy, heading, speed } = loc.coords;
    const newPos: GPSPosition = { lat, lng, accuracy: accuracy ?? undefined, heading, speed, timestamp: loc.timestamp };

    if (reverseGeocode) {
      const city = await fetchCity(lat, lng);
      if (city) newPos.city = city;
    }

    setPosition(newPos);
    setLoading(false);
    setError(null);
    onUpdate?.(newPos);
  }, [reverseGeocode, fetchCity, onUpdate]);

  const requestPosition = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Permiso de ubicación denegado. Actívalo en ajustes.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });
      handlePosition(loc);
    } catch {
      setError('No se pudo obtener la ubicación.');
      setLoading(false);
    }
  }, [handlePosition, highAccuracy]);

  useEffect(() => {
    let active = true;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado.');
        return;
      }
      setLoading(true);

      if (watch) {
        subscriptionRef.current = await Location.watchPositionAsync(
          { accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 5 },
          (loc) => { if (active) handlePosition(loc); }
        );
      } else {
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
          });
          if (active) handlePosition(loc);
        } catch {
          if (active) { setError('No se pudo obtener la ubicación.'); setLoading(false); }
        }
      }
    };

    start();

    return () => {
      active = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [watch, highAccuracy]);

  return { position, error, loading, requestPosition };
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
