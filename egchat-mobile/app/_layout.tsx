import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { authAPI, setUnauthorizedHandler } from '../src/api';
import { Colors } from '../src/theme';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Interceptor global 401 — redirige al login si la sesión expira
    setUnauthorizedHandler(() => {
      router.replace('/(auth)/login');
    });

    // Verificar sesión al arrancar
    const init = async () => {
      try {
        const isAuth = await authAPI.isAuthenticated();
        if (isAuth) {
          // Verificar que el token sigue siendo válido en el servidor
          try {
            await authAPI.me();
            router.replace('/(tabs)');
          } catch {
            // Token inválido o expirado — ir al login
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
