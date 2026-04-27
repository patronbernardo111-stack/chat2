/**
 * notifications.ts — Notificaciones nativas con expo-notifications
 * Funciona con el teléfono hibernado gracias a FCM (Firebase Cloud Messaging)
 */
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './api';

const API_BASE = 'https://egchat-api-1.onrender.com';
const BACKGROUND_TASK = 'EGCHAT_BACKGROUND_NOTIFICATION';

// ── Configurar cómo se muestran las notificaciones en primer plano ──────────
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as any;
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // Llamadas: prioridad máxima y no se auto-descartan
      priority: data?.notificationType === 'incoming_call'
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

// ── Tarea en segundo plano para notificaciones recibidas con app cerrada ────
TaskManager.defineTask(BACKGROUND_TASK, ({ data, error }) => {
  if (error) { console.error('BG notification error:', error); return; }
  // La notificación ya fue mostrada por FCM — aquí podemos hacer lógica extra
  console.log('BG notification received:', data);
});

// ── Crear canales Android ───────────────────────────────────────────────────
async function createChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('egchat-messages', {
    name: 'Mensajes',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00c8a0',
    sound: 'notification.wav',
    enableVibrate: true,
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync('egchat-calls', {
    name: 'Llamadas',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lightColor: '#facc15',
    sound: 'notification.wav',
    enableVibrate: true,
    showBadge: false,
    // Permite mostrar sobre otras apps (pantalla bloqueada)
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

// ── Solicitar permisos y registrar token FCM ────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  await createChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Permisos de notificación denegados');
    return null;
  }

  // Obtener token Expo Push (que internamente usa FCM en Android)
  // projectId debe ser el EAS Project ID (UUID de expo.dev/accounts/<user>/projects/<slug>)
  // Si no tienes EAS configurado, corre: npx eas init
  let expoPushToken: string | null = null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId
        ?? Constants.easConfig?.projectId
        ?? undefined,
    });
    expoPushToken = tokenData.data;
  } catch (e) {
    console.warn('No se pudo obtener Expo Push Token:', e);
    // Intentar con token FCM nativo directamente (solo Android)
    if (Platform.OS === 'android') {
      try {
        const nativeToken = await Notifications.getDevicePushTokenAsync();
        expoPushToken = nativeToken.data as string;
      } catch (e2) {
        console.warn('No se pudo obtener token FCM nativo:', e2);
      }
    }
  }

  if (!expoPushToken) {
    console.warn('Sin token push — las notificaciones no funcionarán en background');
    return null;
  }

  await AsyncStorage.setItem('expoPushToken', expoPushToken);

  // Registrar en el servidor
  await syncTokenWithServer(expoPushToken);

  return expoPushToken;
}

// ── Enviar token al servidor ────────────────────────────────────────────────
export async function syncTokenWithServer(expoPushToken: string) {
  const authToken = await getToken();
  if (!authToken) return;

  try {
    await fetch(`${API_BASE}/api/push/register-expo-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expoPushToken, platform: Platform.OS }),
    });
  } catch (e) {
    console.warn('No se pudo registrar token push:', e);
  }
}

// ── Escuchar notificaciones recibidas (app en primer plano) ─────────────────
export function setupNotificationListeners(
  onMessage: (chatId: string) => void,
  onCall: (callData: { callId: string; callerName: string; callType: string }) => void
) {
  // Notificación recibida con app abierta
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    const data = notification.request.content.data as any;
    if (data?.notificationType === 'incoming_call') {
      onCall({
        callId: data.callId,
        callerName: data.callerName,
        callType: data.callType || 'audio',
      });
    }
  });

  // Usuario tocó la notificación
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as any;
    const action = response.actionIdentifier;

    if (data?.notificationType === 'incoming_call') {
      if (action === 'REJECT') return; // ignorar
      onCall({
        callId: data.callId,
        callerName: data.callerName,
        callType: data.callType || 'audio',
      });
    } else if (data?.chatId) {
      onMessage(data.chatId);
    }
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

// ── Limpiar badge ───────────────────────────────────────────────────────────
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}
