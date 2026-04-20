import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.egchat.app',
  appName: 'EGCHAT',
  webDir: 'dist',
  server: {
    // OTA gratuito: la app siempre carga desde Vercel
    // Cada deploy actualiza la app automáticamente sin reinstalar
    url: 'https://egchat-app.vercel.app',
    cleartext: true,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#00c8a0'
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
