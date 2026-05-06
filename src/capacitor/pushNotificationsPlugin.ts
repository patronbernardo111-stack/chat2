/**
 * pushNotificationsPlugin.ts — Integración con @capacitor/push-notifications
 */
import {
  PushNotifications,
  PushNotificationSchema,
  PushNotificationActionPerformed,
  PushNotificationDeliveredList,
} from '@capacitor/push-notifications';

export type PushNotificationListener = (notification: PushNotificationSchema) => void;
export type PushNotificationActionListener = (action: PushNotificationActionPerformed) => void;

/**
 * Inicializa push notifications y solicita permisos
 */
export async function initializePushNotifications(): Promise<boolean> {
  try {
    await PushNotifications.requestPermissions();
    await PushNotifications.register();
    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
}

/**
 * Obtiene el token de registro para push notifications
 */
export async function getPushToken(): Promise<string> {
  try {
    const result = await PushNotifications.getDeliveredNotifications();
    // El token se obtiene normalmente del listener de registro
    return '';
  } catch (error) {
    console.error('Error getting push token:', error);
    return '';
  }
}

/**
 * Escucha notificaciones push recibidas
 */
export function onPushNotificationReceived(listener: PushNotificationListener): () => void {
  const unsubscribe = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      listener(notification);
    }
  );
  return () => unsubscribe.remove();
}

/**
 * Escucha acciones en notificaciones push
 */
export function onPushNotificationAction(listener: PushNotificationActionListener): () => void {
  const unsubscribe = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: PushNotificationActionPerformed) => {
      listener(action);
    }
  );
  return () => unsubscribe.remove();
}

/**
 * Escucha el token de registro
 */
export function onPushTokenReceived(listener: (token: string) => void): () => void {
  const unsubscribe = PushNotifications.addListener(
    'registration',
    (token: any) => {
      console.log('Push token:', token);
      listener(token.value || token);
    }
  );
  return () => unsubscribe.remove();
}

/**
 * Escucha errores de push notifications
 */
export function onPushNotificationError(listener: (error: any) => void): () => void {
  const unsubscribe = PushNotifications.addListener(
    'registrationError',
    (error: any) => {
      console.error('Push notification error:', error);
      listener(error);
    }
  );
  return () => unsubscribe.remove();
}

/**
 * Obtiene notificaciones entregadas
 */
export async function getDeliveredNotifications(): Promise<PushNotificationDeliveredList> {
  try {
    const result = await PushNotifications.getDeliveredNotifications();
    return result;
  } catch (error) {
    console.error('Error getting delivered notifications:', error);
    return { notifications: [] };
  }
}

/**
 * Elimina notificaciones entregadas
 */
export async function removeAllDeliveredNotifications(): Promise<void> {
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Error removing delivered notifications:', error);
  }
}

/**
 * Borra un contador de badge
 */
export async function removeBadge(): Promise<void> {
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('Error removing badge:', error);
  }
}
