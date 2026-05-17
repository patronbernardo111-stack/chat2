import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Colors, FontSize, FontWeight, Spacing } from '../src/theme';

const PLACES = [
  { id: '1', title: 'Hospital General Malabo', emoji: '🏥', lat: 3.7523, lng: 8.7741 },
  { id: '2', title: 'Aeropuerto Santa Isabel', emoji: '✈️', lat: 3.7527, lng: 8.7087 },
  { id: '3', title: 'Banco BANGE', emoji: '🏦', lat: 3.7501, lng: 8.7800 },
  { id: '4', title: 'Mercado Central', emoji: '🛒', lat: 3.7480, lng: 8.7760 },
  { id: '5', title: 'Puerto de Malabo', emoji: '⚓', lat: 3.7550, lng: 8.7820 },
];

// Lazy import de react-native-maps solo en nativo
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

export default function MapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        setLocation({ latitude: 3.7523, longitude: 8.7741 });
        setLoading(false);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } else {
        setLocation({ latitude: 3.7523, longitude: 8.7741 });
      }
      setLoading(false);
    })();
  }, []);

  const region = location ? {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mapa — Malabo</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
        </View>
      ) : Platform.OS === 'web' ? (
        // Fallback web — react-native-maps no soporta navegador
        <View style={styles.center}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.notice}>El mapa interactivo está disponible en la app móvil.</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={region}
          showsUserLocation
          showsMyLocationButton
        >
          {PLACES.map(p => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              title={p.title}
              description={p.emoji}
              onCalloutPress={() => Alert.alert(p.emoji + ' ' + p.title, 'Lugar de interés en Malabo')}
            />
          ))}
        </MapView>
      )}

      <View style={styles.legend}>
        {PLACES.map(p => (
          <View key={p.id} style={styles.legendItem}>
            <Text style={styles.legendEmoji}>{p.emoji}</Text>
            <Text style={styles.legendText} numberOfLines={1}>{p.title}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  loadingText: { fontSize: FontSize.base, color: Colors.textSecondary },
  mapIcon: { fontSize: 64 },
  notice: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
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
  map: { flex: 1 },
  legend: {
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    padding: Spacing.md, gap: Spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  legendEmoji: { fontSize: 16, width: 24 },
  legendText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
});
