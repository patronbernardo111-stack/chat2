import { useEffect, useState, useRef } from 'react';
import { Stack, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { authAPI } from '../src/api';
import { registerForPushNotifications, setupNotificationListeners, clearBadge } from '../src/notifications';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const notifCleanup = useRef<(() => void) | null>(null);

  // Check authentication status
  useEffect(() => {
    authAPI.isAuthenticated().then(async (auth) => {
      if (auth) {
        router.replace('/(tabs)');
        // Registrar notificaciones push solo si está autenticado
        const pushToken = await registerForPushNotifications();
        if (!pushToken) {
          console.warn('⚠️ Push token no obtenido — notificaciones en background desactivadas');
        } else {
          console.log('✅ Push token registrado:', pushToken.substring(0, 30) + '...');
        }
        // Escuchar notificaciones
        notifCleanup.current = setupNotificationListeners(
          (chatId) => router.push(`/(tabs)` as any),
          (callData) => router.push(`/(tabs)` as any)
        );
        clearBadge();
      } else {
        router.replace('/(auth)/login');
      }
      setChecking(false);
    });

    return () => { notifCleanup.current?.(); };
  }, []);

  // Handle deep linking and QR codes
  useFocusEffect(
    React.useCallback(() => {
      const handleDeepLink = (event: { url: string }) => {
        console.log('Deep link received:', event.url);
        
        // Handle EGCHAT scheme URLs
        if (event.url && event.url.startsWith('egchat://')) {
          // Parse deep link data
          const url = new URL(event.url);
          const path = url.pathname;
          const params = url.searchParams;
          
          console.log('Deep link path:', path);
          console.log('Deep link params:', Object.fromEntries(params));
          
          // Handle different deep link actions
          if (path === '/scan') {
            setShowQR(true);
          } else if (path === '/chat') {
            const chatId = params.get('id');
            if (chatId) {
              router.replace(`/chat/${chatId}`);
            }
          } else if (path === '/taxi') {
            router.replace('/(tabs)/taxi');
          } else {
            // Default to home if authenticated
            authAPI.isAuthenticated().then(auth => {
              if (auth) router.replace('/(tabs)');
              else router.replace('/(auth)/login');
            });
          }
        }
      };

      // Add deep link listener
      const subscription = Linking.addEventListener('url', handleDeepLink);

      // Check for initial URL (app opened from link)
      Linking.getInitialURL().then(url => {
        if (url) {
          handleDeepLink({ url });
        }
      });

      return () => {
        subscription?.remove();
      };
    }, [])
  );

  const handleOpenEGCHAT = async () => {
    const url = Platform.OS === 'ios' 
      ? 'egchat://home' 
      : 'http://localhost:3001'; // Cambiar a producción: 'https://egchat-gq.com'
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir EGCHAT en este dispositivo');
      }
    } catch (error) {
      console.error('Error abriendo EGCHAT:', error);
      Alert.alert('Error', 'No se pudo abrir la aplicación');
    }
  };

  const handleOpenStore = () => {
    // Abrir App Store o Google Play
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/egchat/id123456789');
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.egchat.app');
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#facc15" />
        <Text style={styles.loadingText}>Cargando EGCHAT...</Text>
      </View>
    );
  }

  if (showQR) {
    const QRScanner = require('./_qr-scanner').default;
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#0d1117" />
        <QRScanner 
          onScanComplete={(data) => {
            console.log('QR completado:', data);
            setShowQR(false);
            
            // If QR contains EGCHAT URL, navigate accordingly
            if (data.includes('egchat-gq.com') || data.includes('localhost:3001')) {
              // Open the URL directly
              Linking.openURL(data);
            } else {
              // Navigate to home with the data
              authAPI.isAuthenticated().then(auth => {
                if (auth) router.replace('/(tabs)');
                else router.replace('/(auth)/login');
              });
            }
          }}
          onClose={() => setShowQR(false)}
        />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#00c8a0" />
        
        {/* Header with QR and Open buttons */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>🇬🇶</Text>
            <Text style={styles.brand}>EGCHAT</Text>
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.qrButton} 
              onPress={() => setShowQR(true)}
            >
              <Text style={styles.qrButtonText}>📱 QR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.openButton} 
              onPress={handleOpenEGCHAT}
            >
              <Text style={styles.openButtonText}>🚀 Abrir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main content */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>

        {/* Footer with download option */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.storeButton} onPress={handleOpenStore}>
            <Text style={styles.storeButtonText}>📥 Descargar App</Text>
          </TouchableOpacity>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>🌐 Conectando Guinea Ecuatorial</Text>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 20,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginRight: 8,
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#facc15',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  qrButton: {
    backgroundColor: '#00c8a0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  qrButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  openButton: {
    backgroundColor: '#facc15',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  openButtonText: {
    color: '#0d1117',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  storeButton: {
    backgroundColor: 'linear-gradient(135deg, #00c8a0, #00b4e6)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    minWidth: 200,
  },
  storeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 5,
  },
  versionText: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.5,
  },
});
