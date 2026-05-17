import { useEffect, useState, useRef } from 'react';
import { Stack, router, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { authAPI, setUnauthorizedHandler } from '../src/api';
import { registerForPushNotifications, setupNotificationListeners, clearBadge } from '../src/notifications';
import { Colors, ThemeProvider, useThemeContext } from '../src/theme';
import { useWebRTC } from '../src/hooks/useWebRTC';

function StatusBarController() {
  const { isDark } = useThemeContext();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#0d1117' : Colors.bgPrimary} />;
}

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const notifCleanup = useRef<(() => void) | null>(null);
  const incomingCleanup = useRef<(() => void) | null>(null);
  const { pollIncoming } = useWebRTC();
  const navigationRef = useNavigationContainerRef();

  setUnauthorizedHandler(() => {
    router.replace('/(auth)/login');
  });

  useEffect(() => {
    const init = async () => {
      // Polling hasta que el NavigationContainer esté listo
      let attempts = 0;
      while (!navigationRef.isReady() && attempts < 50) {
        await new Promise(r => setTimeout(r, 50));
        attempts++;
      }
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          try {
            const me = await authAPI.me();
            router.replace('/(tabs)/servicios');

            const pushToken = await registerForPushNotifications();
            if (pushToken) console.log('✅ Push token:', pushToken.substring(0, 30) + '...');

            notifCleanup.current = setupNotificationListeners(
              (chatId) => router.push(`/chat/${chatId}` as any),
              (callData) => {
                router.push({
                  pathname: '/call/[callId]',
                  params: {
                    callId: callData.callId,
                    targetName: callData.callerName,
                    callType: callData.callType || 'audio',
                    role: 'callee',
                    offer: callData.offer ? JSON.stringify(callData.offer) : undefined,
                  }
                } as any);
              }
            );

            if (me?.id) {
              incomingCleanup.current = pollIncoming(me.id, (call) => {
                Alert.alert(`📞 Llamada entrante`, `${call.callerName || 'Alguien'} te está llamando`, [
                  { text: 'Rechazar', style: 'destructive', onPress: () => {} },
                  {
                    text: 'Aceptar',
                    onPress: () => router.push({
                      pathname: '/call/[callId]',
                      params: {
                        callId: call.callId,
                        targetName: call.callerName || 'Usuario',
                        targetAvatar: call.callerAvatar || '',
                        callType: call.type || 'audio',
                        role: 'callee',
                        offer: call.offer ? JSON.stringify(call.offer) : undefined,
                      },
                    } as any),
                  },
                ]);
              });
            }

            clearBadge();

            const lastResponse = await Notifications.getLastNotificationResponseAsync();
            if (lastResponse) {
              const data = lastResponse.notification.request.content.data as any;
              if (data?.chatId) setTimeout(() => router.push(`/chat/${data.chatId}` as any), 500);
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

    return () => {
      notifCleanup.current?.();
      incomingCleanup.current?.();
    };
  }, []);

  // El Stack SIEMPRE se renderiza para que el router pueda navegar
  // El spinner se superpone encima mientras checking=true
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBarController />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="contacts" options={{ presentation: 'modal' }} />
            <Stack.Screen name="stories" options={{ presentation: 'modal' }} />
            <Stack.Screen name="map" options={{ presentation: 'modal' }} />
            <Stack.Screen name="_qr-scanner" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="call/[callId]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
            <Stack.Screen name="bancos" options={{ presentation: 'modal' }} />
            <Stack.Screen name="cemac" options={{ presentation: 'modal' }} />
            <Stack.Screen name="ocio" options={{ presentation: 'modal' }} />
            <Stack.Screen name="supermercados" options={{ presentation: 'modal' }} />
            <Stack.Screen name="apuestas" options={{ presentation: 'modal' }} />
            <Stack.Screen name="servicios-diarios" options={{ presentation: 'modal' }} />
            <Stack.Screen name="seguros-salud" options={{ presentation: 'modal' }} />
            <Stack.Screen name="mitaxi" options={{ presentation: 'modal' }} />
            <Stack.Screen name="new-chat" options={{ presentation: 'modal' }} />
            <Stack.Screen name="welcome" />
          </Stack>
          {/* Spinner superpuesto mientras se verifica la sesión */}
          {checking && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
