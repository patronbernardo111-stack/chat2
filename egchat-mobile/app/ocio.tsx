import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const CATEGORIES = [
  {
    id: 'hoteles', icon: '🏨', title: 'Hoteles', color: '#6366F1',
    items: [
      { name: 'Hotel Bahía', stars: '⭐⭐⭐⭐', price: '45,000 XAF/noche', phone: '+240 222 30 20 01' },
      { name: 'Hotel Impala', stars: '⭐⭐⭐', price: '30,000 XAF/noche', phone: '+240 222 30 20 02' },
      { name: 'Sofitel Malabo', stars: '⭐⭐⭐⭐⭐', price: '120,000 XAF/noche', phone: '+240 222 30 20 03' },
      { name: 'Hotel Ureca', stars: '⭐⭐⭐', price: '25,000 XAF/noche', phone: '+240 222 30 20 04' },
    ],
  },
  {
    id: 'cine', icon: '🎬', title: 'Cine', color: '#EC4899',
    items: [
      { name: 'Cine Malabo', stars: '', price: '2,500 XAF/entrada', phone: '+240 222 30 21 01' },
      { name: 'Multicines Bata', stars: '', price: '2,000 XAF/entrada', phone: '+240 222 30 21 02' },
    ],
  },
  {
    id: 'restaurantes', icon: '🍽️', title: 'Restaurantes', color: '#C47D2A',
    items: [
      { name: 'Restaurante La Bahía', stars: '⭐⭐⭐⭐', price: 'Desde 8,000 XAF', phone: '+240 222 30 22 01' },
      { name: 'El Rincón Guineano', stars: '⭐⭐⭐', price: 'Desde 5,000 XAF', phone: '+240 222 30 22 02' },
      { name: 'Pizzería Malabo', stars: '⭐⭐⭐', price: 'Desde 4,000 XAF', phone: '+240 222 30 22 03' },
      { name: 'Marisquería del Puerto', stars: '⭐⭐⭐⭐', price: 'Desde 10,000 XAF', phone: '+240 222 30 22 04' },
    ],
  },
  {
    id: 'playas', icon: '🏖️', title: 'Playas', color: '#0EA5E9',
    items: [
      { name: 'Playa de Malabo', stars: '', price: 'Gratis', phone: '' },
      { name: 'Playa Ureca', stars: '', price: 'Gratis', phone: '' },
      { name: 'Playa Arena Blanca', stars: '', price: 'Gratis', phone: '' },
    ],
  },
];

export default function OcioScreen() {
  const [selected, setSelected] = useState<typeof CATEGORIES[0] | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => selected ? setSelected(null) : router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>{selected ? selected.title : '🎭 Ocio'}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {!selected ? (
          CATEGORIES.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.catCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]} onPress={() => setSelected(cat)} activeOpacity={0.7}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.catEmoji}>{cat.icon}</Text>
              </View>
              <View style={styles.catInfo}>
                <Text style={[styles.catTitle, { color: C.textPrimary }]}>{cat.title}</Text>
                <Text style={[styles.catSub, { color: C.textTertiary }]}>{cat.items.length} lugares disponibles</Text>
              </View>
              <Text style={[styles.arrow, { color: C.border }]}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          selected.items.map(item => (
            <View key={item.name} style={[styles.itemCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: C.textPrimary }]}>{item.name}</Text>
                {item.stars ? <Text style={styles.itemStars}>{item.stars}</Text> : null}
                <Text style={styles.itemPrice}>{item.price}</Text>
              </View>
              {item.phone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)} style={styles.callBtn}>
                  <Text style={styles.callBtnText}>📞</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
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
  content: { padding: Spacing.md, gap: Spacing.sm },
  catCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  catIcon: { width: 52, height: 52, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 26 },
  catInfo: { flex: 1 },
  catTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  catSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.border },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  itemStars: { fontSize: FontSize.sm, marginTop: 2 },
  itemPrice: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, marginTop: 2 },
  callBtn: { padding: Spacing.sm },
  callBtnText: { fontSize: 22 },
});
