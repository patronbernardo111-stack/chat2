import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const SECTIONS = [
  {
    id: 'restaurantes', icon: '🍽️', title: 'Restaurantes',
    items: [
      { name: 'La Bahía', desc: 'Cocina internacional · Centro Malabo', phone: '+240 222 30 22 01', price: 'Desde 8,000 XAF' },
      { name: 'El Rincón Guineano', desc: 'Cocina local · Ela Nguema', phone: '+240 222 30 22 02', price: 'Desde 5,000 XAF' },
      { name: 'Pizzería Malabo', desc: 'Italiana · Caracolas', phone: '+240 222 30 22 03', price: 'Desde 4,000 XAF' },
      { name: 'Marisquería del Puerto', desc: 'Mariscos · Puerto Malabo', phone: '+240 222 30 22 04', price: 'Desde 10,000 XAF' },
    ],
  },
  {
    id: 'vuelos', icon: '✈️', title: 'Vuelos',
    items: [
      { name: 'Ceiba Intercontinental', desc: 'Aerolínea nacional · Malabo-Bata-Madrid', phone: '+240 333 09 70 00', price: 'Desde 80,000 XAF' },
      { name: 'Iberia', desc: 'Malabo-Madrid directo', phone: '+240 333 09 71 00', price: 'Desde 350,000 XAF' },
      { name: 'Air France', desc: 'Malabo-París vía Douala', phone: '+240 333 09 72 00', price: 'Desde 400,000 XAF' },
      { name: 'Ethiopian Airlines', desc: 'Malabo-Addis Abeba', phone: '+240 333 09 73 00', price: 'Desde 250,000 XAF' },
    ],
  },
  {
    id: 'gasolineras', icon: '⛽', title: 'Gasolineras',
    items: [
      { name: 'GEPetrol Centro', desc: 'Av. de la Independencia · 24h', phone: '+240 222 30 30 01', price: 'Gasolina: 650 XAF/L' },
      { name: 'GEPetrol Caracolas', desc: 'Barrio Caracolas · 6:00-22:00', phone: '+240 222 30 30 02', price: 'Gasolina: 650 XAF/L' },
      { name: 'Total Malabo', desc: 'Carretera del Aeropuerto · 24h', phone: '+240 222 30 30 03', price: 'Gasolina: 660 XAF/L' },
      { name: 'GEPetrol Bata', desc: 'Centro Bata · 6:00-22:00', phone: '+240 222 30 30 04', price: 'Gasolina: 650 XAF/L' },
    ],
  },
];

export default function ServiciosDiariosScreen() {
  const [active, setActive] = useState(SECTIONS[0].id);
  const section = SECTIONS.find(s => s.id === active)!;
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Servicios diarios</Text>
      </View>
      <View style={[styles.tabs, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        {SECTIONS.map(s => (
          <TouchableOpacity key={s.id} style={[styles.tab, active === s.id && styles.tabActive]} onPress={() => setActive(s.id)} activeOpacity={0.7}>
            <Text style={styles.tabIcon}>{s.icon}</Text>
            <Text style={[styles.tabText, active === s.id && styles.tabTextActive, { color: active === s.id ? Colors.accent : C.textTertiary }]}>{s.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {section.items.map(item => (
          <View key={item.name} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
            <View style={styles.cardInfo}>
              <Text style={[styles.itemName, { color: C.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.itemDesc, { color: C.textSecondary }]}>{item.desc}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        ))}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md, gap: 2,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.accent },
  tabIcon: { fontSize: 20 },
  tabText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
  tabTextActive: { color: Colors.accent },
  content: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  cardInfo: { flex: 1 },
  itemName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  itemDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, marginTop: 2 },
  callBtn: { padding: Spacing.sm },
  callIcon: { fontSize: 24 },
});
