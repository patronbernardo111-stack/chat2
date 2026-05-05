// UpdateBanner.tsx — Banner de actualización para React Native
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Updates from 'expo-updates';

export const UpdateBanner: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const slideAnim = new Animated.Value(-60);

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (hasUpdate) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [hasUpdate]);

  const checkForUpdates = async () => {
    try {
      if (__DEV__) return; // No verificar en desarrollo
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setHasUpdate(true);
      }
    } catch {
      // Silencioso en caso de error
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setUpdating(false);
    }
  };

  if (!hasUpdate) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.icon}>🔄</Text>
      <Text style={styles.text}>Nueva versión disponible</Text>
      <TouchableOpacity
        style={[styles.btn, updating && styles.btnDisabled]}
        onPress={handleUpdate}
        disabled={updating}
      >
        <Text style={styles.btnText}>{updating ? 'Actualizando...' : 'Actualizar'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#00c8a0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    zIndex: 9999,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontSize: 13, fontWeight: '600', color: '#fff' },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
});

export default UpdateBanner;
