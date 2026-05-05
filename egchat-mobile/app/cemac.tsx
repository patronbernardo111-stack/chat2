import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const COUNTRIES = [
  { flag: '🇬🇶', name: 'Guinea Ecuatorial', capital: 'Malabo', currency: 'XAF', phone: '+240' },
  { flag: '🇨🇲', name: 'Camerún', capital: 'Yaundé', currency: 'XAF', phone: '+237' },
  { flag: '🇨🇬', name: 'Congo', capital: 'Brazzaville', currency: 'XAF', phone: '+242' },
  { flag: '🇬🇦', name: 'Gabón', capital: 'Libreville', currency: 'XAF', phone: '+241' },
  { flag: '🇨🇫', name: 'Rep. Centroafricana', capital: 'Bangui', currency: 'XAF', phone: '+236' },
  { flag: '🇹🇩', name: 'Chad', capital: 'N\'Djamena', currency: 'XAF', phone: '+235' },
];

const SERVICES = [
  { icon: '💸', title: 'Transferencias CEMAC', desc: 'Envía dinero a los 6 países de la zona CEMAC sin comisiones adicionales' },
  { icon: '🏦', title: 'Banca regional', desc: 'Accede a servicios bancarios en toda la zona CEMAC con tu cuenta EGCHAT' },
  { icon: '✈️', title: 'Vuelos regionales', desc: 'Reserva vuelos entre los países de la CEMAC' },
  { icon: '📋', title: 'Trámites consulares', desc: 'Información sobre visados y trámites entre países CEMAC' },
  { icon: '🌐', title: 'Roaming CEMAC', desc: 'Usa tu número de teléfono en toda la zona sin costes adicionales' },
];

export default function CemacScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>🌍 Zona CEMAC</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Comunidad Económica y Monetaria de África Central</Text>
          <Text style={styles.bannerSub}>6 países · 1 moneda (XAF) · 55 millones de habitantes</Text>
        </View>
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>PAÍSES MIEMBROS</Text>
        <View style={styles.countriesGrid}>
          {COUNTRIES.map(c => (
            <View key={c.name} style={[styles.countryCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <Text style={styles.countryFlag}>{c.flag}</Text>
              <Text style={[styles.countryName, { color: C.textPrimary }]}>{c.name}</Text>
              <Text style={[styles.countrySub, { color: C.textTertiary }]}>{c.capital}</Text>
              <Text style={styles.countryPhone}>{c.phone}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>SERVICIOS DISPONIBLES</Text>
        {SERVICES.map(s => (
          <TouchableOpacity key={s.title} style={[styles.serviceCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => {}} activeOpacity={0.7}>
            <Text style={styles.serviceIcon}>{s.icon}</Text>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceTitle, { color: C.textPrimary }]}>{s.title}</Text>
              <Text style={[styles.serviceDesc, { color: C.textSecondary }]}>{s.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.webBtn} onPress={() => Linking.openURL('https://www.cemac.int')}>
          <Text style={styles.webBtnText}>🌐 Sitio oficial CEMAC</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary },
  content: { padding: Spacing.md, gap: Spacing.md },
  banner: {
    backgroundColor: '#00b96b', borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center',
  },
  bannerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white, textAlign: 'center' },
  bannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.sm, textAlign: 'center' },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  countriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  countryCard: {
    width: '30%', backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  countryFlag: { fontSize: 32, marginBottom: Spacing.xs },
  countryName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'center' },
  countrySub: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center' },
  countryPhone: { fontSize: FontSize.xs, color: Colors.accent, marginTop: 2 },
  serviceCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  serviceIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  serviceDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  webBtn: {
    backgroundColor: Colors.accentLight, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.accent,
  },
  webBtnText: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },
});
