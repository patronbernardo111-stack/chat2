import { useEffect, useState, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { authAPI, setUnauthorizedHandler } from '../src/api';
import { registerForPushNotifications, setupNotificationListeners, clearBadge } from '../src/notifications';
import { Colors } from '../src/theme';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const notifCleanup = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Interceptor global 401
    setUnauthorizedHandler(() => {
      router.replace('/(auth)/login');
    });

    const init = async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          try {
            await authAPI.me();
            router.replace('/(tabs)');

            // Registrar push notifications
            const pushToken = await registerForPushNotifications();
            if (pushToken) {
              console.log('✅ Push token:', pushToken.substring(0, 30) + '...');
            }

            // Listeners de notificaciones
            notifCleanup.current = setupNotificationListeners(
              (chatId) => router.push(`/chat/${chatId}` as any),
              (callData) => {
                // Navegar a pantalla de llamada cuando esté implementada
                console.log('Llamada entrante:', callData);
              }
            );

            // Limpiar badge al abrir
            clearBadge();

            // Manejar notificación que abrió la app (app estaba cerrada)
            const lastResponse = await Notifications.getLastNotificationResponseAsync();
            if (lastResponse) {
              const data = lastResponse.notification.request.content.data as any;
              if (data?.chatId) {
                setTimeout(() => router.push(`/chat/${data.chatId}` as any), 500);
              }
            }
          } catch {
            router.replace('/(auth)/login');
          }
        } else {
          router.replace('/(auth)/login');
        }
      } finally {
        setChecking(false);
      }
    };

    init();

    return () => { notifCleanup.current?.(); };
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={Colors.bgPrimary} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" />
          <Stack.Screen name="contacts" options={{ presentation: 'modal' }} />
          <Stack.Screen name="stories" options={{ presentation: 'modal' }} />
          <Stack.Screen name="map" options={{ presentation: 'modal' }} />
          <Stack.Screen name="qr-scanner" options={{ presentation: 'fullScreenModal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
