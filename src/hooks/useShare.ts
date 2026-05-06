/**
 * useShare.ts — Hook de React para compartir contenido con Capacitor
 */
import { useState, useCallback } from 'react';
import {
  shareContent as shareContentFn,
  shareText as shareTextFn,
  shareUrl as shareUrlFn,
  shareFiles as shareFilesFn,
  canShare as canShareFn,
  ShareData,
} from '../capacitor/sharePlugin';

export interface UseShareState {
  loading: boolean;
  error: string | null;
  canShare: boolean;
}

export interface UseShareActions {
  shareContent: (data: ShareData) => Promise<void>;
  shareText: (text: string, title?: string) => Promise<void>;
  shareUrl: (url: string, title?: string) => Promise<void>;
  shareFiles: (files: string[], title?: string) => Promise<void>;
  checkCanShare: () => Promise<void>;
}

export function useShare(): UseShareState & UseShareActions {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canShareDevice, setCanShare] = useState(false);

  const checkCanShare = useCallback(async () => {
    try {
      const result = await canShareFn();
      setCanShare(result);
    } catch (err) {
      console.error('Error checking share capability:', err);
      setCanShare(false);
    }
  }, []);

  const shareContent = useCallback(async (data: ShareData) => {
    setLoading(true);
    setError(null);
    try {
      const success = await shareContentFn(data);
      if (!success) {
        setError('Failed to share content');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const shareText = useCallback(async (text: string, title?: string) => {
    return shareContent({ text, title });
  }, [shareContent]);

  const shareUrl = useCallback(async (url: string, title?: string) => {
    return shareContent({ url, title });
  }, [shareContent]);

  const shareFiles = useCallback(async (files: string[], title?: string) => {
    return shareContent({ files, title });
  }, [shareContent]);

  return {
    loading,
    error,
    canShare: canShareDevice,
    shareContent,
    shareText,
    shareUrl,
    shareFiles,
    checkCanShare,
  };
}
