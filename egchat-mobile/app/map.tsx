import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Linking, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';
import { useOffline } from '../src/hooks/useOffline';
import { OfflineBanner } from '../src/components/ui';

const MALABO = { latitude: 3.7523, longitude: 8.7741 };
const DELTA  = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

const POI = [
  { id: '1',  name: 'Aeropuerto de Malabo',    lat: 3.7527, lng: 8.7083, icon: '✈️', cat: 'Transporte' },
  { id: '2',  name: 'Hospital La Paz',          lat: 3.7489, lng: 8.7812, icon: '🏥', cat: 'Salud' },
  { id: '3',  name: 'Mercado Central',          lat: 3.7501, lng: 8.7756, icon: '🛒', cat: 'Comercio' },
  { id: '4',  name: 'Puerto de Malabo',         lat: 3.7612, lng: 8.7834, icon: '⚓', cat: 'Transporte' },
  { id: '5',  name: 'Universidad Nacional',     lat: 3.7445, lng: 8.7698, icon: '🎓', cat: 'Educación' },
  { id: '6',  name: 'Catedral de Malabo',       lat: 3.7523, lng: 8.7741, icon: '⛪', cat: 'Cultura' },
  { id: '7',  name: 'Estadio de Malabo',        lat: 3.7398, lng: 8.7823, icon: '⚽', cat: 'Deporte' },
  { id: '8',  name: 'Palacio de Justicia',      lat: 3.7534, lng: 8.7762, icon: '⚖️', cat: 'Gobierno' },
  { id: '9',  name: 'BANGE Malabo',             lat: 3.7510, lng: 8.7748, icon: '🏦', cat: 'Banco' },
  { id: '10', name: 'BGFI Bank',                lat: 3.7498, lng: 8.7731, icon: '🏦', cat: 'Banco' },
  { id: '11', name: 'Gasolinera Centro',        lat: 3.7515, lng: 8.7760, icon: '⛽', cat: 'Gasolinera' },
  { id: '12', name: 'Hotel Bahía 2',            lat: 3.7540, lng: 8.7770, icon: '🏨', cat: 'Hotel' },
  { id: '13', name: 'Clínica Santa Isabel',     lat: 3.7480, lng: 8.7800, icon: '🏥', cat: 'Salud' },
  { id: '14', name: 'Ministerio de Educación',  lat: 3.7520, lng: 8.7750, icon: '🏛️', cat: 'Gobierno' },
  { id: '15', name: 'Playa de Malabo',          lat: 3.7650, lng: 8.7800, icon: '🏖️', cat: 'Ocio' },
  { id: '16', name: 'Supermercado Getesa',      lat: 3.7505, lng: 8.7745, icon: '🛍️', cat: 'Comercio' },
  { id: '17', name: 'Farmacia Central',         lat: 3.7512, lng: 8.7758, icon: '💊', cat: 'Salud' },
  { id: '18', name: 'Correos de Guinea',        lat: 3.7518, lng: 8.7752, icon: '📮', cat: 'Servicios' },
];

const CATEGORIES = ['Todos', ...Array.from(new Set(POI.map(p => p.cat)))];

// Mapa oscuro estilo para Google Maps
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#373737' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
];

export default function MapScreen() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const { isOnline } = useOffline();

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('Todos');
  const [search, setSearch]     = useState('');
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

  const filteredPoi = useMemo(() => {
    let list = filter === 'Todos' ? POI : POI.filter(p => p.cat === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q));
    }
    return list;
  }, [filter, search]);

  const goToLocation = () => {
    if (!location) return;
    mapRef.current?.animateToRegion({ ...location, ...DELTA }, 800);
  };

  const goToPoi = (poi: typeof POI[0]) => {
    setSelected(poi);
    setSearch('');
    mapRef.current?.animateToRegion({
      latitude: poi.lat, longitude: poi.lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 600);
  };

  const openInMaps = (poi: typeof POI[0]) => {
    Linking.openURL(`https://maps.google.com/?q=${poi.lat},${poi.lng}`);
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: C.bgPrimary }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={[s.loadingText, { color: C.textSecondary }]}>Obteniendo ubicación...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <OfflineBanner />

      {/* Header */}
      <View style={[s.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={[s.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: C.textPrimary }]}>Mapa · Malabo</Text>
        <TouchableOpacity onPress={goToLocation} style={s.gpsHeaderBtn}>
          <Text style={s.gpsHeaderIcon}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={[s.searchBar, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={[s.searchInput, { color: C.textPrimary }]}
          placeholder="Buscar lugar..."
          placeholderTextColor={C.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: C.textTertiary, fontSize: 18, paddingHorizontal: 8 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Mapa */}
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={s.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={isDark ? DARK_MAP_STYLE : []}
          initialRegion={{ ...(location || MALABO), ...DELTA }}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
        >
          {filteredPoi.map(poi => (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.lat, longitude: poi.lng }}
              title={poi.name}
              description={poi.cat}
              onPress={() => setSelected(poi)}
            >
              <View style={[
                s.markerBubble,
                { backgroundColor: C.bgSecondary, borderColor: Colors.accent },
                selected?.id === poi.id && s.markerBubbleSelected,
              ]}>
                <Text style={s.markerIcon}>{poi.icon}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity style={[s.gpsBtn, { backgroundColor: C.bgSecondary }]} onPress={goToLocation}>
          <Text style={s.gpsBtnText}>🎯</Text>
        </TouchableOpacity>

        {!isOnline && (
          <View style={s.offlineMapBadge}>
            <Text style={s.offlineMapText}>📡 Offline</Text>
          </View>
        )}
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[s.filterScroll, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}
        contentContainerStyle={s.filterRow}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilter(cat)}
            style={[
              s.filterChip,
              { backgroundColor: C.bgTertiary, borderColor: C.border },
              filter === cat && { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
            ]}
          >
            <Text style={[
              s.filterText,
              { color: C.textSecondary },
              filter === cat && { color: Colors.accent },
            ]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Detalle POI seleccionado */}
      {selected && (
        <View style={[s.poiDetail, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
          <View style={s.poiDetailLeft}>
            <Text style={s.poiDetailIcon}>{selected.icon}</Text>
            <View>
              <Text style={[s.poiDetailName, { color: C.textPrimary }]}>{selected.name}</Text>
              <Text style={[s.poiDetailCat, { color: C.textTertiary }]}>{selected.cat}</Text>
            </View>
          </View>
          <View style={s.poiDetailActions}>
            <TouchableOpacity style={s.poiActionBtn} onPress={() => openInMaps(selected)}>
              <Text style={s.poiActionText}>🗺️ Abrir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.poiCloseBtn} onPress={() => setSelected(null)}>
              <Text style={[s.poiCloseBtnText, { color: C.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista POI */}
      {!selected && (
        <ScrollView style={s.poiList} showsVerticalScrollIndicator={false}>
          <Text style={[s.poiListTitle, { color: C.textTertiary, backgroundColor: C.bgTertiary }]}>
            Puntos de interés ({filteredPoi.length})
          </Text>
          {filteredPoi.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={[s.emptyText, { color: C.textSecondary }]}>Sin resultados para "{search}"</Text>
            </View>
          )}
          {filteredPoi.map(poi => (
            <TouchableOpacity
              key={poi.id}
              style={[s.poiItem, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}
              onPress={() => goToPoi(poi)}
              activeOpacity={0.7}
            >
              <View style={[s.poiIconBox, { backgroundColor: C.bgTertiary }]}>
                <Text style={s.poiIcon}>{poi.icon}</Text>
              </View>
              <View style={s.poiInfo}>
                <Text style={[s.poiName, { color: C.textPrimary }]}>{poi.name}</Text>
                <Text style={[s.poiCat, { color: C.textTertiary }]}>{poi.cat}</Text>
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
  container:   { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.subtitle },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn:      { padding: Spacing.sm },
  backIcon:     { fontSize: 28, lineHeight: 32 },
  headerTitle:  { ...Typography.headerTitle, flex: 1, textAlign: 'center' },
  gpsHeaderBtn: { padding: Spacing.sm },
  gpsHeaderIcon:{ fontSize: 20 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, gap: Spacing.sm,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FontSize.base, paddingVertical: 4 },

  mapContainer: { height: 260, position: 'relative' },
  map:          { flex: 1 },

  markerBubble: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, ...Shadow.sm,
  },
  markerBubbleSelected: { borderColor: '#EF4444', borderWidth: 3, transform: [{ scale: 1.2 }] },
  markerIcon: { fontSize: 18 },

  gpsBtn: {
    position: 'absolute', bottom: Spacing.md, right: Spacing.md,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', ...Shadow.md,
  },
  gpsBtnText: { fontSize: 22 },

  offlineMapBadge: {
    position: 'absolute', top: Spacing.sm, left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  offlineMapText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  filterScroll:  { maxHeight: 48, borderBottomWidth: 1 },
  filterRow:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, alignItems: 'center' },
  filterChip:    { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: 16, borderWidth: 1 },
  filterText:    { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  poiDetail: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, borderTopWidth: 1, gap: Spacing.md, ...Shadow.md,
  },
  poiDetailLeft:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  poiDetailIcon:    { fontSize: 28 },
  poiDetailName:    { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  poiDetailCat:     { fontSize: FontSize.xs },
  poiDetailActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  poiActionBtn:     { backgroundColor: Colors.accent, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  poiActionText:    { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  poiCloseBtn:      { padding: Spacing.sm },
  poiCloseBtnText:  { fontSize: 18 },

  poiList:      { flex: 1 },
  poiListTitle: { ...Typography.sectionTitle, paddingHorizontal: Spacing.listItemPaddingH, paddingVertical: Spacing.sm },
  poiItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    borderBottomWidth: 1, gap: Spacing.md,
  },
  poiIconBox: { width: 40, height: 40, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  poiIcon:    { fontSize: 20 },
  poiInfo:    { flex: 1 },
  poiName:    { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  poiCat:     { fontSize: FontSize.sm, marginTop: 2 },
  poiMapBtn:  { padding: Spacing.sm },
  poiMapBtnText: { fontSize: 20 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  emptyIcon:  { fontSize: 40 },
  emptyText:  { fontSize: FontSize.base },
});
