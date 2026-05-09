import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: './dist',

  // ── Android ──────────────────────────────────────────────────────────────
  android: {
    // Edge-to-edge: la app dibuja detrás de la status bar y navigation bar
    // El JS usa env(safe-area-inset-*) para compensar
    backgroundColor: '#f0f2f5',
    // Permitir mixed content (http dentro de https) para APIs locales
    allowMixedContent: true,
    // Capturar el botón Back de Android en el WebView para manejarlo en JS
    captureInput: true,
    // WebView sin zoom manual (la app ya es responsive)
    webContentsDebuggingEnabled: false,
  },

  // ── Plugins ──────────────────────────────────────────────────────────────
  plugins: {
    // Teclado: no redimensionar el viewport, solo hacer pan hacia arriba
    // Esto evita que el layout "salte" cuando aparece el teclado
    Keyboard: {
      resize: 'none',
      style: 'dark',
      resizeOnFullScreen: true,
    },

    // Status bar: transparente para que el header de la app la cubra
    StatusBar: {
      style: 'dark',           // iconos oscuros sobre fondo claro
      backgroundColor: '#00c8a0', // color del header EGCHAT
      overlaysWebView: false,
    },

    // Splash screen: ocultar automáticamente tras 1.5s
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#f0f2f5',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },

    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
