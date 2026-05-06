/**
 * cameraPlugin.ts — Integración con @capacitor/camera para capturar fotos/videos
 */
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface CameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
  source?: CameraSource;
  direction?: 'front' | 'rear';
}

/**
 * Captura una foto desde la cámara o galería
 */
export async function capturePhoto(options?: CameraOptions): Promise<Photo | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: options?.quality ?? 90,
      allowEditing: options?.allowEditing ?? false,
      resultType: options?.resultType ?? CameraResultType.Uri,
      source: options?.source ?? CameraSource.Prompt,
      direction: options?.direction === 'front' ? 'FRONT' : 'REAR',
    });
    return photo;
  } catch (error) {
    console.error('Error capturing photo:', error);
    return null;
  }
}

/**
 * Captura una foto desde la cámara (no galería)
 */
export async function takePhoto(useFrontCamera = false): Promise<Photo | null> {
  return capturePhoto({
    source: CameraSource.Camera,
    direction: useFrontCamera ? 'front' : 'rear',
    resultType: CameraResultType.Base64,
  });
}

/**
 * Selecciona una foto de la galería
 */
export async function pickPhoto(): Promise<Photo | null> {
  return capturePhoto({
    source: CameraSource.Photos,
    resultType: CameraResultType.Uri,
  });
}

/**
 * Verifica permisos de cámara
 */
export async function checkCameraPermission(): Promise<boolean> {
  try {
    const status = await Camera.checkPermissions();
    return status.camera === 'granted';
  } catch {
    return false;
  }
}

/**
 * Solicita permisos de cámara
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const status = await Camera.requestPermissions();
    return status.camera === 'granted';
  } catch {
    return false;
  }
}
