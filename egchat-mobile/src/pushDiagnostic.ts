/**
 * pushDiagnostic.ts — Diagnóstico de notificaciones push
 * Llama a runPushDiagnostic() desde ajustes para ver qué falla
 */
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './api';

const API_BASE = 'https://egchat-api-1.onrender.com';

export async function runPushDiagnostic(): Promise<string> {
  const lines: string[] = [];

  lines.push(`📱 Plataforma: ${Platform.OS} ${Platform.Version}`);
  lines.push(`📦 App: ${Constants.expoConfig?.name} v${Constants.expoConfig?.version}`);

  // 1. Verificar permisos
  const { status } = await Notifications.getPermissionsAsync();
  lines.push(`🔔 Permisos: ${status}`);

  if (status !== 'granted') {
    lines.push('❌ PROBLEMA: Permisos denegados. Ve a Ajustes > Apps > EGCHAT > Notificaciones');
    const result = lines.join('\n');
    Alert.alert('Diagnóstico Push', result);
    return result;
  }

  // 2. Verificar projectId
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  lines.push(`🆔 EAS Project ID: ${projectId ?? '❌ NO CONFIGURADO'}`);

  // 3. Intentar obtener token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });
    const token = tokenData.data;
    lines.push(`✅ Expo Push Token: ${token.substring(0, 35)}...`);
    await AsyncStorage.setItem('expoPushToken', token);

    // 4. Verificar si está registrado en el servidor
    const authToken = await getToken();
    if (!authToken) {
      lines.push('⚠️ No hay sesión activa — token no enviado al servidor');
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/push/register-expo-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ expoPushToken: token, platform: Platform.OS }),
        });
        const data = await res.json();
        lines.push(`🌐 Servidor: ${res.ok ? '✅ Token registrado' : '❌ ' + data.message}`);
      } catch (e: any) {
        lines.push(`🌐 Servidor: ❌ Error de red — ${e.message}`);
      }
    }
  } catch (e: any) {
    lines.push(`❌ Error obteniendo token: ${e.message}`);
    if (e.message?.includes('projectId')) {
      lines.push('👉 Solución: Corre "npx eas init" en egchat-mobile/ y actualiza app.json');
    }
    if (e.message?.includes('google-services')) {
      lines.push('👉 Solución: Descarga google-services.json de Firebase Console');
    }
  }

  // 5. Verificar canales Android
  if (Platform.OS === 'android') {
    const channels = await Notifications.getNotificationChannelsAsync();
    const channelNames = channels.map(c => c.id).join(', ');
    lines.push(`📢 Canales Android: ${channelNames || 'ninguno'}`);
    const hasCallChannel = channels.some(c => c.id === 'egchat-calls');
    lines.push(`📞 Canal llamadas: ${hasCallChannel ? '✅' : '❌ falta egchat-calls'}`);
  }

  const result = lines.join('\n');
  Alert.alert('Diagnóstico Push', result, [{ text: 'OK' }]);
  console.log('=== PUSH DIAGNOSTIC ===\n' + result);
  return result;
}
