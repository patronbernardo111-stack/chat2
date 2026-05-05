import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useOffline } from '../../hooks/useOffline';
import { useThemeContext } from '../../theme/ThemeContext';
import { FontSize, FontWeight } from '../../theme';

export function OfflineBanner() {
  const { isOnline, isChecking } = useOffline();
  const { isDark } = useThemeContext();

  if (isChecking || isOnline) return null;

  return (
    <View style={[s.banner, isDark && s.bannerDark]}>
      <Text style={s.icon}>📡</Text>
      <Text style={s.text}>Sin conexión · Mostrando datos en caché</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  bannerDark: { backgroundColor: '#92400E' },
  icon: { fontSize: 14 },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
});
