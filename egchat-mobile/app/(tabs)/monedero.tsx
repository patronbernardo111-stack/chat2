import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Modal, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletAPI } from '../../src/api';
import { EGButton, EGInput, EGCard } from '../../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';

// ── Helpers ───────────────────────────────────────────────────────
const formatAmount = (n: number) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 0 });

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getTxIcon = (type: string) => {
  switch (type) {
    case 'deposit': return '⬇️';
    case 'withdraw': return '⬆️';
    case 'transfer': return '↗️';
    case 'recharge': return '🎁';
    default: return '💳';
  }
};

const getTxColor = (type: string) =>
  ['deposit', 'recharge'].includes(type) ? Colors.accent : '#EF4444';

const getTxSign = (type: string) =>
  ['deposit', 'recharge'].includes(type) ? '+' : '-';

const getTxLabel = (tx: any) => {
  if (tx.method) return tx.method;
  switch (tx.type) {
    case 'deposit': return 'Recarga';
    case 'withdraw': return 'Retiro';
    case 'transfer': return 'Transferencia';
    case 'recharge': return 'Código de recarga';
    default: return tx.type;
  }
};

// ── ActionModal ───────────────────────────────────────────────────
interface ActionModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ActionModal = ({ visible, title, onClose, children }: ActionModalProps) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalSheet} onPress={() => {}}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>{title}</Text>
        {children}
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function MonederoScreen() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('XAF');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [showRecharge, setShowRecharge] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Formularios
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendConcept, setSendConcept] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [bal, txs] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(1),
      ]);
      setBalance(bal.balance || 0);
      setCurrency(bal.currency || 'XAF');
      setTransactions(txs.transactions || []);
    } catch {
      // Mantener datos anteriores
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // Recargar
  const handleRecharge = async () => {
    if (!rechargeAmount || isNaN(Number(rechargeAmount))) {
      Alert.alert('Error', 'Introduce un importe válido'); return;
    }
    setActionLoading(true);
    try {
      await walletAPI.deposit(Number(rechargeAmount), rechargeMethod || 'manual', `DEP-${Date.now()}`);
      setShowRecharge(false);
      setRechargeAmount('');
      setRechargeMethod('');
      await loadData();
      Alert.alert('✅', 'Recarga realizada correctamente');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo realizar la recarga');
    } finally { setActionLoading(false); }
  };

  // Enviar
  const handleSend = async () => {
    if (!sendTo || !sendAmount || isNaN(Number(sendAmount))) {
      Alert.alert('Error', 'Rellena todos los campos'); return;
    }
    setActionLoading(true);
    try {
      await walletAPI.transfer(sendTo, Number(sendAmount), sendConcept);
      setShowSend(false);
      setSendTo(''); setSendAmount(''); setSendConcept('');
      await loadData();
      Alert.alert('✅', 'Transferencia realizada correctamente');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo realizar la transferencia');
    } finally { setActionLoading(false); }
  };

  // Canjear código
  const handleRedeem = async () => {
    if (!redeemCode.trim()) { Alert.alert('Error', 'Introduce el código'); return; }
    setActionLoading(true);
    try {
      const res = await walletAPI.redeemCode(redeemCode.trim());
      setShowCode(false);
      setRedeemCode('');
      await loadData();
      Alert.alert('🎁', `¡Código canjeado! +${formatAmount(res.amount)} ${currency}`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Código inválido o ya usado');
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Monedero</Text>
        </View>

        {/* ── Tarjeta de saldo ── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>SALDO DISPONIBLE</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>{formatAmount(balance)}</Text>
            <Text style={styles.balanceCurrency}>{currency}</Text>
          </View>
          <Text style={styles.balanceSub}>Monedero EGCHAT · Guinea Ecuatorial</Text>

          {/* Acciones rápidas */}
          <View style={styles.actions}>
            {[
              { icon: '⬇️', label: 'Recargar', onPress: () => setShowRecharge(true) },
              { icon: '↗️', label: 'Enviar', onPress: () => setShowSend(true) },
              { icon: '🎁', label: 'Código', onPress: () => setShowCode(true) },
              { icon: '📊', label: 'Historial', onPress: () => {} },
            ].map(a => (
              <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress} activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionEmoji}>{a.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Transacciones ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas transacciones</Text>

          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>Sin transacciones aún</Text>
            </View>
          ) : (
            transactions.slice(0, 20).map((tx: any, i: number) => (
              <View key={tx.id || i} style={[styles.txItem, i < transactions.length - 1 && styles.txBorder]}>
                <View style={[styles.txIcon, { backgroundColor: ['deposit', 'recharge'].includes(tx.type) ? Colors.accentLight : '#FEF2F2' }]}>
                  <Text style={styles.txEmoji}>{getTxIcon(tx.type)}</Text>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txLabel}>{getTxLabel(tx)}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.created_at)}</Text>
                  {tx.reference && (
                    <Text style={styles.txRef} numberOfLines={1}>Ref: {tx.reference}</Text>
                  )}
                </View>
                <Text style={[styles.txAmount, { color: getTxColor(tx.type) }]}>
                  {getTxSign(tx.type)}{formatAmount(tx.amount)} {currency}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Modal Recargar ── */}
      <ActionModal visible={showRecharge} title="Recargar saldo" onClose={() => setShowRecharge(false)}>
        <EGInput
          label="Importe (XAF)"
          value={rechargeAmount}
          onChangeText={setRechargeAmount}
          keyboardType="numeric"
          placeholder="5000"
        />
        <EGInput
          label="Método de pago"
          value={rechargeMethod}
          onChangeText={setRechargeMethod}
          placeholder="Orange Money, BGFI..."
        />
        <EGButton
          title={actionLoading ? 'Procesando...' : 'Recargar'}
          onPress={handleRecharge}
          loading={actionLoading}
          style={styles.modalBtn}
        />
      </ActionModal>

      {/* ── Modal Enviar ── */}
      <ActionModal visible={showSend} title="Enviar dinero" onClose={() => setShowSend(false)}>
        <EGInput
          label="Teléfono del destinatario"
          value={sendTo}
          onChangeText={setSendTo}
          keyboardType="phone-pad"
          placeholder="+240 222 XXX XXX"
        />
        <EGInput
          label="Importe (XAF)"
          value={sendAmount}
          onChangeText={setSendAmount}
          keyboardType="numeric"
          placeholder="1000"
        />
        <EGInput
          label="Concepto (opcional)"
          value={sendConcept}
          onChangeText={setSendConcept}
          placeholder="Pago de..."
        />
        <EGButton
          title={actionLoading ? 'Enviando...' : 'Enviar'}
          onPress={handleSend}
          loading={actionLoading}
          style={styles.modalBtn}
        />
      </ActionModal>

      {/* ── Modal Código ── */}
      <ActionModal visible={showCode} title="Canjear código" onClose={() => setShowCode(false)}>
        <Text style={styles.codeHint}>Introduce el código de recarga de 16 dígitos</Text>
        <EGInput
          label="Código"
          value={redeemCode}
          onChangeText={setRedeemCode}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoCapitalize="characters"
        />
        <EGButton
          title={actionLoading ? 'Canjeando...' : 'Canjear código'}
          onPress={handleRedeem}
          loading={actionLoading}
          style={styles.modalBtn}
        />
      </ActionModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { ...Typography.headerTitle, color: Colors.textPrimary },

  // Balance card
  balanceCard: {
    margin: Spacing.screenPadding,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    backgroundColor: Colors.accent,
    ...Shadow.lg,
  },
  balanceLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginBottom: 4 },
  balanceAmount: {
    fontSize: 40,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    letterSpacing: -1,
  },
  balanceCurrency: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  balanceSub: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.xl,
  },

  // Actions
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: Spacing.xs },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },

  // Section
  section: {
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { ...Typography.subtitle, color: Colors.textSecondary },

  // Transaction item
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  txBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1 },
  txLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  txDate: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  txRef: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  txAmount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headerTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  modalBtn: { marginTop: Spacing.sm },
  codeHint: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
