import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const FEATURES = [
  { icon: '💬', title: 'Chats Tiempo Real',  sub: 'Mensajes instantáneos' },
  { icon: '💳', title: 'Pagos Seguros XAF',  sub: 'Transferencias rápidas' },
  { icon: '🤖', title: 'IA Lia-25',          sub: 'Asistente 24/7' },
];

const FLAGS = ['🇬🇶', '🇨🇲', '🇬🇦', '🇨🇬', '🇪🇸', '🇫🇷', '🇬🇧', '🇺🇸'];

export default function WelcomeScreen() {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    // Logo spin — 10 segundos por vuelta (velocidad agradable)
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 10000, useNativeDriver: true })
    ).start();

    // Fade in
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient
      colors={['#d4eef7', '#c8eee0', '#d4eef7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo */}
        <View style={styles.logoSection}>
          {/* Anillo exterior giratorio */}
          <View style={styles.logoRing}>
            {/* El círculo recorta la imagen */}
            <View style={styles.logoBox}>
              <Animated.Image
                source={require('../assets/icon.png')}
                style={[
                  styles.logo,
                  { transform: [{ scale: 1.6 }, { rotate: spin }] },
                ]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Banderas */}
          <View style={styles.flagsRow}>
            {FLAGS.map((f, i) => <Text key={i} style={styles.flag}>{f}</Text>)}
          </View>

          <Text style={styles.tagline}>Tu plataforma de pagos y servicios</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureItem, i < FEATURES.length - 1 && styles.featureItemBorder]}>
              <View style={styles.featureIconBox}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Botones */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/(auth)/register' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>👤  Crear Cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/(auth)/login' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>→  Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>v1.0.0 · Guinea Ecuatorial</Text>
      </Animated.View>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1, paddingHorizontal: Spacing.screenPadding, justifyContent: 'space-between', paddingVertical: Spacing.xl },

  // Logo
  logoSection: { alignItems: 'center', gap: Spacing.md },

  // Anillo exterior decorativo
  logoRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: 'rgba(0,200,160,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,200,160,0.08)',
    ...Shadow.lg,
  },
  // Círculo que recorta la imagen — overflow hidden es clave
  logoBox: {
    width: 156,
    height: 156,
    borderRadius: 78,
    overflow: 'hidden',
    backgroundColor: '#00C8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Imagen base — el scale va en el JSX junto con el rotate animado
  logo: {
    width: 156,
    height: 156,
  },

  flagsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  flag: { fontSize: 22 },
  tagline: { fontSize: FontSize.sm, color: '#555', fontWeight: FontWeight.medium },

  // Features
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: 0,
    ...Shadow.md,
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14 },
  featureItemBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  featureIconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: '#e8f8ee',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#07C160',
  },
  featureIcon: { fontSize: 22 },
  featureTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#111' },
  featureSub: { fontSize: FontSize.sm, color: '#888' },

  // Buttons
  buttons: { gap: Spacing.md },
  btnPrimary: {
    backgroundColor: '#07C160',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadow.md,
  },
  btnPrimaryText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  btnSecondary: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg - 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnSecondaryText: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.semibold },

  version: { textAlign: 'center', fontSize: FontSize.xs, color: '#999' },
});
