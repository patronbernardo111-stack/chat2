import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: 'dist',
  server: {
    // OTA gratuito: la app siempre carga desde Vercel
    // Cada deploy actualiza la app automáticamente sin reinstalar
    url: 'https://egchat-v2.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    hostname: 'egchat-v2.vercel.app',
    allowNavigation: ['egchat-v2.vercel.app', '*.vercel.app', '*.supabase.co']
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#00c8a0',
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#00c8a0',
      showSpinner: false
    }
  }
};

export default config;
