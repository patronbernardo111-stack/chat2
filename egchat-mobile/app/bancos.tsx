import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const BANKS = [
  { name: 'BANGE', full: 'Banco Nacional de Guinea Ecuatorial', color: '#003082', phone: '+240 333 09 00 00', web: 'https://bange.gq', services: ['Cuenta corriente', 'Tarjeta débito/crédito', 'Transferencias CEMAC', 'Préstamos personales', 'Banca empresarial'] },
  { name: 'BGFI', full: 'BGFI Bank Guinea Ecuatorial', color: '#1E3A5F', phone: '+240 333 09 11 11', web: 'https://bgfi.com', services: ['Banca personal', 'Banca empresarial', 'Inversiones', 'Seguros', 'Leasing'] },
  { name: 'CCEI', full: 'CCEI Bank Guinea Ecuatorial', color: '#0066CC', phone: '+240 333 09 22 22', web: 'https://cceibank.com', services: ['Cuenta de ahorro', 'Microcréditos', 'Transferencias CEMAC', 'Domiciliaciones', 'Tarjetas'] },
  { name: 'Ecobank', full: 'Ecobank Guinea Ecuatorial', color: '#00A651', phone: '+240 333 09 33 33', web: 'https://ecobank.com', services: ['Banca digital', 'Xpress Account', 'Transferencias África', 'Divisas', 'Trade Finance'] },
  { name: 'Société Générale', full: 'Société Générale GQ', color: '#E30613', phone: '+240 333 09 44 44', web: 'https://societegenerale.com', services: ['Banca personal', 'Banca privada', 'Financiación', 'Seguros', 'Gestión de patrimonio'] },
];

export default function BancosScreen() {
  const [selected, setSelected] = useState<typeof BANKS[0] | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => selected ? setSelected(null) : router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selected ? selected.name : '🏦 Bancos'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {!selected ? (
          BANKS.map(b => (
            <TouchableOpacity key={b.name} style={styles.card} onPress={() => setSelected(b)} activeOpacity={0.7}>
              <View style={[styles.dot, { backgroundColor: b.color }]} />
              <View style={styles.info}>
                <Text style={styles.name}>{b.name}</Text>
                <Text style={styles.sub}>{b.full}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View>
            <View style={[styles.bankHeader, { backgroundColor: selected.color }]}>
              <Text style={styles.bankName}>{selected.name}</Text>
              <Text style={styles.bankFull}>{selected.full}</Text>
            </View>
            <Text style={styles.sectionLabel}>SERVICIOS</Text>
            {selected.services.map(s => (
              <View key={s} style={styles.serviceRow}>
                <Text style={styles.serviceDot}>●</Text>
                <Text style={styles.serviceText}>{s}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
              <Text style={styles.callBtnText}>📞 {selected.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.callBtn, styles.webBtn]} onPress={() => Linking.openURL(selected.web)}>
              <Text style={styles.callBtnText}>🌐 Visitar web</Text>
            </TouchableOpacity>
          </View>
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
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
    gap: Spacing.md, ...Shadow.sm,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  info: { flex: 1 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.border },
  bankHeader: { borderRadius: BorderRadius.lg, padding: Spacing.xl, marginBottom: Spacing.lg, alignItems: 'center' },
  bankName: { fontSize: 28, fontWeight: FontWeight.extrabold, color: Colors.white },
  bankFull: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5, marginBottom: Spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  serviceDot: { fontSize: 8, color: Colors.accent },
  serviceText: { fontSize: FontSize.base, color: Colors.textPrimary },
  callBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  webBtn: { backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.accent },
  callBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.white },
});
