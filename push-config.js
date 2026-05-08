/**
 * push-config.js
 * Configuración e inicialización de notificaciones push con Capacitor + FCM.
 *
 * Instalación (ya incluidas en este proyecto):
 *   npm install @capacitor/core@^8.3.1
 *   npm install @capacitor/push-notifications@^8.0.3
 *   npx cap sync android
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Inicializa el sistema de notificaciones push.
 *
 * @param {object} options
 * @param {function(string): void}  options.onToken      - Callback con el token FCM al registrarse.
 * @param {function(object): void}  options.onReceived   - Callback cuando llega una notificación en primer plano.
 * @param {function(object): void}  options.onAction     - Callback cuando el usuario toca la notificación.
 * @param {function(object): void}  [options.onDeleted]  - Callback cuando una notificación es descartada (Android).
 * @param {function(string): void}  [options.onError]    - Callback de error en el registro.
 * @returns {Promise<void>}
 */
export async function initPushNotifications({
  onToken,
  onReceived,
  onAction,
  onDeleted,
  onError,
} = {}) {

  // Solo ejecutar en plataformas nativas (Android / iOS).
  // En web, Capacitor no soporta push nativo de esta forma.
  if (!Capacitor.isNativePlatform()) {
    console.warn('[Push] No es una plataforma nativa. Push notifications omitidas.');
    return;
  }

  // ── Paso 1: Solicitar permisos ──────────────────────────────────────────
  // En Android 13+ (API 33) se requiere permiso POST_NOTIFICATIONS en tiempo de ejecución.
  // En iOS siempre se solicita al usuario.
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    const msg = `[Push] Permiso denegado: ${permStatus.receive}`;
    console.error(msg);
    onError?.(msg);
    return; // Sin permiso no tiene sentido continuar
  }

  console.log('[Push] Permiso concedido.');

  // ── Paso 2: Registrar listeners ANTES de llamar a register() ───────────
  // Es importante añadir los listeners primero para no perder eventos
  // que puedan dispararse inmediatamente tras el registro.

  // Token FCM obtenido con éxito
  await PushNotifications.addListener('registration', (token) => {
    console.log('[Push] Token FCM recibido:', token.value);
    onToken?.(token.value);
  });

  // Error durante el registro en FCM / APNs
  await PushNotifications.addListener('registrationError', (err) => {
    const msg = `[Push] Error de registro: ${JSON.stringify(err)}`;
    console.error(msg);
    onError?.(msg);
  });

  // Notificación recibida con la app en primer plano
  await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Notificación recibida en foreground:', notification);
    onReceived?.(notification);
  });

  // Usuario tocó la notificación (app en background o cerrada)
  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('[Push] Acción realizada sobre notificación:', action);
    onAction?.(action);
  });

  // Notificación descartada sin interacción (principalmente Android)
  await PushNotifications.addListener('pushNotificationDeleted', (notification) => {
    console.log('[Push] Notificación eliminada sin acción:', notification);
    onDeleted?.(notification);
  });

  // ── Paso 3: Registrar el dispositivo en FCM / APNs ─────────────────────
  // Esto dispara el evento 'registration' (o 'registrationError') definido arriba.
  try {
    await PushNotifications.register();
    console.log('[Push] Registro iniciado correctamente.');
  } catch (err) {
    const msg = `[Push] Fallo al llamar register(): ${err?.message ?? err}`;
    console.error(msg);
    onError?.(msg);
  }
}

/**
 * Elimina todos los listeners de push activos.
 * Llama a esta función al desmontar el componente raíz o al cerrar sesión.
 *
 * @returns {Promise<void>}
 */
export async function removePushListeners() {
  if (!Capacitor.isNativePlatform()) return;
  await PushNotifications.removeAllListeners();
  console.log('[Push] Todos los listeners eliminados.');
}
