// Biometría — Face ID (iOS) y huella dactilar (Android)
// Usa expo-local-authentication que ya viene con Expo SDK

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'egchat_biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'egchat_biometric_credentials';

// ── Verificar soporte ─────────────────────────────────────────────
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Huella dactilar';
  return 'Biometría';
}

// ── Autenticar ────────────────────────────────────────────────────
export async function authenticateWithBiometrics(reason = 'Confirma tu identidad'): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

// ── Guardar credenciales para login biométrico ────────────────────
export async function saveBiometricCredentials(phone: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, JSON.stringify({ phone, password }));
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
}

export async function getBiometricCredentials(): Promise<{ phone: string; password: string } | null> {
  try {
    const data = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}

export async function disableBiometricLogin(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
}
