import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Alert, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { cemacAPI, walletAPI } from '../src/api';
import { EGButton, EGInput, EGCard } from '../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';

const COUNTRIES = [
  { code: 'GQ', name: 'Guinea Ecuatorial', capital: 'Malabo',      color: '#00b96b', flag: '🇬🇶' },
  { code: 'CM', name: 'Camerún',           capital: 'Yaundé',      color: '#007a3d', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabón',             capital: 'Libreville',  color: '#009e60', flag: '🇬🇦' },
  { code: 'CG', name: 'Congo',             capital: 'Brazzaville', color: '#009a44', flag: '🇨🇬' },
  { code: 'CF', name: 'R. Centroafricana', capital: 'Bangui',      color: '#1a56db', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad',              capital: "N'Djamena",   color: '#1e40af', flag: '🇹🇩' },
];

const EXCHANGE_RATES: Record<string, number> = {
  EUR: 0.001524, USD: 0.001648, GBP: 0.001302,
  CHF: 0.001489, CNY: 0.011920, XOF: 1.0,
};

const SERVICES = [
  { id: 'transfer', icon: '↗️', label: 'Transferencia CEMAC', color: '#3B82F6' },
  { id: 'exchange', icon: '💱', label: 'Cambio de divisa',    color: '#EAB308' },
  { id: 'rates',    icon: '📈', label: 'Tasas de cambio',     color: '#10B981' },
  { id: 'history',  icon: '📋', label: 'Historial',           color: '#8B5CF6' },
];

// ── TransferModal ─────────────────────────────────────────────────
const TransferModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [fromCountry, setFromCountry] = useState('GQ');
  const [toCountry, setToCountry] = useState('CM');
  const [beneficiary, setBeneficiary] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!beneficiary || !account || !amount) { Alert.alert('Error', 'Rellena todos los campos'); return; }
    setLoading(true);
    try {
      await cemacAPI.createTransfer({
        from_country: fromCountry,
        to_country: toCountry,
        beneficiary_name: beneficiary,
        beneficiary_account: account,
        amount: Number(amount),
        fee: Math.round(Number(amount) * 0.015),
      });
      Alert.alert('✅', `Transferencia de ${Number(amount).toLocaleString()} XAF enviada a ${beneficiary}`);
      setBeneficiary(''); setAccount(''); setAmount('');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar la transferencia');
    } finally { setLoading(false); }
  };

  const fee = amount ? Math.round(Number(amount) * 0.015) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>↗️ Transferencia CEMAC</Text>

          <Text style={styles.fieldLabel}>País origen → destino</Text>
          <View style={styles.countryRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
              {COUNTRIES.map(c => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => setFromCountry(c.code)}
                  style={[styles.countryChip, fromCountry === c.code && { backgroundColor: c.color, borderColor: c.color }]}
                >
                  <Text>{c.flag}</Text>
                  <Text style={[styles.countryChipText, fromCountry === c.code && { color: Colors.white }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <Text style={styles.arrowText}>↓</Text>
          <View style={styles.countryRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
              {COUNTRIES.filter(c => c.code !== fromCountry).map(c => (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => setToCountry(c.code)}
                  style={[styles.countryChip, toCountry === c.code && { backgroundColor: c.color, borderColor: c.color }]}
                >
                  <Text>{c.flag}</Text>
                  <Text style={[styles.countryChipText, toCountry === c.code && { color: Colors.white }]}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <EGInput label="Nombre del beneficiario" value={beneficiary} onChangeText={setBeneficiary} placeholder="Nombre completo" autoCapitalize="words" />
          <EGInput label="Cuenta / IBAN" value={account} onChangeText={setAccount} placeholder="Número de cuenta" />
          <EGInput label="Importe (XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="50000" />

          {fee > 0 && (
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Comisión (1.5%)</Text>
              <Text style={styles.feeValue}>{fee.toLocaleString()} XAF</Text>
            </View>
          )}

          <EGButton title={loading ? 'Enviando...' : 'Enviar transferencia'} onPress={send} loading={loading} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── ExchangeModal ─────────────────────────────────────────────────
const ExchangeModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');

  const result = amount ? (Number(amount) * EXCHANGE_RATES[currency]).toFixed(4) : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>💱 Cambio de divisa</Text>

          <EGInput label="Importe en XAF" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="100000" />

          <Text style={styles.fieldLabel}>Divisa destino</Text>
          <View style={styles.currencyRow}>
            {Object.keys(EXCHANGE_RATES).map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCurrency(c)}
                style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
              >
                <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {result && (
            <EGCard style={styles.resultCard}>
              <Text style={styles.resultLabel}>{Number(amount).toLocaleString()} XAF =</Text>
              <Text style={styles.resultValue}>{result} {currency}</Text>
              <Text style={styles.resultRate}>Tasa: 1 XAF = {EXCHANGE_RATES[currency]} {currency}</Text>
            </EGCard>
          )}

          <EGButton title="Cerrar" onPress={onClose} variant="outline" />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function CemacScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<any[]>([]);

  React.useEffect(() => {
    cemacAPI.getTransfers().then(setTransfers).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Zona CEMAC</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner CEMAC */}
        <View style={styles.cemacBanner}>
          <Text style={styles.cemacTitle}>🌍 Comunidad Económica</Text>
          <Text style={styles.cemacSub}>África Central · 6 países · XAF</Text>
          <View style={styles.flagsRow}>
            {COUNTRIES.map(c => (
              <Text key={c.code} style={styles.flagEmoji}>{c.flag}</Text>
            ))}
          </View>
        </View>

        {/* Servicios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SERVICIOS</Text>
          <View style={styles.servicesGrid}>
            {SERVICES.map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.serviceCard}
                onPress={() => setActiveModal(s.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.serviceIcon, { backgroundColor: s.color + '18' }]}>
                  <Text style={styles.serviceEmoji}>{s.icon}</Text>
                </View>
                <Text style={styles.serviceLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Países CEMAC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAÍSES MIEMBROS</Text>
          {COUNTRIES.map(c => (
            <View key={c.code} style={styles.countryCard}>
              <Text style={styles.countryFlag}>{c.flag}</Text>
              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{c.name}</Text>
                <Text style={styles.countryCapital}>Capital: {c.capital}</Text>
              </View>
              <View style={[styles.countryBadge, { backgroundColor: c.color }]}>
                <Text style={styles.countryCode}>{c.code}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Tasas de cambio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TASAS DE CAMBIO (XAF)</Text>
          <EGCard>
            {Object.entries(EXCHANGE_RATES).map(([currency, rate], i) => (
              <View key={currency} style={[styles.rateRow, i < Object.keys(EXCHANGE_RATES).length - 1 && styles.rateBorder]}>
                <Text style={styles.rateCurrency}>{currency}</Text>
                <Text style={styles.rateValue}>1 XAF = {rate} {currency}</Text>
              </View>
            ))}
          </EGCard>
        </View>

        {/* Historial */}
        {transfers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRANSFERENCIAS RECIENTES</Text>
            {transfers.slice(0, 5).map((t: any) => (
              <View key={t.id} style={styles.transferItem}>
                <Text style={styles.transferIcon}>↗️</Text>
                <View style={styles.transferInfo}>
                  <Text style={styles.transferName}>{t.beneficiary_name}</Text>
                  <Text style={styles.transferDate}>{t.from_country} → {t.to_country}</Text>
                </View>
                <Text style={styles.transferAmount}>{Number(t.amount).toLocaleString()} XAF</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TransferModal visible={activeModal === 'transfer'} onClose={() => setActiveModal(null)} />
      <ExchangeModal visible={activeModal === 'exchange' || activeModal === 'rates'} onClose={() => setActiveModal(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },

  // Banner
  cemacBanner: {
    margin: Spacing.screenPadding,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    backgroundColor: '#00b96b',
    ...Shadow.lg,
  },
  cemacTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.white, marginBottom: 4 },
  cemacSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.md },
  flagsRow: { flexDirection: 'row', gap: Spacing.sm },
  flagEmoji: { fontSize: 28 },

  // Section
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.sectionTitle, color: Colors.textTertiary, marginBottom: Spacing.sm, marginLeft: 4 },

  // Services
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  serviceCard: {
    width: '47%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  serviceIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceEmoji: { fontSize: 24 },
  serviceLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },

  // Countries
  countryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  countryFlag: { fontSize: 32 },
  countryInfo: { flex: 1 },
  countryName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  countryCapital: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  countryBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  countryCode: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Rates
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rateBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rateCurrency: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  rateValue: { fontSize: FontSize.base, color: Colors.textSecondary },

  // Transfers
  transferItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  transferIcon: { fontSize: 20 },
  transferInfo: { flex: 1 },
  transferName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  transferDate: { fontSize: FontSize.sm, color: Colors.textTertiary },
  transferAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.accent },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bgSecondary, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, paddingBottom: Spacing['3xl'], maxHeight: '90%' },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { ...Typography.headerTitle, color: Colors.textPrimary, marginBottom: Spacing.xl, textAlign: 'center' },
  fieldLabel: { ...Typography.fieldLabel, color: Colors.textTertiary, marginBottom: Spacing.sm },

  // Country selector
  countryRow: { marginBottom: Spacing.sm },
  countryScroll: { flexGrow: 0 },
  countryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1, borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  countryChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  arrowText: { textAlign: 'center', fontSize: 20, color: Colors.textTertiary, marginVertical: 4 },

  // Fee
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md },
  feeLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  feeValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.errorText },

  // Currency
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  currencyChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border },
  currencyChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  currencyText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  currencyTextActive: { color: Colors.accent },

  // Result
  resultCard: { padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg },
  resultLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  resultValue: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Colors.accent, marginVertical: 4 },
  resultRate: { fontSize: FontSize.xs, color: Colors.textTertiary },
});
