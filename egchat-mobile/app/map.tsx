import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';

// Malabo, Guinea Ecuatorial
const MALABO = { latitude: 3.7523, longitude: 8.7741 };
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY || 'bg3FUa7es7Qn1TITIWjO';

// Puntos de interés en Malabo
const POI = [
  { id: '1', name: 'Aeropuerto de Malabo', lat: 3.7527, lng: 8.7083, icon: '✈️', cat: 'Transporte' },
  { id: '2', name: 'Hospital La Paz',      lat: 3.7489, lng: 8.7812, icon: '🏥', cat: 'Salud' },
  { id: '3', name: 'Mercado Central',      lat: 3.7501, lng: 8.7756, icon: '🛒', cat: 'Comercio' },
  { id: '4', name: 'Puerto de Malabo',     lat: 3.7612, lng: 8.7834, icon: '⚓', cat: 'Transporte' },
  { id: '5', name: 'Universidad Nacional', lat: 3.7445, lng: 8.7698, icon: '🎓', cat: 'Educación' },
  { id: '6', name: 'Catedral de Malabo',   lat: 3.7523, lng: 8.7741, icon: '⛪', cat: 'Cultura' },
  { id: '7', name: 'Estadio de Malabo',    lat: 3.7398, lng: 8.7823, icon: '⚽', cat: 'Deporte' },
  { id: '8', name: 'Palacio de Justicia',  lat: 3.7534, lng: 8.7762, icon: '⚖️', cat: 'Gobierno' },
];

const MAP_STYLES = [
  { id: 'streets',   label: '🗺️ Calles' },
  { id: 'satellite', label: '🛰️ Satélite' },
  { id: 'topo',      label: '🏔️ Topo' },
];

export default function MapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState('streets');
  const [selectedPoi, setSelectedPoi] = useState<typeof POI[0] | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } else {
        setLocation(MALABO);
      }
      setLoading(false);
    })();
  }, []);

  const categories = [...new Set(POI.map(p => p.cat))];
  const filteredPoi = filter ? POI.filter(p => p.cat === filter) : POI;

  // URL del mapa estático de MapTiler
  const mapUrl = location
    ? `https://api.maptiler.com/maps/${mapStyle}/static/${location.longitude},${location.latitude},13/400x300@2x.png?key=${MAPTILER_KEY}&markers=${location.longitude},${location.latitude}`
    : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapa · Malabo</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Mapa estático con MapTiler */}
      <View style={styles.mapContainer}>
        {mapUrl ? (
          <View style={styles.mapPlaceholder}>
            {/* Usamos WebView o Image para mostrar el mapa estático */}
            <Text style={styles.mapEmoji}>🗺️</Text>
            <Text style={styles.mapCoords}>
              {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
            </Text>
            <Text style={styles.mapCity}>Malabo, Guinea Ecuatorial</Text>
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>📍</Text>
            <Text style={styles.mapCity}>Malabo, Guinea Ecuatorial</Text>
          </View>
        )}

        {/* Estilos de mapa */}
        <View style={styles.styleSelector}>
          {MAP_STYLES.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setMapStyle(s.id)}
              style={[styles.styleBtn, mapStyle === s.id && styles.styleBtnActive]}
            >
              <Text style={[styles.styleBtnText, mapStyle === s.id && styles.styleBtnTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón GPS */}
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={async () => {
            const loc = await Location.getCurrentPositionAsync({});
            setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          }}
        >
          <Text style={styles.gpsBtnText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros de categoría */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setFilter(null)}
          style={[styles.filterChip, !filter && styles.filterChipActive]}
        >
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>Todos</Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilter(filter === cat ? null : cat)}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de POI */}
      <View style={styles.poiList}>
        <Text style={styles.poiTitle}>Puntos de interés</Text>
        {filteredPoi.map(poi => (
          <TouchableOpacity
            key={poi.id}
            style={[styles.poiItem, selectedPoi?.id === poi.id && styles.poiItemSelected]}
            onPress={() => setSelectedPoi(selectedPoi?.id === poi.id ? null : poi)}
            activeOpacity={0.7}
          >
            <View style={styles.poiIconBox}>
              <Text style={styles.poiIcon}>{poi.icon}</Text>
            </View>
            <View style={styles.poiInfo}>
              <Text style={styles.poiName}>{poi.name}</Text>
              <Text style={styles.poiCat}>{poi.cat}</Text>
            </View>
            <Text style={styles.poiCoords}>
              {poi.lat.toFixed(3)}, {poi.lng.toFixed(3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.subtitle, color: Colors.textSecondary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },
  headerRight: { width: 40 },

  // Map
  mapContainer: {
    height: 220,
    backgroundColor: '#e8f4f8',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  mapPlaceholder: { alignItems: 'center', gap: Spacing.sm },
  mapEmoji: { fontSize: 56 },
  mapCoords: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: 'monospace' },
  mapCity: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  // Style selector
  styleSelector: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    gap: 4,
  },
  styleBtn: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    ...Shadow.sm,
  },
  styleBtnActive: { backgroundColor: Colors.accent },
  styleBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  styleBtnTextActive: { color: Colors.white },

  // GPS button
  gpsBtn: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  gpsBtnText: { fontSize: 20 },

  // Filters
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 16,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  filterTextActive: { color: Colors.accent },

  // POI list
  poiList: { flex: 1, backgroundColor: Colors.bgSecondary },
  poiTitle: {
    ...Typography.sectionTitle,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgTertiary,
  },
  poiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  poiItemSelected: { backgroundColor: Colors.accentLight },
  poiIconBox: {
    width: 40, height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiIcon: { fontSize: 20 },
  poiInfo: { flex: 1 },
  poiName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  poiCat: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  poiCoords: { fontSize: FontSize.xs, color: Colors.textTertiary, fontFamily: 'monospace' },
});
