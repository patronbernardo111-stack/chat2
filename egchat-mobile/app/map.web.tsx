// Stub para web — react-native-maps no es compatible con navegador
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing } from '../src/theme';

const PLACES = [
  { id: '1', title: 'Hospital General Malabo', emoji: '🏥' },
  { id: '2', title: 'Aeropuerto Santa Isabel', emoji: '✈️' },
  { id: '3', title: 'Banco BANGE', emoji: '🏦' },
  { id: '4', title: 'Mercado Central', emoji: '🛒' },
  { id: '5', title: 'Puerto de Malabo', emoji: '⚓' },
];

export default function MapScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mapa — Malabo</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.notice}>El mapa interactivo está disponible en la app móvil.</Text>
      </View>

      <View style={styles.legend}>
        {PLACES.map(p => (
          <View key={p.id} style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{p.emoji}</Text>
            <Text style={styles.legendText}>{p.title}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  mapIcon: { fontSize: 64 },
  notice: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  legend: {
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    padding: Spacing.md, gap: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendEmoji: { fontSize: 16, width: 24 },
  legendText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
});
