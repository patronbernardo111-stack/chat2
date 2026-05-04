import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { walletAPI } from '../src/api';
import { EGButton, EGInput, EGCard } from '../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';

const BANKS = [
  { id: 'bange',   name: 'BANGE',        full: 'Banco Nacional de Guinea Ecuatorial',                     color: '#003082', initials: 'BN', branches: 8,  atms: 12, balance: 45200,  accounts: [{ type: 'Cuenta Corriente', number: '****4521', balance: 45200 }] },
  { id: 'ccei',    name: 'CCEI Bank GE',  full: "Crédit Communautaire d'Afrique — GE",                    color: '#C8102E', initials: 'CC', branches: 6,  atms: 9,  balance: 80000,  accounts: [{ type: 'Cuenta Corriente', number: '****7712', balance: 80000 }] },
  { id: 'bgfi',    name: 'BGFIBank GE',   full: 'Banque Gabonaise et Française Internationale',            color: '#00539B', initials: 'BG', branches: 5,  atms: 7,  balance: 0,      accounts: [] },
  { id: 'ecobank', name: 'Ecobank GE',    full: 'Ecobank Transnational Inc. — Guinea Ecuatorial',          color: '#00A3E0', initials: 'EC', branches: 4,  atms: 8,  balance: 0,      accounts: [] },
  { id: 'cbge',    name: 'CBGE',          full: 'Commercial Bank Guinée Equatoriale',                      color: '#1B5E20', initials: 'CB', branches: 3,  atms: 5,  balance: 0,      accounts: [] },
];

const SERVICES = [
  { id: 'transfer', icon: '↗️', label: 'Transferencia', color: '#3B82F6' },
  { id: 'loan',     icon: '💰', label: 'Préstamos',     color: '#F97316' },
  { id: 'bills',    icon: '📄', label: 'Facturas',      color: '#8B5CF6' },
  { id: 'cards',    icon: '💳', label: 'Tarjetas',      color: '#EC4899' },
];

type Bank = typeof BANKS[0];

// ── BankCard ──────────────────────────────────────────────────────
const BankCard = ({ bank, onPress }: { bank: Bank; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.bankCard} activeOpacity={0.7}>
    <View style={[styles.bankLogo, { backgroundColor: bank.color }]}>
      <Text style={styles.bankInitials}>{bank.initials}</Text>
    </View>
    <View style={styles.bankInfo}>
      <Text style={styles.bankName}>{bank.name}</Text>
      <Text style={styles.bankFull} numberOfLines={1}>{bank.full}</Text>
      <View style={styles.bankMeta}>
        <View style={[styles.metaChip, { backgroundColor: bank.color + '18' }]}>
          <Text style={[styles.metaText, { color: bank.color }]}>{bank.branches} sucursales</Text>
        </View>
        <View style={styles.metaChip}>
          <Text style={styles.metaText}>{bank.atms} ATMs</Text>
        </View>
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

// ── TransferModal ─────────────────────────────────────────────────
const TransferModal = ({ visible, bank, onClose }: { visible: boolean; bank: Bank | null; onClose: () => void }) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!to || !amount) { Alert.alert('Error', 'Rellena todos los campos'); return; }
    setLoading(true);
    try {
      await walletAPI.transfer(to, Number(amount), concept || 'Transferencia bancaria');
      Alert.alert('✅', `Transferencia de ${Number(amount).toLocaleString()} XAF enviada`);
      setTo(''); setAmount(''); setConcept('');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar la transferencia');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>↗️ Transferencia — {bank?.name}</Text>
          <EGInput label="Número de cuenta / teléfono" value={to} onChangeText={setTo} placeholder="Destinatario" />
          <EGInput label="Importe (XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="10000" />
          <EGInput label="Concepto (opcional)" value={concept} onChangeText={setConcept} placeholder="Pago de..." />
          <EGButton title={loading ? 'Enviando...' : 'Enviar transferencia'} onPress={send} loading={loading} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── BankDetailModal ───────────────────────────────────────────────
const BankDetailModal = ({ bank, onClose }: { bank: Bank; onClose: () => void }) => {
  const [activeService, setActiveService] = useState<string | null>(null);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.detailContainer, { backgroundColor: bank.color + '10' }]}>
        {/* Header */}
        <View style={[styles.detailHeader, { backgroundColor: bank.color }]}>
          <TouchableOpacity onPress={onClose} style={styles.detailBack}>
            <Text style={styles.detailBackText}>←</Text>
          </TouchableOpacity>
          <View style={styles.detailHeaderInfo}>
            <Text style={styles.detailName}>{bank.name}</Text>
            <Text style={styles.detailFull} numberOfLines={1}>{bank.full}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
          {/* Cuentas */}
          {bank.accounts.length > 0 && (
            <EGCard style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Mis cuentas</Text>
              {bank.accounts.map((acc, i) => (
                <View key={i} style={styles.accountRow}>
                  <View>
                    <Text style={styles.accountType}>{acc.type}</Text>
                    <Text style={styles.accountNumber}>{acc.number}</Text>
                  </View>
                  <Text style={[styles.accountBalance, { color: bank.color }]}>
                    {acc.balance.toLocaleString()} XAF
                  </Text>
                </View>
              ))}
            </EGCard>
          )}

          {/* Servicios */}
          <EGCard style={styles.detailCard}>
            <Text style={styles.detailSectionTitle}>Servicios</Text>
            <View style={styles.servicesGrid}>
              {SERVICES.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.serviceBtn}
                  onPress={() => setActiveService(s.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.serviceBtnIcon, { backgroundColor: s.color + '18' }]}>
                    <Text style={styles.serviceBtnEmoji}>{s.icon}</Text>
                  </View>
                  <Text style={styles.serviceBtnLabel}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </EGCard>

          {/* Info */}
          <EGCard style={styles.detailCard}>
            <Text style={styles.detailSectionTitle}>Información</Text>
            {[
              { label: 'Sucursales', value: `${bank.branches}` },
              { label: 'ATMs', value: `${bank.atms}` },
              { label: 'SWIFT', value: bank.id.toUpperCase() + 'GQXX' },
            ].map(item => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </EGCard>
        </ScrollView>

        <TransferModal
          visible={activeService === 'transfer'}
          bank={bank}
          onClose={() => setActiveService(null)}
        />
      </SafeAreaView>
    </Modal>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function BancosScreen() {
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const totalBalance = BANKS.flatMap(b => b.accounts).reduce((s, a) => s + a.balance, 0);
  const activeBanks = BANKS.filter(b => b.accounts.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bancos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Saldo total */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO TOTAL EN TODOS LOS BANCOS</Text>
          <Text style={styles.balanceAmount}>{totalBalance.toLocaleString()} <Text style={styles.balanceCurrency}>XAF</Text></Text>
          <Text style={styles.balanceSub}>{activeBanks.length} cuentas activas · {BANKS.length} bancos</Text>
        </View>

        {/* Cuentas activas */}
        {activeBanks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MIS CUENTAS</Text>
            {activeBanks.flatMap(b => b.accounts.map(a => ({ ...a, bank: b }))).map((a, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedBank(a.bank)} style={styles.accountCard} activeOpacity={0.7}>
                <View style={[styles.bankLogo, { backgroundColor: a.bank.color, width: 44, height: 44, borderRadius: 12 }]}>
                  <Text style={styles.bankInitials}>{a.bank.initials}</Text>
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{a.bank.name}</Text>
                  <Text style={styles.accountNumber}>{a.type} · {a.number}</Text>
                </View>
                <View style={styles.accountBalanceBox}>
                  <Text style={[styles.accountBalance, { color: a.bank.color }]}>{a.balance.toLocaleString()}</Text>
                  <Text style={styles.accountCurrency}>XAF</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Todos los bancos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TODOS LOS BANCOS</Text>
          {BANKS.map(b => (
            <BankCard key={b.id} bank={b} onPress={() => setSelectedBank(b)} />
          ))}
        </View>
      </ScrollView>

      {selectedBank && (
        <BankDetailModal bank={selectedBank} onClose={() => setSelectedBank(null)} />
      )}
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

  // Balance card
  balanceCard: {
    margin: Spacing.screenPadding,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    backgroundColor: '#1485EE',
    ...Shadow.lg,
  },
  balanceLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, marginBottom: Spacing.sm },
  balanceAmount: { fontSize: 36, fontWeight: FontWeight.extrabold, color: Colors.white, letterSpacing: -1 },
  balanceCurrency: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: 'rgba(255,255,255,0.7)' },
  balanceSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  // Section
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.sectionTitle, color: Colors.textTertiary, marginBottom: Spacing.sm, marginLeft: 4 },

  // Account card
  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  accountBalanceBox: { alignItems: 'flex-end' },
  accountBalance: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  accountCurrency: { fontSize: FontSize.xs, color: Colors.textTertiary },

  // Bank card
  bankCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  bankLogo: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bankInitials: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  bankInfo: { flex: 1 },
  bankName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  bankFull: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  bankMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  metaChip: { backgroundColor: Colors.bgTertiary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  metaText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  chevron: { fontSize: 20, color: Colors.border },

  // Account info
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  accountType: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  accountNumber: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.bgSecondary, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, padding: Spacing.xl, paddingBottom: Spacing['3xl'] },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { ...Typography.headerTitle, color: Colors.textPrimary, marginBottom: Spacing.xl, textAlign: 'center' },

  // Detail
  detailContainer: { flex: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  detailBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  detailBackText: { color: Colors.white, fontSize: 18 },
  detailHeaderInfo: { flex: 1 },
  detailName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  detailFull: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },
  detailContent: { padding: Spacing.screenPadding, gap: Spacing.md },
  detailCard: { padding: Spacing.lg },
  detailSectionTitle: { ...Typography.sectionTitle, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Services grid
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  serviceBtn: { width: '22%', alignItems: 'center', gap: Spacing.xs },
  serviceBtnIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  serviceBtnEmoji: { fontSize: 22 },
  serviceBtnLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },

  // Info rows
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
});
