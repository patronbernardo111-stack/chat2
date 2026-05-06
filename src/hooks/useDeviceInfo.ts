/**
 * useDeviceInfo.ts — Hook de React para obtener información del dispositivo con Capacitor
 */
import { useState, useEffect } from 'react';
import { NativeDeviceInfo, getDeviceInfo, isNativeApp } from '../capacitor/devicePlugin';

export interface UseDeviceInfoState {
  info: NativeDeviceInfo | null;
  isNative: boolean;
  loading: boolean;
  error: string | null;
}

export function useDeviceInfo(): UseDeviceInfoState {
  const [info, setInfo] = useState<NativeDeviceInfo | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDeviceInfo = async () => {
      try {
        const deviceInfo = await getDeviceInfo();
        const isNative = await isNativeApp();

        if (isMounted) {
          setInfo(deviceInfo);
          setIsNative(isNative);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDeviceInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  return { info, isNative, loading, error };
}
