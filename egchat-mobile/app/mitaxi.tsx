// mitaxi.tsx — Pantalla MiTaxi para React Native + Expo
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  ScrollView, StyleSheet, SafeAreaView, ActivityIndicator,
  Alert, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useGPS } from '../src/hooks/useGPS';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Datos ─────────────────────────────────────────────────────────
const RIDES = [
  { id: 'moto', name: 'Moto', sub: '1 pasajero', price: 500, eta: '2 min', color: '#F97316', icon: '🏍️' },
  { id: 'taxi', name: 'Taxi', sub: '4 pasajeros', price: 1000, eta: '4 min', color: '#EAB308', icon: '🚕' },
  { id: 'suv', name: 'Confort', sub: 'SUV 4 plazas', price: 2000, eta: '5 min', color: '#6366F1', icon: '🚙' },
  { id: 'vip', name: 'VIP', sub: 'Premium 4 plz', price: 3500, eta: '7 min', color: '#7C3AED', icon: '🚘' },
  { id: 'cargo', name: 'Cargo', sub: 'Pickup/Dina', price: 2500, eta: '8 min', color: '#0EA5E9', icon: '🚚' },
  { id: 'van', name: 'Van', sub: '8 pasajeros', price: 3000, eta: '9 min', color: '#10B981', icon: '🚐' },
  { id: 'minivan', name: 'MiniVan', sub: '6 pasajeros', price: 2200, eta: '6 min', color: '#EC4899', icon: '🚌' },
];

const DRIVERS = [
  { name: 'Carlos Nguema', rating: 4.9, trips: 1240, plate: 'GE-1234', car: 'Toyota Corolla Amarillo' },
  { name: 'Pedro Mba Ondo', rating: 4.8, trips: 876, plate: 'GE-5678', car: 'Hyundai Tucson Gris' },
  { name: 'Maria Obiang', rating: 5.0, trips: 2100, plate: 'GE-3456', car: 'Toyota Camry Negro' },
  { name: 'Juan Esono', rating: 4.7, trips: 543, plate: 'GE-9012', car: 'Kia Sportage Blanco' },
];

const PLACES = [
  'Aeropuerto de Malabo', 'Hotel Bahia', 'Mercado Central', 'Palacio de Justicia',
  'Universidad Nacional', 'Hospital La Paz', 'Playa de Malabo', 'Estadio de Malabo',
  'Puerto de Malabo', 'Barrio Ela Nguema', 'Sipopo Beach', 'Centro Comercial Paraiso',
  'Catedral de Malabo', 'Colegio La Salle', 'Punta Europa', 'Ministerio de Hacienda',
];

type Screen = 'home' | 'searching' | 'matched' | 'riding' | 'rating';

interface Props {
  userBalance?: number;
  onDebit?: (amount: number) => void;
}

export default function MiTaxiScreen({ userBalance = 0, onDebit }: Props) {
  const [screen, setScreen] = useState<Screen>('home');
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [focusField, setFocusField] = useState<'o' | 'd' | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ride, setRide] = useState(RIDES[1]);
  const [driver, setDriver] = useState(DRIVERS[0]);
  const [progress, setProgress] = useState(0);
  const [stars, setStars] = useState(0);
  const [rated, setRated] = useState(false);
  const timer = useRef<any>(null);

  const { position: userPos, loading: gpsLoading } = useGPS({ watch: false });

  const canGo = origin.trim().length > 0 && dest.trim().length > 0;

  const onSugg = (val: string, field: 'o' | 'd') => {
    if (field === 'o') setOrigin(val); else setDest(val);
    setSuggestions(val.length > 0 ? PLACES.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 5) : []);
  };

  const selectPlace = (s: string) => {
    if (focusField === 'd') setDest(s); else setOrigin(s);
    setSuggestions([]);
    setFocusField(null);
  };

  useEffect(() => {
    if (screen === 'searching') {
      setProgress(0);
      timer.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timer.current);
            setDriver(DRIVERS[Math.floor(Math.random() * DRIVERS.length)]);
            setScreen('matched');
            return 100;
          }
          return p + 4;
        });
      }, 80);
    }
    if (screen === 'riding') {
      setProgress(0);
      timer.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(timer.current); return 100; }
          return p + 0.4;
        });
      }, 150);
    }
    return () => clearInterval(timer.current);
  }, [screen]);

  // ── HOME ──────────────────────────────────────────────────────
  if (screen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🚕 MiTaxi</Text>
          <View style={styles.balanceBadge}>
            <Text style={styles.balanceText}>{userBalance.toLocaleString()} XAF</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* GPS status */}
          <View style={styles.gpsBar}>
            {gpsLoading ? (
              <ActivityIndicator size="small" color="#6366F1" />
            ) : (
              <Text style={styles.gpsText}>
                {userPos ? `📍 ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : '📍 Malabo, Guinea Ecuatorial'}
              </Text>
            )}
          </View>

          {/* Campos origen/destino */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <Text style={styles.inputDot}>🟢</Text>
              <TextInput
                style={styles.inputField}
                value={origin}
                onChangeText={v => onSugg(v, 'o')}
                onFocus={() => setFocusField('o')}
                placeholder="¿Desde dónde?"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputDivider} />
            <View style={styles.inputRow}>
              <Text style={styles.inputDot}>🔴</Text>
              <TextInput
                style={styles.inputField}
                value={dest}
                onChangeText={v => onSugg(v, 'd')}
                onFocus={() => setFocusField('d')}
                placeholder="¿A dónde vas?"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Sugerencias */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsCard}>
              {suggestions.map(s => (
                <TouchableOpacity key={s} style={styles.suggestionItem} onPress={() => selectPlace(s)}>
                  <Text style={styles.suggestionText}>📍 {s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tipos de vehículo */}
          <Text style={styles.sectionTitle}>Elige tu vehículo</Text>
          <FlatList
            data={RIDES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.rideCard, ride.id === item.id && { borderColor: item.color, borderWidth: 2 }]}
                onPress={() => setRide(item)}
              >
                <Text style={styles.rideIcon}>{item.icon}</Text>
                <Text style={styles.rideName}>{item.name}</Text>
                <Text style={styles.rideSub}>{item.sub}</Text>
                <Text style={[styles.ridePrice, { color: item.color }]}>{item.price.toLocaleString()} XAF</Text>
                <Text style={styles.rideEta}>⏱ {item.eta}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Botón pedir */}
          <View style={{ padding: 16 }}>
            <TouchableOpacity
              style={[styles.btnRequest, !canGo && styles.btnDisabled]}
              onPress={() => { if (canGo) setScreen('searching'); }}
              disabled={!canGo}
            >
              <Text style={styles.btnRequestText}>
                {canGo ? `Pedir ${ride.name} · ${ride.price.toLocaleString()} XAF` : 'Introduce origen y destino'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── BUSCANDO ──────────────────────────────────────────────────
  if (screen === 'searching') {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.searchingIcon}>{ride.icon}</Text>
        <Text style={styles.searchingTitle}>Buscando {ride.name}...</Text>
        <Text style={styles.searchingRoute}>{origin} → {dest}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: ride.color }]} />
        </View>
        <Text style={styles.searchingPct}>{Math.round(progress)}%</Text>
        <TouchableOpacity style={styles.btnCancel} onPress={() => setScreen('home')}>
          <Text style={styles.btnCancelText}>Cancelar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── CONDUCTOR ENCONTRADO ──────────────────────────────────────
  if (screen === 'matched') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.matchedHeader}>
          <Text style={styles.matchedTitle}>¡Conductor encontrado!</Text>
          <Text style={styles.matchedEta}>Llega en {ride.eta}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driver.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverRating}>⭐ {driver.rating} · {driver.trips} viajes</Text>
              <Text style={styles.driverCar}>{driver.car}</Text>
              <Text style={styles.driverPlate}>{driver.plate}</Text>
            </View>
          </View>

          <View style={styles.tripInfo}>
            <View style={styles.tripRow}>
              <Text style={styles.tripLabel}>Origen</Text>
              <Text style={styles.tripValue}>{origin}</Text>
            </View>
            <View style={styles.tripRow}>
              <Text style={styles.tripLabel}>Destino</Text>
              <Text style={styles.tripValue}>{dest}</Text>
            </View>
            <View style={styles.tripRow}>
              <Text style={styles.tripLabel}>Precio</Text>
              <Text style={[styles.tripValue, { color: ride.color, fontWeight: '800' }]}>{ride.price.toLocaleString()} XAF</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.btnRequest, { backgroundColor: ride.color }]} onPress={() => setScreen('riding')}>
            <Text style={styles.btnRequestText}>El conductor llegó · Iniciar viaje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnCancel} onPress={() => setScreen('home')}>
            <Text style={styles.btnCancelText}>Cancelar viaje</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── EN VIAJE ──────────────────────────────────────────────────
  if (screen === 'riding') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.ridingHeader}>
          <Text style={styles.ridingTitle}>En camino a {dest}</Text>
          <Text style={styles.ridingPct}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.ridingProgress}>
          <View style={[styles.ridingFill, { width: `${progress}%`, backgroundColor: ride.color }]} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driver.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.driverCar}>{driver.car} · {driver.plate}</Text>
            </View>
          </View>

          {progress >= 100 && (
            <TouchableOpacity style={[styles.btnRequest, { backgroundColor: '#10B981' }]} onPress={() => setScreen('rating')}>
              <Text style={styles.btnRequestText}>¡Llegamos! Calificar viaje</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnCancel} onPress={() => setScreen('home')}>
            <Text style={styles.btnCancelText}>Finalizar viaje</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── CALIFICACIÓN ──────────────────────────────────────────────
  if (screen === 'rating') {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.ratingIcon}>🎉</Text>
        <Text style={styles.ratingTitle}>¡Llegaste a {dest}!</Text>
        <Text style={styles.ratingPrice}>{ride.price.toLocaleString()} XAF</Text>
        {!rated ? (
          <>
            <Text style={styles.ratingQuestion}>¿Cómo fue tu viaje con {driver.name}?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <TouchableOpacity key={s} onPress={() => setStars(s)}>
                  <Text style={[styles.star, s <= stars && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.btnRequest, stars === 0 && styles.btnDisabled]}
              onPress={() => {
                if (stars > 0) {
                  onDebit?.(ride.price);
                  setRated(true);
                }
              }}
              disabled={stars === 0}
            >
              <Text style={styles.btnRequestText}>Enviar calificación</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.ratingThanks}>¡Gracias por tu calificación!</Text>
            <TouchableOpacity style={styles.btnRequest} onPress={() => { setScreen('home'); setRated(false); setStars(0); }}>
              <Text style={styles.btnRequestText}>Volver al inicio</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFF' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEF0F8',
  },
  backBtn: { padding: 6 },
  backBtnText: { fontSize: 20, color: '#374151' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  balanceBadge: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  balanceText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  gpsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 8, backgroundColor: '#EEF2FF',
  },
  gpsText: { fontSize: 12, color: '#6366F1', fontWeight: '500' },
  inputCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  inputDot: { fontSize: 14 },
  inputField: { flex: 1, fontSize: 15, color: '#0F172A' },
  inputDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 12 },
  suggestionsCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden',
  },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  suggestionText: { fontSize: 14, color: '#374151' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginLeft: 16, marginBottom: 8, marginTop: 4 },
  rideCard: {
    width: 110, backgroundColor: '#fff', borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#EEF0F8',
  },
  rideIcon: { fontSize: 28 },
  rideName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  rideSub: { fontSize: 10, color: '#64748B', textAlign: 'center' },
  ridePrice: { fontSize: 12, fontWeight: '800' },
  rideEta: { fontSize: 10, color: '#94A3B8' },
  btnRequest: {
    backgroundColor: '#6366F1', borderRadius: 16, padding: 16, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#E2E8F0' },
  btnRequestText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  btnCancel: { padding: 14, alignItems: 'center' },
  btnCancelText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  // Searching
  searchingIcon: { fontSize: 64 },
  searchingTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  searchingRoute: { fontSize: 13, color: '#64748B', textAlign: 'center' },
  progressBar: { width: '80%', height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  searchingPct: { fontSize: 14, color: '#64748B' },
  // Matched
  matchedHeader: { padding: 20, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EEF0F8' },
  matchedTitle: { fontSize: 20, fontWeight: '800', color: '#10B981' },
  matchedEta: { fontSize: 14, color: '#64748B', marginTop: 4 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#EEF0F8',
  },
  driverAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  driverName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  driverRating: { fontSize: 13, color: '#64748B', marginTop: 2 },
  driverCar: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  driverPlate: { fontSize: 12, fontWeight: '700', color: '#6366F1', marginTop: 2 },
  tripInfo: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#EEF0F8', gap: 8 },
  tripRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripLabel: { fontSize: 12, color: '#94A3B8' },
  tripValue: { fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1, textAlign: 'right' },
  // Riding
  ridingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
  },
  ridingTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', flex: 1 },
  ridingPct: { fontSize: 16, fontWeight: '800', color: '#6366F1' },
  ridingProgress: { height: 6, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  ridingFill: { height: '100%' },
  // Rating
  ratingIcon: { fontSize: 64 },
  ratingTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  ratingPrice: { fontSize: 28, fontWeight: '900', color: '#6366F1' },
  ratingQuestion: { fontSize: 16, color: '#374151', textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 40, color: '#E2E8F0' },
  starActive: { color: '#F59E0B' },
  ratingThanks: { fontSize: 16, color: '#10B981', fontWeight: '600', textAlign: 'center' },
});
