/**
 * useCamera.ts — Hook de React para usar la cámara con Capacitor
 */
import { useState, useCallback } from 'react';
import { Photo } from '@capacitor/camera';
import {
  takePhoto as takePhotoFn,
  pickPhoto as pickPhotoFn,
  checkCameraPermission,
  requestCameraPermission,
} from '../capacitor/cameraPlugin';

export interface UseCameraState {
  photo: Photo | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export interface UseCameraActions {
  takePhoto: (useFront?: boolean) => Promise<void>;
  pickPhoto: () => Promise<void>;
  checkPermission: () => Promise<void>;
  requestPermission: () => Promise<void>;
  resetPhoto: () => void;
}

export function useCamera(): UseCameraState & UseCameraActions {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      const allowed = await checkCameraPermission();
      setHasPermission(allowed);
    } catch (err) {
      console.error('Error checking camera permission:', err);
      setHasPermission(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const allowed = await requestCameraPermission();
      setHasPermission(allowed);
      if (!allowed) {
        setError('Camera permission denied');
      }
    } catch (err) {
      setError('Failed to request camera permission');
      console.error(err);
    }
  }, []);

  const takePhoto = useCallback(async (useFront = false) => {
    setLoading(true);
    setError(null);
    try {
      const p = await takePhotoFn(useFront);
      if (p) {
        setPhoto(p);
      } else {
        setError('Failed to take photo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const pickPhoto = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await pickPhotoFn();
      if (p) {
        setPhoto(p);
      } else {
        setError('Failed to pick photo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    photo,
    loading,
    error,
    hasPermission,
    takePhoto,
    pickPhoto,
    checkPermission,
    requestPermission,
    resetPhoto,
  };
}
