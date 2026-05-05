import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { taxiAPI } from '../src/api';
import { EGInput, EGButton } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const RIDE_TYPES = [
  { id: 'moto', label: 'Moto', sub: '1 pasajero', price: 500, eta: '2 min', color: '#F97316', icon: '🏍️' },
  { id: 'taxi', label: 'Taxi', sub: '4 pasajeros', price: 1000, eta: '4 min', color: '#EAB308', icon: '🚕' },
  { id: 'suv', label: 'Confort', sub: 'SUV 4 plazas', price: 2000, eta: '5 min', color: '#6366F1', icon: '🚙' },
  { id: 'vip', label: 'VIP', sub: 'Premium', price: 3500, eta: '7 min', color: '#7C3AED', icon: '🚘' },
];

export default function MiTaxiScreen() {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [selected, setSelected] = useState(RIDE_TYPES[1]);
  const [step, setStep] = useState<'form' | 'searching' | 'matched'>('form');
  const [loading, setLoading] = useState(false);

  const requestRide = async () => {
    if (!origin.trim() || !dest.trim()) { Alert.alert('Error', 'Introduce origen y destino'); return; }
    setLoading(true);
    setStep('searching');
    try {
      await taxiAPI.requestRide({ address: origin }, { address: dest }, selected.id);
    } catch {}
    setTimeout(() => { setStep('matched'); setLoading(false); }, 3000);
  };

  const cancel = () => { setStep('form'); setOrigin(''); setDest(''); setLoading(false); };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🚕 MiTaxi</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {step === 'form' && (
          <>
            <EGInput label="Origen" value={origin} onChangeText={setOrigin} placeholder="¿Dónde estás?" />
            <EGInput label="Destino" value={dest} onChangeText={setDest} placeholder="¿A dónde vas?" />

            <Text style={styles.sectionLabel}>TIPO DE VEHÍCULO</Text>
            {RIDE_TYPES.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.rideCard, selected.id === r.id && { borderColor: r.color, borderWidth: 2 }]}
                onPress={() => setSelected(r)}
                activeOpacity={0.7}
              >
                <View style={[styles.rideIcon, { backgroundColor: r.color + '20' }]}>
                  <Text style={styles.rideEmoji}>{r.icon}</Text>
                </View>
                <View style={styles.rideInfo}>
                  <Text style={styles.rideName}>{r.label}</Text>
                  <Text style={styles.rideSub}>{r.sub} · {r.eta}</Text>
                </View>
                <Text style={[styles.ridePrice, { color: r.color }]}>{r.price.toLocaleString()} XAF</Text>
              </TouchableOpacity>
            ))}

            <EGButton title="Pedir taxi" onPress={requestRide} style={{ marginTop: Spacing.md }} />
          </>
        )}

        {step === 'searching' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.searchTitle}>Buscando conductor...</Text>
            <Text style={styles.searchSub}>Esto puede tardar unos segundos</Text>
          </View>
        )}

        {step === 'matched' && (
          <>
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitials}>CN</Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>Carlos Nguema</Text>
                <Text style={styles.driverSub}>⭐ 4.9 · Toyota Corolla · GE-1234</Text>
              </View>
            </View>
            <View style={styles.tripInfo}>
              <Text style={styles.tripRow}>📍 {origin}</Text>
              <Text style={styles.tripArrow}>↓</Text>
              <Text style={styles.tripRow}>🏁 {dest}</Text>
            </View>
            <Text style={styles.eta}>🕐 Llegará en {selected.eta}</Text>
            <Text style={styles.fare}>Tarifa estimada: {selected.price.toLocaleString()} XAF</Text>
            <EGButton title="Cancelar viaje" onPress={cancel} variant="danger" style={{ marginTop: Spacing.md }} />
          </>
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
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5, marginTop: Spacing.md },
  rideCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  rideIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  rideEmoji: { fontSize: 24 },
  rideInfo: { flex: 1 },
  rideName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  rideSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  ridePrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  center: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  searchTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  searchSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, gap: Spacing.md, ...Shadow.lg,
  },
  driverAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  driverInitials: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  driverSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  tripInfo: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  tripRow: { fontSize: FontSize.base, color: Colors.textPrimary },
  tripArrow: { fontSize: 18, color: Colors.textTertiary, marginVertical: 4, marginLeft: 4 },
  eta: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  fare: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.accent, textAlign: 'center', marginTop: Spacing.sm },
});
