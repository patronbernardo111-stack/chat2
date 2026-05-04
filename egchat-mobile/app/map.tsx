import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';

// Malabo, Guinea Ecuatorial
const MALABO = { latitude: 3.7523, longitude: 8.7741 };
const DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

const POI = [
  { id: '1', name: 'Aeropuerto de Malabo',  lat: 3.7527, lng: 8.7083, icon: '✈️', cat: 'Transporte' },
  { id: '2', name: 'Hospital La Paz',        lat: 3.7489, lng: 8.7812, icon: '🏥', cat: 'Salud' },
  { id: '3', name: 'Mercado Central',        lat: 3.7501, lng: 8.7756, icon: '🛒', cat: 'Comercio' },
  { id: '4', name: 'Puerto de Malabo',       lat: 3.7612, lng: 8.7834, icon: '⚓', cat: 'Transporte' },
  { id: '5', name: 'Universidad Nacional',   lat: 3.7445, lng: 8.7698, icon: '🎓', cat: 'Educación' },
  { id: '6', name: 'Catedral de Malabo',     lat: 3.7523, lng: 8.7741, icon: '⛪', cat: 'Cultura' },
  { id: '7', name: 'Estadio de Malabo',      lat: 3.7398, lng: 8.7823, icon: '⚽', cat: 'Deporte' },
  { id: '8', name: 'Palacio de Justicia',    lat: 3.7534, lng: 8.7762, icon: '⚖️', cat: 'Gobierno' },
  { id: '9', name: 'BANGE Malabo',           lat: 3.7510, lng: 8.7748, icon: '🏦', cat: 'Banco' },
  { id: '10', name: 'BGFI Bank',             lat: 3.7498, lng: 8.7731, icon: '🏦', cat: 'Banco' },
  { id: '11', name: 'Gasolinera Centro',     lat: 3.7515, lng: 8.7760, icon: '⛽', cat: 'Gasolinera' },
];

const CATEGORIES = ['Todos', ...new Set(POI.map(p => p.cat))];

export default function MapScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [selected, setSelected] = useState<typeof POI[0] | null>(null);
  const mapRef = useRef<MapView>(null);

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

  const filteredPoi = filter === 'Todos' ? POI : POI.filter(p => p.cat === filter);

  const goToLocation = () => {
    if (!location) return;
    mapRef.current?.animateToRegion({ ...location, ...DELTA }, 800);
  };

  const goToPoi = (poi: typeof POI[0]) => {
    setSelected(poi);
    mapRef.current?.animateToRegion({
      latitude: poi.lat, longitude: poi.lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 600);
  };

  const openInMaps = (poi: typeof POI[0]) => {
    const url = `https://maps.google.com/?q=${poi.lat},${poi.lng}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={s.loadingText}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mapa · Malabo</Text>
        <TouchableOpacity onPress={goToLocation} style={s.gpsHeaderBtn}>
          <Text style={s.gpsHeaderIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={s.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            ...(location || MALABO),
            ...DELTA,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
        >
          {/* Marcadores POI */}
          {filteredPoi.map(poi => (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.lat, longitude: poi.lng }}
              title={poi.name}
              description={poi.cat}
              onPress={() => setSelected(poi)}
            >
              <View style={[s.markerBubble, selected?.id === poi.id && s.markerBubbleSelected]}>
                <Text style={s.markerIcon}>{poi.icon}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Botón GPS flotante */}
        <TouchableOpacity style={s.gpsBtn} onPress={goToLocation}>
          <Text style={s.gpsBtnText}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilter(cat)}
            style={[s.filterChip, filter === cat && s.filterChipActive]}
          >
            <Text style={[s.filterText, filter === cat && s.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detalle del POI seleccionado */}
      {selected && (
        <View style={s.poiDetail}>
          <View style={s.poiDetailLeft}>
            <Text style={s.poiDetailIcon}>{selected.icon}</Text>
            <View>
              <Text style={s.poiDetailName}>{selected.name}</Text>
              <Text style={s.poiDetailCat}>{selected.cat}</Text>
            </View>
          </View>
          <View style={s.poiDetailActions}>
            <TouchableOpacity style={s.poiActionBtn} onPress={() => openInMaps(selected)}>
              <Text style={s.poiActionText}>🗺️ Abrir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.poiCloseBtn} onPress={() => setSelected(null)}>
              <Text style={s.poiCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de POI */}
      {!selected && (
        <ScrollView style={s.poiList} showsVerticalScrollIndicator={false}>
          <Text style={s.poiListTitle}>Puntos de interés ({filteredPoi.length})</Text>
          {filteredPoi.map(poi => (
            <TouchableOpacity
              key={poi.id}
              style={s.poiItem}
              onPress={() => goToPoi(poi)}
              activeOpacity={0.7}
            >
              <View style={s.poiIconBox}>
                <Text style={s.poiIcon}>{poi.icon}</Text>
              </View>
              <View style={s.poiInfo}>
                <Text style={s.poiName}>{poi.name}</Text>
                <Text style={s.poiCat}>{poi.cat}</Text>
              </View>
              <TouchableOpacity onPress={() => openInMaps(poi)} style={s.poiMapBtn}>
                <Text style={s.poiMapBtnText}>🗺️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.subtitle, color: Colors.textSecondary },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },
  gpsHeaderBtn: { padding: Spacing.sm },
  gpsHeaderIcon: { fontSize: 20 },

  mapContainer: { height: 280, position: 'relative' },
  map: { flex: 1 },

  markerBubble: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.accent,
    ...Shadow.sm,
  },
  markerBubbleSelected: { borderColor: '#EF4444', borderWidth: 3, transform: [{ scale: 1.2 }] },
  markerIcon: { fontSize: 18 },

  gpsBtn: {
    position: 'absolute', bottom: Spacing.md, right: Spacing.md,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  gpsBtnText: { fontSize: 22 },

  filterScroll: { maxHeight: 48, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: 16, backgroundColor: Colors.bgTertiary,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  filterText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  filterTextActive: { color: Colors.accent },

  // POI detail card
  poiDetail: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    padding: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    gap: Spacing.md,
    ...Shadow.md,
  },
  poiDetailLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  poiDetailIcon: { fontSize: 28 },
  poiDetailName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  poiDetailCat: { fontSize: FontSize.xs, color: Colors.textTertiary },
  poiDetailActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  poiActionBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  poiActionText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  poiCloseBtn: { padding: Spacing.sm },
  poiCloseBtnText: { fontSize: 18, color: Colors.textTertiary },

  // POI list
  poiList: { flex: 1 },
  poiListTitle: {
    ...Typography.sectionTitle, color: Colors.textTertiary,
    paddingHorizontal: Spacing.listItemPaddingH, paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgTertiary,
  },
  poiItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  poiIconBox: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  poiIcon: { fontSize: 20 },
  poiInfo: { flex: 1 },
  poiName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  poiCat: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  poiMapBtn: { padding: Spacing.sm },
  poiMapBtnText: { fontSize: 20 },
});
