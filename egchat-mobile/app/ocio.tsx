import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EGButton, EGCard } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const CATEGORIES = [
  { id: 'hotel',      icon: '🏨', label: 'Hoteles',      color: '#3B82F6' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurantes', color: '#F97316' },
  { id: 'cinema',     icon: '🎬', label: 'Cine',         color: '#8B5CF6' },
  { id: 'spa',        icon: '💆', label: 'Spa',          color: '#10B981' },
  { id: 'sport',      icon: '⚽', label: 'Deporte',      color: '#EAB308' },
  { id: 'culture',    icon: '🏛️', label: 'Cultura',      color: '#EC4899' },
];

const PLACES = [
  { id: 'l1', cat: 'hotel',      name: 'Hotel Sofitel Malabo',  rating: 4.8, price: '85,000 XAF/noche',   addr: 'Av. de la Independencia', hours: '24h',        desc: 'Hotel de lujo 5 estrellas con vistas al mar' },
  { id: 'l2', cat: 'restaurant', name: 'Restaurante La Bahía',  rating: 4.6, price: '15,000 XAF/persona', addr: 'Puerto de Malabo',        hours: '12:00-23:00', desc: 'Cocina mediterránea y africana frente al mar' },
  { id: 'l3', cat: 'cinema',     name: 'Cine Malabo',           rating: 4.2, price: '5,000 XAF',          addr: 'Centro Comercial',        hours: '10:00-22:00', desc: 'Últimas películas en pantalla grande' },
  { id: 'l4', cat: 'spa',        name: 'Spa & Wellness Center', rating: 4.9, price: '25,000 XAF/sesión',  addr: 'Barrio Residencial',      hours: '09:00-20:00', desc: 'Masajes, sauna y tratamientos de bienestar' },
  { id: 'l5', cat: 'sport',      name: 'Club Deportivo Malabo', rating: 4.3, price: '8,000 XAF/mes',      addr: 'Zona Deportiva',          hours: '06:00-22:00', desc: 'Gimnasio, piscina y canchas deportivas' },
  { id: 'l6', cat: 'culture',    name: 'Museo Nacional',        rating: 4.5, price: '2,000 XAF',          addr: 'Plaza Independencia',     hours: '09:00-17:00', desc: 'Historia y cultura de Guinea Ecuatorial' },
  { id: 'l7', cat: 'hotel',      name: 'Hotel Impala',          rating: 4.1, price: '45,000 XAF/noche',   addr: 'Barrio Caracolas',        hours: '24h',        desc: 'Hotel céntrico con piscina y restaurante' },
  { id: 'l8', cat: 'restaurant', name: 'El Rincón Africano',    rating: 4.4, price: '10,000 XAF/persona', addr: 'Barrio Ela Nguema',       hours: '11:00-22:00', desc: 'Cocina tradicional ecuatoguineana' },
];

const CAT_COLOR: Record<string, string> = { hotel: '#3B82F6', restaurant: '#F97316', cinema: '#8B5CF6', spa: '#10B981', sport: '#EAB308', culture: '#EC4899' };

const PlaceCard = ({ place, onPress }: { place: typeof PLACES[0]; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.placeCard} activeOpacity={0.7}>
    <View style={[styles.placeIconBox, { backgroundColor: CAT_COLOR[place.cat] + '18' }]}>
      <Text style={styles.placeIcon}>{CATEGORIES.find(c => c.id === place.cat)?.icon || '📍'}</Text>
    </View>
    <View style={styles.placeInfo}>
      <Text style={styles.placeName}>{place.name}</Text>
      <Text style={styles.placeAddr} numberOfLines={1}>{place.addr}</Text>
      <View style={styles.placeMeta}>
        <Text style={styles.placeRating}>⭐ {place.rating}</Text>
        <Text style={styles.placePrice}>{place.price}</Text>
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const DetailModal = ({ place, onClose }: { place: typeof PLACES[0] | null; onClose: () => void }) => {
  if (!place) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.detailContainer}>
        <View style={[styles.detailHeader, { backgroundColor: CAT_COLOR[place.cat] }]}>
          <TouchableOpacity onPress={onClose} style={styles.detailBack}>
            <Text style={styles.detailBackText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{place.name}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.detailContent}>
          <View style={[styles.detailHero, { backgroundColor: CAT_COLOR[place.cat] + '18' }]}>
            <Text style={styles.detailHeroIcon}>{CATEGORIES.find(c => c.id === place.cat)?.icon}</Text>
          </View>
          <EGCard style={styles.detailCard}>
            <Text style={styles.detailDesc}>{place.desc}</Text>
            {[
              { label: '📍 Dirección', value: place.addr },
              { label: '🕐 Horario', value: place.hours },
              { label: '💰 Precio', value: place.price },
              { label: '⭐ Valoración', value: `${place.rating} / 5.0` },
            ].map(item => (
              <View key={item.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={styles.detailValue}>{item.value}</Text>
              </View>
            ))}
          </EGCard>
          <EGButton
            title="Reservar"
            onPress={() => { Alert.alert('✅', `Reserva en ${place.name} confirmada`); onClose(); }}
            style={styles.reserveBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function OcioScreen() {
  const [filter, setFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<typeof PLACES[0] | null>(null);
  const filtered = filter ? PLACES.filter(p => p.cat === filter) : PLACES;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ocio · Malabo</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          <TouchableOpacity onPress={() => setFilter(null)} style={[styles.catChip, !filter && styles.catChipActive]}>
            <Text style={[styles.catText, !filter && styles.catTextActive]}>Todos</Text>
          </TouchableOpacity>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c.id} onPress={() => setFilter(filter === c.id ? null : c.id)}
              style={[styles.catChip, filter === c.id && { backgroundColor: c.color, borderColor: c.color }]}>
              <Text style={styles.catIcon}>{c.icon}</Text>
              <Text style={[styles.catText, filter === c.id && { color: Colors.white }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.map(p => <PlaceCard key={p.id} place={p} onPress={() => setSelected(p)} />)}
        </View>
      </ScrollView>

      <DetailModal place={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },
  catRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border },
  catChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  catIcon: { fontSize: 14 },
  catText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  catTextActive: { color: Colors.accent },
  list: { padding: Spacing.md, gap: Spacing.sm },
  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  placeIconBox: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  placeIcon: { fontSize: 26 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  placeAddr: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  placeMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },
  placeRating: { fontSize: FontSize.sm, color: Colors.textSecondary },
  placePrice: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.accent },
  chevron: { fontSize: 20, color: Colors.border },
  detailContainer: { flex: 1, backgroundColor: Colors.bgPrimary },
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  detailBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  detailBackText: { color: Colors.white, fontSize: 18 },
  detailTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  detailContent: { padding: Spacing.screenPadding, gap: Spacing.md },
  detailHero: { height: 140, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  detailHeroIcon: { fontSize: 64 },
  detailCard: { padding: Spacing.lg },
  detailDesc: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 22 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  detailValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  reserveBtn: { marginTop: Spacing.sm },
});
