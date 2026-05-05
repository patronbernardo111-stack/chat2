import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';

const TABS = [
  { id: 'salud', icon: '🏥', label: 'Salud' },
  { id: 'seguros', icon: '🛡️', label: 'Seguros' },
  { id: 'impuestos', icon: '📋', label: 'Impuestos' },
  { id: 'correos', icon: '📮', label: 'Correos' },
];

const HEALTH = [
  { name: 'Hospital General de Malabo', type: 'Hospital público', phone: '+240 333 09 50 00', services: ['Urgencias 24h', 'Cirugía', 'Maternidad', 'Pediatría', 'Laboratorio'] },
  { name: 'Clínica La Paz', type: 'Clínica privada', phone: '+240 333 09 51 00', services: ['Consultas generales', 'Especialistas', 'Radiología', 'Farmacia'] },
  { name: 'Hospital de Bata', type: 'Hospital público', phone: '+240 333 09 52 00', services: ['Urgencias', 'Cirugía', 'Maternidad', 'Pediatría'] },
  { name: 'Centro de Salud Ela Nguema', type: 'Centro de salud', phone: '+240 333 09 53 00', services: ['Consultas', 'Vacunación', 'Planificación familiar'] },
  { name: 'INSESO', type: 'Seguridad Social', phone: '+240 333 09 54 00', services: ['Prestaciones sociales', 'Pensiones', 'Accidentes laborales'] },
];

const INSURANCE = [
  { icon: '🚗', name: 'Seguro de Auto', desc: 'Cobertura total o terceros', price: 'Desde 25,000 XAF/año' },
  { icon: '🏠', name: 'Seguro de Hogar', desc: 'Protección para tu vivienda', price: 'Desde 15,000 XAF/año' },
  { icon: '❤️', name: 'Seguro de Vida', desc: 'Protección para tu familia', price: 'Desde 10,000 XAF/mes' },
  { icon: '🏥', name: 'Seguro Médico', desc: 'Cobertura sanitaria completa', price: 'Desde 20,000 XAF/mes' },
  { icon: '✈️', name: 'Seguro de Viaje', desc: 'Viajes nacionales e internacionales', price: 'Desde 5,000 XAF/viaje' },
  { icon: '💼', name: 'Seguro Empresarial', desc: 'Protección para tu negocio', price: 'Consultar' },
];

const POSTAL = [
  { icon: '📦', name: 'Envío nacional', price: 'Desde 2,000 XAF' },
  { icon: '✈️', name: 'Envío internacional', price: 'Desde 15,000 XAF' },
  { icon: '📬', name: 'Apartado postal', price: '5,000 XAF/año' },
  { icon: '🔍', name: 'Seguimiento de envío', price: 'Gratis' },
];

export default function SegurosSaludScreen() {
  const [active, setActive] = useState('salud');
  const [selectedHealth, setSelectedHealth] = useState<typeof HEALTH[0] | null>(null);
  const [nif, setNif] = useState('');
  const [taxResult, setTaxResult] = useState<any>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  const consultarDGI = () => {
    if (!nif.trim()) { Alert.alert('Error', 'Introduce tu NIF'); return; }
    setTaxLoading(true);
    setTimeout(() => {
      setTaxResult({ nif, estado: 'Al corriente', deuda: 0, periodo: '2025' });
      setTaxLoading(false);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { if (selectedHealth) { setSelectedHealth(null); } else { router.back(); } }}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedHealth ? selectedHealth.name : TABS.find(t => t.id === active)?.icon + ' ' + TABS.find(t => t.id === active)?.label}
        </Text>
      </View>

      {/* Tabs */}
      {!selectedHealth && (
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, active === t.id && styles.tabActive]}
              onPress={() => { setActive(t.id); setTaxResult(null); setNif(''); }}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{t.icon}</Text>
              <Text style={[styles.tabText, active === t.id && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* SALUD */}
        {active === 'salud' && !selectedHealth && HEALTH.map(h => (
          <TouchableOpacity key={h.name} style={styles.card} onPress={() => setSelectedHealth(h)} activeOpacity={0.7}>
            <Text style={styles.cardEmoji}>🏥</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{h.name}</Text>
              <Text style={styles.cardSub}>{h.type}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))}

        {active === 'salud' && selectedHealth && (
          <View>
            <View style={styles.detailHeader}>
              <Text style={styles.detailType}>{selectedHealth.type}</Text>
            </View>
            <Text style={styles.sectionLabel}>SERVICIOS</Text>
            {selectedHealth.services.map(s => (
              <View key={s} style={styles.serviceRow}>
                <Text style={styles.dot}>●</Text>
                <Text style={styles.serviceText}>{s}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selectedHealth.phone}`)}>
              <Text style={styles.callBtnText}>📞 {selectedHealth.phone}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SEGUROS */}
        {active === 'seguros' && INSURANCE.map(ins => (
          <TouchableOpacity
            key={ins.name}
            style={styles.card}
            onPress={() => Alert.alert('Solicitar seguro', `Un agente te contactará para "${ins.name}".\n\nPrecio: ${ins.price}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.cardEmoji}>{ins.icon}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{ins.name}</Text>
              <Text style={styles.cardSub}>{ins.desc}</Text>
              <Text style={styles.cardPrice}>{ins.price}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* IMPUESTOS */}
        {active === 'impuestos' && (
          <View style={styles.taxSection}>
            <Text style={styles.sectionLabel}>CONSULTA TU SITUACIÓN FISCAL</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={nif}
                onChangeText={setNif}
                placeholder="NIF / Número de contribuyente"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <TouchableOpacity
              style={[styles.callBtn, !nif.trim() && { opacity: 0.5 }]}
              onPress={consultarDGI}
              disabled={!nif.trim() || taxLoading}
            >
              {taxLoading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.callBtnText}>Consultar DGI</Text>}
            </TouchableOpacity>
            {taxResult && (
              <View style={styles.resultCard}>
                {[['NIF', taxResult.nif], ['Estado', taxResult.estado], ['Período', taxResult.periodo], ['Deuda', `${taxResult.deuda.toLocaleString()} XAF`]].map(([l, v]) => (
                  <View key={l} style={styles.resultRow}>
                    <Text style={styles.resultLabel}>{l}</Text>
                    <Text style={[styles.resultValue, l === 'Estado' && { color: Colors.accent }]}>{v}</Text>
                  </View>
                ))}
                <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]} onPress={() => Linking.openURL('tel:+240333095500')}>
                  <Text style={styles.callBtnText}>📞 Contactar DGI</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* CORREOS */}
        {active === 'correos' && (
          <View>
            {POSTAL.map(p => (
              <View key={p.name} style={styles.card}>
                <Text style={styles.cardEmoji}>{p.icon}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{p.name}</Text>
                  <Text style={styles.cardPrice}>{p.price}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]} onPress={() => Linking.openURL('tel:+240333095600')}>
              <Text style={styles.callBtnText}>📞 Llamar a Correos GQ</Text>
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
  title: { ...Typography.headerTitle, color: Colors.textPrimary, flex: 1 },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.accent },
  tabIcon: { fontSize: 18 },
  tabText: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: FontWeight.semibold },
  tabTextActive: { color: Colors.accent },
  content: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadow.sm,
  },
  cardEmoji: { fontSize: 26, width: 36, textAlign: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cardSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  cardPrice: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.border },
  detailHeader: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  detailType: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textTertiary, letterSpacing: 0.5, marginBottom: Spacing.sm },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  dot: { fontSize: 8, color: Colors.accent },
  serviceText: { fontSize: FontSize.base, color: Colors.textPrimary },
  callBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  callBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.white },
  taxSection: { gap: Spacing.md },
  inputWrap: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  input: { fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.md },
  resultCard: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, marginTop: Spacing.md,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  resultLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  resultValue: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
});
