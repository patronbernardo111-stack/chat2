import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'egchat_cache_';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Estado inicial
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
      setIsChecking(false);
    });

    // Suscripción a cambios
    const unsub = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    return unsub;
  }, []);

  /** Guarda datos en cache local */
  const saveCache = useCallback(async (key: string, data: unknown) => {
    try {
      await AsyncStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify({ data, ts: Date.now() })
      );
    } catch {}
  }, []);

  /** Lee cache local. maxAgeMs = tiempo máximo de validez (default 24h) */
  const readCache = useCallback(async <T>(key: string, maxAgeMs = 86_400_000): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > maxAgeMs) return null;
      return data as T;
    } catch {
      return null;
    }
  }, []);

  /** Fetch con fallback a cache cuando offline */
  const fetchWithCache = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    maxAgeMs?: number
  ): Promise<{ data: T | null; fromCache: boolean }> => {
    if (isOnline) {
      try {
        const data = await fetcher();
        await saveCache(key, data);
        return { data, fromCache: false };
      } catch {
        const cached = await readCache<T>(key, maxAgeMs);
        return { data: cached, fromCache: true };
      }
    } else {
      const cached = await readCache<T>(key, maxAgeMs);
      return { data: cached, fromCache: true };
    }
  }, [isOnline, saveCache, readCache]);

  return { isOnline, isChecking, saveCache, readCache, fetchWithCache };
}
