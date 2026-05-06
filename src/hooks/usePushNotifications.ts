/**
 * usePushNotifications.ts — Hook de React para push notifications con Capacitor
 */
import { useState, useEffect, useRef } from 'react';
import {
  initializePushNotifications,
  onPushNotificationReceived,
  onPushNotificationAction,
  onPushTokenReceived,
  onPushNotificationError,
  PushNotificationSchema,
  PushNotificationActionPerformed,
} from '../capacitor/pushNotificationsPlugin';

export interface UsePushNotificationsState {
  isInitialized: boolean;
  token: string;
  lastNotification: PushNotificationSchema | null;
  lastAction: PushNotificationActionPerformed | null;
  error: string | null;
}

export interface UsePushNotificationsActions {
  initialize: () => Promise<void>;
}

export function usePushNotifications(
  onNotification?: (notification: PushNotificationSchema) => void,
  onAction?: (action: PushNotificationActionPerformed) => void
): UsePushNotificationsState & UsePushNotificationsActions {
  const [isInitialized, setIsInitialized] = useState(false);
  const [token, setToken] = useState('');
  const [lastNotification, setLastNotification] = useState<PushNotificationSchema | null>(null);
  const [lastAction, setLastAction] = useState<PushNotificationActionPerformed | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unsubscribersRef = useRef<Array<() => void>>([]);

  const initialize = async () => {
    try {
      setError(null);
      const success = await initializePushNotifications();

      if (success) {
        // Escuchar notificaciones recibidas
        const unsubNotif = onPushNotificationReceived((notification) => {
          setLastNotification(notification);
          onNotification?.(notification);
        });

        // Escuchar acciones
        const unsubAction = onPushNotificationAction((action) => {
          setLastAction(action);
          onAction?.(action);
        });

        // Escuchar token
        const unsubToken = onPushTokenReceived((tkn) => {
          setToken(tkn);
        });

        // Escuchar errores
        const unsubError = onPushNotificationError((err) => {
          setError(err?.message || 'Push notification error');
        });

        unsubscribersRef.current = [unsubNotif, unsubAction, unsubToken, unsubError];
        setIsInitialized(true);
      } else {
        setError('Failed to initialize push notifications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    // Inicializar automáticamente al montar
    initialize();

    // Limpiar listeners al desmontar
    return () => {
      unsubscribersRef.current.forEach((unsubscribe) => unsubscribe?.());
    };
  }, []);

  return {
    isInitialized,
    token,
    lastNotification,
    lastAction,
    error,
    initialize,
  };
}
