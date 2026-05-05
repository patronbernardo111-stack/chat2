import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EGButton, EGInput, EGCard } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

// ── Datos ─────────────────────────────────────────────────────────
const SEGUROS = [
  { id: 'cnseg',   nombre: 'CNSEG GE',       tipo: 'Estatal',      color: '#1B3A6B', productos: [{ nombre: 'Seguro de Vida Básico', precio: 5000, cobertura: '5,000,000 XAF' }, { nombre: 'Seguro de Accidentes', precio: 3000, cobertura: '2,000,000 XAF' }, { nombre: 'Seguro de Salud', precio: 8000, cobertura: 'Hospitalización completa' }] },
  { id: 'axa',     nombre: 'AXA Guinea Ec.',  tipo: 'Internacional', color: '#00008B', productos: [{ nombre: 'Seguro Auto Básico', precio: 12000, cobertura: 'Responsabilidad civil' }, { nombre: 'Seguro Auto Todo Riesgo', precio: 25000, cobertura: 'Daños propios + terceros' }, { nombre: 'Seguro Hogar', precio: 15000, cobertura: 'Incendio, robo, daños' }] },
  { id: 'allianz', nombre: 'Allianz GE',      tipo: 'Internacional', color: '#003781', productos: [{ nombre: 'Seguro de Vida Premium', precio: 20000, cobertura: '20,000,000 XAF' }, { nombre: 'Seguro Empresarial', precio: 50000, cobertura: 'Responsabilidad civil empresarial' }] },
];

const HOSPITALES = [
  { id: 'h1', nombre: 'Hospital La Paz',          ciudad: 'Malabo', tipo: 'Público',   tel: '+240 333 09 20 00', especialidades: ['Urgencias', 'Cirugía', 'Pediatría', 'Maternidad', 'Cardiología'] },
  { id: 'h2', nombre: 'Clínica Santa Isabel',      ciudad: 'Malabo', tipo: 'Privado',   tel: '+240 333 09 21 00', especialidades: ['Medicina General', 'Ginecología', 'Traumatología', 'Laboratorio'] },
  { id: 'h3', nombre: 'Hospital Regional de Bata', ciudad: 'Bata',   tipo: 'Público',   tel: '+240 333 09 22 00', especialidades: ['Urgencias', 'Cirugía', 'Pediatría', 'Maternidad'] },
  { id: 'h4', nombre: 'Centro Médico Sipopo',      ciudad: 'Malabo', tipo: 'Privado',   tel: '+240 333 09 23 00', especialidades: ['Medicina General', 'Dermatología', 'Odontología', 'Oftalmología'] },
];

const FACTURAS = [
  { id: 'f1', tipo: 'Electricidad', empresa: 'SEGESA',  icono: '⚡', color: '#EAB308' },
  { id: 'f2', tipo: 'Agua',         empresa: 'SNGE',    icono: '💧', color: '#0EA5E9' },
  { id: 'f3', tipo: 'Impuestos',    empresa: 'DGI',     icono: '📋', color: '#374151' },
  { id: 'f4', tipo: 'Teléfono',     empresa: 'GETESA',  icono: '📞', color: '#8B5CF6' },
  { id: 'f5', tipo: 'Internet',     empresa: 'GETESA',  icono: '🌐', color: '#6366F1' },
];

const TABS = [
  { id: 'seguros',   icon: '🛡️', label: 'Seguros' },
  { id: 'salud',     icon: '🏥', label: 'Salud' },
  { id: 'facturas',  icon: '📄', label: 'Facturas' },
];

// ── Seguros ───────────────────────────────────────────────────────
const SegurosTab = () => {
  const [company, setCompany] = useState<typeof SEGUROS[0] | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', dni: '' });
  const [done, setDone] = useState(false);

  if (done) return (
    <View style={styles.success}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
      <Text style={styles.successSub}>Un agente te contactará en 24h</Text>
      <EGButton title="Volver" onPress={() => { setDone(false); setProduct(null); setCompany(null); }} style={styles.successBtn} />
    </View>
  );

  if (product && company) return (
    <ScrollView contentContainerStyle={styles.content}>
      <EGCard style={styles.productCard}>
        <Text style={styles.productName}>{product.nombre}</Text>
        <Text style={styles.productCompany}>{company.nombre}</Text>
        <View style={styles.productMeta}>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Prima mensual</Text><Text style={[styles.metaValue, { color: Colors.accent }]}>{product.precio.toLocaleString()} XAF</Text></View>
          <View style={styles.metaItem}><Text style={styles.metaLabel}>Cobertura</Text><Text style={styles.metaValue}>{product.cobertura}</Text></View>
        </View>
      </EGCard>
      <EGInput label="Nombre completo" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Tu nombre" />
      <EGInput label="Teléfono" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" placeholder="+240 222..." />
      <EGInput label="DNI / Cédula" value={form.dni} onChangeText={v => setForm(p => ({ ...p, dni: v }))} placeholder="Número de documento" />
      <EGButton title="Solicitar seguro" onPress={() => { if (form.name && form.phone) setDone(true); else Alert.alert('Error', 'Rellena todos los campos'); }} />
      <EGButton title="Volver" onPress={() => setProduct(null)} variant="outline" style={{ marginTop: Spacing.sm }} />
    </ScrollView>
  );

  if (company) return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.companyHeader, { backgroundColor: company.color }]}>
        <Text style={styles.companyHeaderName}>{company.nombre}</Text>
        <Text style={styles.companyHeaderTipo}>{company.tipo}</Text>
      </View>
      {company.productos.map((p, i) => (
        <TouchableOpacity key={i} style={styles.productItem} onPress={() => setProduct(p)} activeOpacity={0.7}>
          <View style={styles.productItemInfo}>
            <Text style={styles.productItemName}>{p.nombre}</Text>
            <Text style={styles.productItemCov}>{p.cobertura}</Text>
          </View>
          <Text style={[styles.productItemPrice, { color: Colors.accent }]}>{p.precio.toLocaleString()} XAF/mes</Text>
        </TouchableOpacity>
      ))}
      <EGButton title="Volver" onPress={() => setCompany(null)} variant="outline" style={{ marginTop: Spacing.md }} />
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {SEGUROS.map(s => (
        <TouchableOpacity key={s.id} style={styles.companyCard} onPress={() => setCompany(s)} activeOpacity={0.7}>
          <View style={[styles.companyLogo, { backgroundColor: s.color }]}>
            <Text style={styles.companyLogoText}>🛡️</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{s.nombre}</Text>
            <Text style={styles.companyTipo}>{s.tipo} · {s.productos.length} productos</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ── Salud ─────────────────────────────────────────────────────────
const SaludTab = () => {
  const [hospital, setHospital] = useState<typeof HOSPITALES[0] | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', especialidad: '', fecha: '' });
  const [done, setDone] = useState(false);

  if (done) return (
    <View style={styles.success}>
      <Text style={styles.successIcon}>🏥</Text>
      <Text style={styles.successTitle}>¡Cita confirmada!</Text>
      <Text style={styles.successSub}>{hospital?.nombre}</Text>
      <Text style={styles.successSub}>{form.especialidad} · {form.fecha}</Text>
      <EGButton title="Volver" onPress={() => { setDone(false); setHospital(null); setForm({ name: '', phone: '', especialidad: '', fecha: '' }); }} style={styles.successBtn} />
    </View>
  );

  if (hospital) return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hospitalHeader}>
        <Text style={styles.hospitalName}>{hospital.nombre}</Text>
        <Text style={styles.hospitalMeta}>📍 {hospital.ciudad} · 📞 {hospital.tel}</Text>
        <View style={[styles.tipoBadge, { backgroundColor: hospital.tipo === 'Público' ? Colors.accentLight : '#EFF6FF' }]}>
          <Text style={[styles.tipoText, { color: hospital.tipo === 'Público' ? Colors.accent : '#1B3A6B' }]}>{hospital.tipo}</Text>
        </View>
      </View>
      <Text style={styles.espTitle}>Especialidades</Text>
      <View style={styles.espGrid}>
        {hospital.especialidades.map((e, i) => (
          <TouchableOpacity key={i} onPress={() => setForm(p => ({ ...p, especialidad: e }))} style={[styles.espChip, form.especialidad === e && styles.espChipActive]}>
            <Text style={[styles.espText, form.especialidad === e && styles.espTextActive]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <EGInput label="Tu nombre" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Nombre completo" />
      <EGInput label="Teléfono" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" placeholder="+240 222..." />
      <EGInput label="Fecha preferida" value={form.fecha} onChangeText={v => setForm(p => ({ ...p, fecha: v }))} placeholder="DD/MM/AAAA" />
      <EGButton title="Pedir cita" onPress={() => { if (form.name && form.phone && form.especialidad) setDone(true); else Alert.alert('Error', 'Selecciona especialidad y rellena los datos'); }} />
      <EGButton title="Volver" onPress={() => setHospital(null)} variant="outline" style={{ marginTop: Spacing.sm }} />
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {HOSPITALES.map(h => (
        <TouchableOpacity key={h.id} style={styles.hospitalCard} onPress={() => setHospital(h)} activeOpacity={0.7}>
          <View style={styles.hospitalIcon}><Text style={styles.hospitalEmoji}>🏥</Text></View>
          <View style={styles.hospitalInfo}>
            <Text style={styles.hospitalCardName}>{h.nombre}</Text>
            <Text style={styles.hospitalCardMeta}>📍 {h.ciudad} · {h.tipo}</Text>
            <Text style={styles.hospitalCardEsp}>{h.especialidades.slice(0, 3).join(', ')}...</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ── Facturas ──────────────────────────────────────────────────────
const FacturasTab = () => {
  const [selected, setSelected] = useState<typeof FACTURAS[0] | null>(null);
  const [contrato, setContrato] = useState('');
  const [factura, setFactura] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  const consultar = () => {
    if (!contrato.trim()) { Alert.alert('Error', 'Introduce el número de contrato'); return; }
    setFactura({ contrato, importe: Math.floor(Math.random() * 20000) + 5000, periodo: 'Mayo 2026', estado: 'pendiente' });
  };

  const pagar = async () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      Alert.alert('✅', `Factura de ${factura.importe.toLocaleString()} XAF pagada`);
      setFactura(null); setContrato(''); setSelected(null);
    }, 1500);
  };

  if (selected) return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.facturaHeader, { backgroundColor: selected.color }]}>
        <Text style={styles.facturaHeaderIcon}>{selected.icono}</Text>
        <Text style={styles.facturaHeaderName}>{selected.tipo}</Text>
        <Text style={styles.facturaHeaderEmpresa}>{selected.empresa}</Text>
      </View>
      <EGInput label="Número de contrato" value={contrato} onChangeText={setContrato} keyboardType="numeric" placeholder="Ej: 123456789" />
      <EGButton title="Consultar factura" onPress={consultar} />
      {factura && (
        <EGCard style={styles.facturaResult}>
          <Text style={styles.facturaResultTitle}>Factura encontrada</Text>
          {[{ l: 'Contrato', v: factura.contrato }, { l: 'Período', v: factura.periodo }, { l: 'Estado', v: factura.estado }].map(item => (
            <View key={item.l} style={styles.facturaRow}>
              <Text style={styles.facturaLabel}>{item.l}</Text>
              <Text style={styles.facturaValue}>{item.v}</Text>
            </View>
          ))}
          <View style={styles.facturaRow}>
            <Text style={styles.facturaLabel}>Importe</Text>
            <Text style={[styles.facturaValue, { color: Colors.accent, fontWeight: FontWeight.bold }]}>{factura.importe.toLocaleString()} XAF</Text>
          </View>
          <EGButton title={paying ? 'Pagando...' : `Pagar ${factura.importe.toLocaleString()} XAF`} onPress={pagar} loading={paying} style={{ marginTop: Spacing.md }} />
        </EGCard>
      )}
      <EGButton title="Volver" onPress={() => { setSelected(null); setFactura(null); setContrato(''); }} variant="outline" style={{ marginTop: Spacing.sm }} />
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {FACTURAS.map(f => (
        <TouchableOpacity key={f.id} style={styles.facturaCard} onPress={() => setSelected(f)} activeOpacity={0.7}>
          <View style={[styles.facturaIcon, { backgroundColor: f.color + '18' }]}>
            <Text style={styles.facturaEmoji}>{f.icono}</Text>
          </View>
          <View style={styles.facturaInfo}>
            <Text style={styles.facturaTipo}>{f.tipo}</Text>
            <Text style={styles.facturaEmpresa}>{f.empresa}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function SegurosSaludScreen() {
  const [tab, setTab] = useState('seguros');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seguros · Salud · Facturas</Text>
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

      {tab === 'seguros'  && <SegurosTab />}
      {tab === 'salud'    && <SaludTab />}
      {tab === 'facturas' && <FacturasTab />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary, fontSize: FontSize.base },
  tabs: { flexDirection: 'row', backgroundColor: Colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 2 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textTertiary },
  tabLabelActive: { color: Colors.accent },
  content: { padding: Spacing.md, gap: Spacing.sm },
  chevron: { fontSize: 20, color: Colors.border },

  // Seguros
  companyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  companyLogo: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  companyLogoText: { fontSize: 26 },
  companyInfo: { flex: 1 },
  companyName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  companyTipo: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  companyHeader: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  companyHeaderName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  companyHeaderTipo: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  productItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  productItemInfo: { flex: 1 },
  productItemName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  productItemCov: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  productItemPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  productCard: { padding: Spacing.lg, marginBottom: Spacing.md },
  productName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  productCompany: { fontSize: FontSize.sm, color: Colors.textTertiary, marginBottom: Spacing.md },
  productMeta: { gap: Spacing.sm },
  metaItem: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  metaValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  // Salud
  hospitalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  hospitalIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center' },
  hospitalEmoji: { fontSize: 26 },
  hospitalInfo: { flex: 1 },
  hospitalCardName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  hospitalCardMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  hospitalCardEsp: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  hospitalHeader: { backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.sm },
  hospitalName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  hospitalMeta: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 4, marginBottom: Spacing.sm },
  tipoBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  tipoText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  espTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textTertiary, marginBottom: Spacing.sm },
  espGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  espChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border },
  espChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  espText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  espTextActive: { color: Colors.accent },

  // Facturas
  facturaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md, ...Shadow.sm },
  facturaIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  facturaEmoji: { fontSize: 26 },
  facturaInfo: { flex: 1 },
  facturaTipo: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  facturaEmpresa: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  facturaHeader: { borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, alignItems: 'center', gap: 4 },
  facturaHeaderIcon: { fontSize: 40 },
  facturaHeaderName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white },
  facturaHeaderEmpresa: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)' },
  facturaResult: { padding: Spacing.lg, marginTop: Spacing.md },
  facturaResultTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  facturaLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  facturaValue: { fontSize: FontSize.base, color: Colors.textPrimary },

  // Success
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  successIcon: { fontSize: 64 },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  successSub: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center' },
  successBtn: { marginTop: Spacing.lg, width: 200 },
});
