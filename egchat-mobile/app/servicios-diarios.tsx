import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EGButton, EGCard, EGInput } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

// ── Datos ─────────────────────────────────────────────────────────
const RESTAURANTES = [
  { id: 'r1', nombre: 'Restaurante La Estancia', ciudad: 'Malabo', barrio: 'Centro',      tipo: 'Internacional',     precio: '$',  horario: '12:00-23:00', menu: [{ plato: 'Chuletón de ternera', precio: 18000 }, { plato: 'Pollo a la brasa', precio: 9000 }, { plato: 'Paella valenciana', precio: 14000 }] },
  { id: 'r2', nombre: 'Restaurante El Patio',    ciudad: 'Malabo', barrio: 'Caracolas',   tipo: 'Africana/Española', precio: '$',  horario: '11:00-22:00', menu: [{ plato: 'Sopa de pescado', precio: 6000 }, { plato: 'Ndole con plantain', precio: 8000 }, { plato: 'Arroz con pollo', precio: 7500 }] },
  { id: 'r3', nombre: 'Restaurante Bahía',       ciudad: 'Malabo', barrio: 'Puerto',      tipo: 'Mariscos',          precio: '$$', horario: '12:00-23:30', menu: [{ plato: 'Langosta a la plancha', precio: 35000 }, { plato: 'Gambas al ajillo', precio: 15000 }, { plato: 'Paella de mariscos', precio: 22000 }] },
  { id: 'r4', nombre: 'Cocina Típica Malabo',    ciudad: 'Malabo', barrio: 'Ela Nguema',  tipo: 'Ecuatoguineana',    precio: '€',  horario: '08:00-21:00', menu: [{ plato: 'Sopa de mboa', precio: 3500 }, { plato: 'Ekwang', precio: 4000 }, { plato: 'Eru con fufu', precio: 4500 }] },
  { id: 'r5', nombre: 'Restaurante Bata Centro', ciudad: 'Bata',   barrio: 'Centro',      tipo: 'Africana/Intl.',    precio: '$',  horario: '10:00-22:00', menu: [{ plato: 'Pollo yassa', precio: 8000 }, { plato: 'Thieboudienne', precio: 9000 }, { plato: 'Brochetas mixtas', precio: 10000 }] },
];

const AEROLINEAS = [
  { id: 'ceiba',    nombre: 'Ceiba Intercontinental', iata: 'C2', color: '#1B3A6B', rutas: [{ origen: 'Malabo (SSG)', destino: 'Bata (BSG)',    duracion: '45 min',    precio: 45000,  frecuencia: 'Diario' }, { origen: 'Malabo (SSG)', destino: 'Madrid (MAD)',  duracion: '7h 30min',  precio: 380000, frecuencia: '3x semana' }, { origen: 'Malabo (SSG)', destino: 'Libreville (LBV)', duracion: '1h 10min', precio: 85000, frecuencia: 'Diario' }] },
  { id: 'iberia',   nombre: 'Iberia',                  iata: 'IB', color: '#C0392B', rutas: [{ origen: 'Madrid (MAD)', destino: 'Malabo (SSG)', duracion: '7h 30min',  precio: 350000, frecuencia: '3x semana' }] },
  { id: 'airfrance',nombre: 'Air France',              iata: 'AF', color: '#003087', rutas: [{ origen: 'París (CDG)',  destino: 'Malabo (SSG)', duracion: '8h',        precio: 390000, frecuencia: '2x semana' }] },
  { id: 'ethiopian',nombre: 'Ethiopian Airlines',      iata: 'ET', color: '#078930', rutas: [{ origen: 'Addis Abeba (ADD)', destino: 'Malabo (SSG)', duracion: '6h 30min', precio: 280000, frecuencia: '3x semana' }] },
];

const GASOLINERAS = [
  { id: 'gepetrol', nombre: 'GEPetrol',      color: '#C0392B', estaciones: [{ nombre: 'GEPetrol Malabo Centro', ciudad: 'Malabo', horario: '24h', g95: 650, diesel: 580 }, { nombre: 'GEPetrol Bata Centro', ciudad: 'Bata', horario: '24h', g95: 650, diesel: 580 }] },
  { id: 'total',    nombre: 'TotalEnergies', color: '#E31837', estaciones: [{ nombre: 'Total Malabo Puerto',    ciudad: 'Malabo', horario: '24h', g95: 660, diesel: 590 }, { nombre: 'Total Bata Litoral',    ciudad: 'Bata',   horario: '24h', g95: 660, diesel: 590 }] },
  { id: 'oryx',     nombre: 'Oryx',          color: '#FF6B00', estaciones: [{ nombre: 'Oryx Malabo Aeropuerto', ciudad: 'Malabo', horario: '05:00-23:00', g95: 655, diesel: 585 }] },
];

const TABS = [
  { id: 'restaurantes', icon: '🍽️', label: 'Restaurantes' },
  { id: 'vuelos',       icon: '✈️', label: 'Vuelos' },
  { id: 'gasolineras',  icon: '⛽', label: 'Gasolineras' },
];

// ── Restaurantes ──────────────────────────────────────────────────
const RestaurantesTab = () => {
  const [selected, setSelected] = useState<typeof RESTAURANTES[0] | null>(null);
  const [view, setView] = useState<'list' | 'menu' | 'reserva' | 'ok'>('list');
  const [form, setForm] = useState({ name: '', phone: '', date: '', hora: '', personas: '2' });

  if (view === 'ok') return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>¡Reserva confirmada!</Text>
      <Text style={styles.successSub}>{selected?.nombre}</Text>
      <Text style={styles.successSub}>{form.date} · {form.hora} · {form.personas} personas</Text>
      <EGButton title="Ver más restaurantes" onPress={() => { setView('list'); setSelected(null); }} style={styles.successBtn} />
    </View>
  );

  if (view === 'reserva' && selected) return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.restHeader, { backgroundColor: '#C47D2A' }]}>
        <Text style={styles.restHeaderName}>{selected.nombre}</Text>
        <Text style={styles.restHeaderSub}>{selected.barrio} · {selected.ciudad}</Text>
      </View>
      <View style={styles.formContainer}>
        <EGInput label="Tu nombre" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Nombre completo" />
        <EGInput label="Teléfono" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" placeholder="+240 222..." />
        <EGInput label="Fecha (DD/MM/AAAA)" value={form.date} onChangeText={v => setForm(p => ({ ...p, date: v }))} placeholder="25/05/2026" />
        <EGInput label="Hora" value={form.hora} onChangeText={v => setForm(p => ({ ...p, hora: v }))} placeholder="20:00" />
        <EGInput label="Personas" value={form.personas} onChangeText={v => setForm(p => ({ ...p, personas: v }))} keyboardType="numeric" placeholder="2" />
        <EGButton title="Confirmar reserva" onPress={() => { if (form.name && form.phone && form.date) setView('ok'); else Alert.alert('Error', 'Rellena todos los campos'); }} />
        <EGButton title="Volver" onPress={() => setView('menu')} variant="outline" />
      </View>
    </ScrollView>
  );

  if (view === 'menu' && selected) return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.restHeader, { backgroundColor: '#C47D2A' }]}>
        <Text style={styles.restHeaderName}>{selected.nombre}</Text>
        <Text style={styles.restHeaderSub}>{selected.tipo} · {selected.horario}</Text>
      </View>
      <View style={styles.menuList}>
        {selected.menu.map((item, i) => (
          <View key={i} style={styles.menuItem}>
            <Text style={styles.menuPlato}>{item.plato}</Text>
            <Text style={styles.menuPrecio}>{item.precio.toLocaleString()} XAF</Text>
          </View>
        ))}
        <EGButton title="Reservar mesa" onPress={() => setView('reserva')} style={styles.menuBtn} />
        <EGButton title="Volver" onPress={() => setView('list')} variant="outline" />
      </View>
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {RESTAURANTES.map(r => (
        <TouchableOpacity key={r.id} style={styles.restCard} onPress={() => { setSelected(r); setView('menu'); }} activeOpacity={0.7}>
          <View style={styles.restInfo}>
            <Text style={styles.restName}>{r.nombre}</Text>
            <Text style={styles.restMeta}>{r.tipo} · {r.barrio}, {r.ciudad}</Text>
            <Text style={styles.restHorario}>🕐 {r.horario}</Text>
          </View>
          <View style={styles.restRight}>
            <Text style={[styles.restPrecio, { color: r.precio === '€' ? '#16A34A' : r.precio === '$' ? '#C47D2A' : '#C0392B' }]}>{r.precio === '€' ? 'Económico' : r.precio === '$' ? 'Moderado' : 'Premium'}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ── Vuelos ────────────────────────────────────────────────────────
const VuelosTab = () => {
  const [airline, setAirline] = useState<typeof AEROLINEAS[0] | null>(null);
  const [route, setRoute] = useState<any>(null);
  const [booked, setBooked] = useState(false);

  if (booked) return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✈️</Text>
      <Text style={styles.successTitle}>¡Vuelo reservado!</Text>
      <Text style={styles.successSub}>{route?.origen} → {route?.destino}</Text>
      <EGButton title="Ver más vuelos" onPress={() => { setBooked(false); setRoute(null); setAirline(null); }} style={styles.successBtn} />
    </View>
  );

  if (route && airline) return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <EGCard style={styles.routeCard}>
        <Text style={styles.routeTitle}>{route.origen}</Text>
        <Text style={styles.routeArrow}>✈️ {route.duracion}</Text>
        <Text style={styles.routeTitle}>{route.destino}</Text>
        <View style={styles.routeMeta}>
          <Text style={styles.routeFreq}>🗓️ {route.frecuencia}</Text>
          <Text style={styles.routePrice}>{route.precio.toLocaleString()} XAF</Text>
        </View>
      </EGCard>
      <EGButton title="Reservar vuelo" onPress={() => setBooked(true)} />
      <EGButton title="Volver" onPress={() => setRoute(null)} variant="outline" style={{ marginTop: Spacing.sm }} />
    </ScrollView>
  );

  if (airline) return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.airlineHeader, { backgroundColor: airline.color }]}>
        <Text style={styles.airlineHeaderName}>{airline.nombre}</Text>
        <Text style={styles.airlineHeaderIata}>{airline.iata}</Text>
      </View>
      {airline.rutas.map((r: any, i: number) => (
        <TouchableOpacity key={i} style={styles.routeItem} onPress={() => setRoute(r)} activeOpacity={0.7}>
          <View style={styles.routeItemInfo}>
            <Text style={styles.routeItemRoute}>{r.origen} → {r.destino}</Text>
            <Text style={styles.routeItemMeta}>{r.duracion} · {r.frecuencia}</Text>
          </View>
          <Text style={styles.routeItemPrice}>{r.precio.toLocaleString()} XAF</Text>
        </TouchableOpacity>
      ))}
      <EGButton title="Volver" onPress={() => setAirline(null)} variant="outline" style={{ marginTop: Spacing.md }} />
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {AEROLINEAS.map(a => (
        <TouchableOpacity key={a.id} style={styles.airlineCard} onPress={() => setAirline(a)} activeOpacity={0.7}>
          <View style={[styles.airlineLogo, { backgroundColor: a.color }]}>
            <Text style={styles.airlineIata}>{a.iata}</Text>
          </View>
          <View style={styles.airlineInfo}>
            <Text style={styles.airlineName}>{a.nombre}</Text>
            <Text style={styles.airlineRoutes}>{a.rutas.length} rutas disponibles</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ── Gasolineras ───────────────────────────────────────────────────
const GasolinerasTab = () => {
  const [company, setCompany] = useState<typeof GASOLINERAS[0] | null>(null);

  if (company) return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={[styles.gasHeader, { backgroundColor: company.color }]}>
        <Text style={styles.gasHeaderName}>{company.nombre}</Text>
      </View>
      {company.estaciones.map((e, i) => (
        <EGCard key={i} style={styles.gasCard}>
          <Text style={styles.gasName}>{e.nombre}</Text>
          <Text style={styles.gasCity}>📍 {e.ciudad} · 🕐 {e.horario}</Text>
          <View style={styles.gasPrices}>
            <View style={styles.gasPriceItem}>
              <Text style={styles.gasPriceLabel}>Gasolina 95</Text>
              <Text style={[styles.gasPriceValue, { color: '#F97316' }]}>{e.g95} XAF/L</Text>
            </View>
            <View style={styles.gasPriceItem}>
              <Text style={styles.gasPriceLabel}>Diésel</Text>
              <Text style={[styles.gasPriceValue, { color: '#1B3A6B' }]}>{e.diesel} XAF/L</Text>
            </View>
          </View>
        </EGCard>
      ))}
      <EGButton title="Volver" onPress={() => setCompany(null)} variant="outline" style={{ marginTop: Spacing.md }} />
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {GASOLINERAS.map(g => (
        <TouchableOpacity key={g.id} style={styles.gasCompanyCard} onPress={() => setCompany(g)} activeOpacity={0.7}>
          <View style={[styles.gasLogo, { backgroundColor: g.color }]}>
            <Text style={styles.gasLogoText}>⛽</Text>
          </View>
          <View style={styles.gasInfo}>
            <Text style={styles.gasCompanyName}>{g.nombre}</Text>
            <Text style={styles.gasStations}>{g.estaciones.length} estaciones</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function ServiciosDiariosScreen() {
  const [tab, setTab] = useState('restaurantes');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Servicios Diarios</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]} activeOpacity={0.7}>
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'restaurantes' && <RestaurantesTab />}
      {tab === 'vuelos' && <VuelosTab />}
      {tab === 'gasolineras' && <GasolinerasTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },

  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 2 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
  tabLabelActive: { color: Colors.accent },

  // Content
  tabContent: { padding: Spacing.md, gap: Spacing.sm },

  // Restaurantes
  restCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  restInfo: { flex: 1 },
  restName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  restMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  restHorario: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  restRight: { alignItems: 'flex-end', gap: 4 },
  restPrecio: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  restHeader: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  restHeaderName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  restHeaderSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  menuList: { gap: Spacing.sm },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.md, padding: Spacing.md, ...Shadow.sm },
  menuPlato: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  menuPrecio: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: '#C47D2A' },
  menuBtn: { marginTop: Spacing.md },
  formContainer: { gap: Spacing.sm },

  // Vuelos
  airlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  airlineLogo: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  airlineIata: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  airlineInfo: { flex: 1 },
  airlineName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  airlineRoutes: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  airlineHeader: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  airlineHeaderName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  airlineHeaderIata: { fontSize: 28, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.5)' },
  routeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  routeItemInfo: { flex: 1 },
  routeItemRoute: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  routeItemMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  routeItemPrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.accent },
  routeCard: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  routeTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  routeArrow: { fontSize: FontSize.xl },
  routeMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: Spacing.sm },
  routeFreq: { fontSize: FontSize.base, color: Colors.textSecondary },
  routePrice: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.accent },

  // Gasolineras
  gasCompanyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  gasLogo: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  gasLogoText: { fontSize: 26 },
  gasInfo: { flex: 1 },
  gasCompanyName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  gasStations: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  gasHeader: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  gasHeaderName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  gasCard: { padding: Spacing.md, marginBottom: Spacing.sm },
  gasName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  gasCity: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2, marginBottom: Spacing.sm },
  gasPrices: { flexDirection: 'row', gap: Spacing.md },
  gasPriceItem: { flex: 1, backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.sm, padding: Spacing.sm, alignItems: 'center' },
  gasPriceLabel: { fontSize: FontSize.xs, color: Colors.textTertiary },
  gasPriceValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, marginTop: 2 },

  // Shared
  chevron: { fontSize: 20, color: Colors.border },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  successSub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  successBtn: { marginTop: Spacing.lg, width: 240 },
});
