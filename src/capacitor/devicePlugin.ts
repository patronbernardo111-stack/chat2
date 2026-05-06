/**
 * devicePlugin.ts — Integración con @capacitor/device para información del dispositivo
 */
import { Device, DeviceInfo } from '@capacitor/device';

export interface NativeDeviceInfo extends DeviceInfo {
  isNative: boolean;
}

let cachedDeviceInfo: NativeDeviceInfo | null = null;

/**
 * Obtiene información del dispositivo (modelo, SO, versión, etc.)
 */
export async function getDeviceInfo(): Promise<NativeDeviceInfo> {
  try {
    if (cachedDeviceInfo) return cachedDeviceInfo;
    
    const info = await Device.getInfo();
    const deviceId = await Device.getId();
    
    cachedDeviceInfo = {
      ...info,
      isNative: true,
    } as NativeDeviceInfo;
    
    return cachedDeviceInfo;
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      isNative: false,
      platform: '',
      operatingSystem: '',
      osVersion: '',
      manufacturer: '',
      model: '',
      webViewVersion: '',
    } as NativeDeviceInfo;
  }
}

/**
 * Obtiene el ID único del dispositivo
 */
export async function getDeviceId(): Promise<string> {
  try {
    const result = await Device.getId();
    return result.identifier;
  } catch (error) {
    console.error('Error getting device ID:', error);
    return '';
  }
}

/**
 * Obtiene la plataforma actual
 */
export async function getPlatform(): Promise<string> {
  try {
    const info = await getDeviceInfo();
    return info.platform || 'web';
  } catch {
    return 'web';
  }
}

/**
 * Obtiene la versión del SO
 */
export async function getOSVersion(): Promise<string> {
  try {
    const info = await getDeviceInfo();
    return info.osVersion || '';
  } catch {
    return '';
  }
}

/**
 * Obtiene el modelo del dispositivo
 */
export async function getModel(): Promise<string> {
  try {
    const info = await getDeviceInfo();
    return info.model || '';
  } catch {
    return '';
  }
}

/**
 * Verifica si la app está en un dispositivo nativo
 */
export async function isNativeApp(): Promise<boolean> {
  try {
    const info = await getDeviceInfo();
    return info.platform !== 'web';
  } catch {
    return false;
  }
}

/**
 * Verifica si es dispositivo iOS
 */
export async function isIOS(): Promise<boolean> {
  try {
    const info = await getDeviceInfo();
    return info.platform?.toLowerCase() === 'ios';
  } catch {
    return false;
  }
}

/**
 * Verifica si es dispositivo Android
 */
export async function isAndroid(): Promise<boolean> {
  try {
    const info = await getDeviceInfo();
    return info.platform?.toLowerCase() === 'android';
  } catch {
    return false;
  }
}
