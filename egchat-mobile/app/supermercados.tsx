import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const CATEGORIES = ['🥩 Carnicería', '🥦 Verduras', '🥛 Lácteos', '🍞 Panadería', '🧴 Higiene', '🍷 Bebidas', '🧹 Limpieza', '🐟 Pescadería', '🍫 Dulces', '🥫 Conservas', '🧀 Charcutería', '🌾 Cereales'];

const SUPERMARKETS = [
  { name: 'Supermarket Malabo', area: 'Centro Malabo', phone: '+240 222 30 10 01', hours: 'L-D 8:00-21:00', delivery: true },
  { name: 'Hipermarket Caracolas', area: 'Caracolas, Malabo', phone: '+240 222 30 10 02', hours: 'L-D 8:00-22:00', delivery: true },
  { name: 'Supermercado Bata', area: 'Centro Bata', phone: '+240 222 30 10 03', hours: 'L-S 8:00-20:00', delivery: false },
  { name: 'Tienda Nguema', area: 'Ela Nguema', phone: '+240 222 30 10 04', hours: 'L-D 7:00-21:00', delivery: false },
  { name: 'Mercado Central', area: 'Malabo', phone: '+240 222 30 10 05', hours: 'L-S 6:00-18:00', delivery: false },
];

export default function SupermercadosScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>🛒 Supermercados</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>CATEGORÍAS</Text>
        <View style={styles.grid}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} style={[styles.catChip, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => Alert.alert('Próximamente', 'Compra online disponible pronto')} activeOpacity={0.7}>
              <Text style={[styles.catText, { color: C.textPrimary }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>SUPERMERCADOS CERCANOS</Text>
        {SUPERMARKETS.map(sm => (
          <View key={sm.name} style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
            <View style={styles.cardTop}>
              <Text style={styles.smEmoji}>🛒</Text>
              <View style={styles.smInfo}>
                <Text style={[styles.smName, { color: C.textPrimary }]}>{sm.name}</Text>
                <Text style={[styles.smArea, { color: C.textSecondary }]}>📍 {sm.area}</Text>
                <Text style={[styles.smHours, { color: C.textTertiary }]}>🕐 {sm.hours}</Text>
              </View>
              {sm.delivery && <View style={styles.deliveryBadge}><Text style={styles.deliveryText}>🛵 Delivery</Text></View>}
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${sm.phone}`)}>
              <Text style={styles.callBtnText}>📞 Llamar</Text>
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
  content: { padding: Spacing.md, gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  catText: { fontSize: FontSize.sm, color: Colors.textPrimary },
  card: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  smEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
  smInfo: { flex: 1 },
  smName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  smArea: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  smHours: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  deliveryBadge: {
    backgroundColor: '#dcfce7', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  deliveryText: { fontSize: FontSize.xs, color: '#16a34a', fontWeight: FontWeight.bold },
  callBtn: {
    backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md,
    padding: Spacing.sm, alignItems: 'center',
  },
  callBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
});
