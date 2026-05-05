import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Modal, Pressable, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { walletAPI } from '../../src/api';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 0 });

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

const getTxIcon = (type: string) => {
  if (type === 'deposit') return '⬇️';
  if (type === 'withdraw') return '⬆️';
  if (type === 'transfer_sent') return '↗️';
  if (type === 'transfer_received') return '↙️';
  if (type === 'recharge') return '🎁';
  return '💳';
};

const isCredit = (type: string) =>
  ['deposit', 'recharge', 'transfer_received'].includes(type);

const getTxLabel = (tx: any) => {
  if (tx.method) return tx.method;
  const map: Record<string, string> = {
    deposit: 'Recarga', withdraw: 'Retiro',
    transfer_sent: 'Transferencia enviada',
    transfer_received: 'Transferencia recibida',
    recharge: 'Código de recarga',
  };
  return map[tx.type] || tx.type;
};

// ── Sheet modal base ──────────────────────────────────────────────
const Sheet = ({
  visible, title, subtitle, onClose, children,
}: {
  visible: boolean; title: string; subtitle?: string;
  onClose: () => void; children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={s.overlay} onPress={onClose}>
      <Pressable style={s.sheet} onPress={() => {}}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>{title}</Text>
        {subtitle ? <Text style={s.sheetSub}>{subtitle}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Campo de input reutilizable ───────────────────────────────────
const Field = ({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
}) => (
  <View style={s.fieldWrap}>
    <Text style={s.fieldLabel}>{label}</Text>
    <TextInput
      style={s.fieldInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize || 'none'}
    />
  </View>
);

// ── Método selector ───────────────────────────────────────────────
const MethodBtn = ({
  icon, label, sub, onPress,
}: { icon: string; label: string; sub: string; onPress: () => void }) => (
  <TouchableOpacity style={s.methodBtn} onPress={onPress} activeOpacity={0.7}>
    <Text style={s.methodIcon}>{icon}</Text>
    <View style={s.methodText}>
      <Text style={s.methodLabel}>{label}</Text>
      <Text style={s.methodSub}>{sub}</Text>
    </View>
    <Text style={s.methodArrow}>›</Text>
  </TouchableOpacity>
);

// ── Montos rápidos ────────────────────────────────────────────────
const QuickAmounts = ({
  amounts, selected, onSelect,
}: { amounts: number[]; selected: string; onSelect: (v: string) => void }) => (
  <View style={s.quickRow}>
    {amounts.map(a => (
      <TouchableOpacity
        key={a}
        style={[s.quickBtn, selected === String(a) && s.quickBtnActive]}
        onPress={() => onSelect(String(a))}
        activeOpacity={0.7}
      >
        <Text style={[s.quickBtnText, selected === String(a) && s.quickBtnTextActive]}>
          {fmt(a)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Modal Recargar ────────────────────────────────────────────────
type RStep = 'menu' | 'banco' | 'codigo' | 'agente';

const RechargeModal = ({
  visible, balance, onClose, onSuccess,
}: {
  visible: boolean; balance: number;
  onClose: () => void; onSuccess: () => void;
}) => {
  const [step, setStep] = useState<RStep>('menu');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setStep('menu'); setAmount(''); setMethod(''); setCode(''); };
  const close = () => { reset(); onClose(); };

  const doDeposit = async () => {
    const n = Number(amount);
    if (!n || n < 1000) { Alert.alert('Error', 'Importe mínimo 1,000 XAF'); return; }
    setLoading(true);
    try {
      await walletAPI.deposit(n, method || 'Transferencia bancaria', `DEP-${Date.now()}`);
      close();
      onSuccess();
      Alert.alert('✅ Recarga enviada', `${fmt(n)} XAF serán añadidos tras verificación`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar');
    } finally { setLoading(false); }
  };

  const doCode = async () => {
    const clean = code.replace(/-/g, '');
    if (clean.length < 12) { Alert.alert('Error', 'Código inválido'); return; }
    setLoading(true);
    try {
      const res = await walletAPI.redeemCode(code);
      close();
      onSuccess();
      Alert.alert('🎁 ¡Código canjeado!', `+${fmt(res.amount || 0)} XAF añadidos`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Código inválido o ya usado');
    } finally { setLoading(false); }
  };

  return (
    <Sheet
      visible={visible}
      title={step === 'menu' ? 'Recargar saldo' : step === 'banco' ? 'Transferencia bancaria' : step === 'codigo' ? 'Código de recarga' : 'Agente EGCHAT'}
      subtitle={`Saldo actual: ${fmt(balance)} XAF`}
      onClose={close}
    >
      {step === 'menu' && (
        <View style={s.sheetBody}>
          <MethodBtn icon="🏦" label="Transferencia bancaria" sub="BANGE, BGFI, CCEI — 1-2 días" onPress={() => { setMethod('Transferencia bancaria'); setStep('banco'); }} />
          <MethodBtn icon="🎁" label="Código de recarga" sub="Voucher prepago de 16 dígitos" onPress={() => setStep('codigo')} />
          <MethodBtn icon="🏪" label="Agente EGCHAT" sub="Depósito en efectivo — inmediato" onPress={() => { setMethod('Agente EGCHAT'); setStep('agente'); }} />
        </View>
      )}

      {step === 'banco' && (
        <View style={s.sheetBody}>
          <View style={s.infoBox}>
            {[
              ['Beneficiario', 'EGCHAT S.A.'],
              ['Bancos', 'BANGE / CCEI / BGFI'],
              ['Cuenta', 'GQ-EGCHAT-001-2026'],
              ['Concepto', 'Recarga + tu teléfono'],
            ].map(([l, v]) => (
              <View key={l} style={s.infoRow}>
                <Text style={s.infoLabel}>{l}</Text>
                <Text style={s.infoValue}>{v}</Text>
              </View>
            ))}
          </View>
          <QuickAmounts amounts={[5000, 10000, 25000, 50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <TouchableOpacity
            style={[s.primaryBtn, (!amount || loading) && s.primaryBtnDisabled]}
            onPress={doDeposit}
            disabled={!amount || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.primaryBtnText}>Confirmar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'codigo' && (
        <View style={s.sheetBody}>
          <Text style={s.codeHint}>Introduce el código de 16 dígitos del voucher</Text>
          <TextInput
            style={s.codeInput}
            value={code}
            onChangeText={v => {
              const clean = v.replace(/[^0-9A-Za-z]/g, '').slice(0, 16);
              const formatted = clean.replace(/(.{4})/g, '$1-').replace(/-$/, '');
              setCode(formatted);
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="characters"
            keyboardType="default"
          />
          <TouchableOpacity
            style={[s.primaryBtn, (code.replace(/-/g, '').length < 12 || loading) && s.primaryBtnDisabled]}
            onPress={doCode}
            disabled={code.replace(/-/g, '').length < 12 || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.primaryBtnText}>Canjear código</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'agente' && (
        <View style={s.sheetBody}>
          {[
            { name: 'Agente Centro Malabo', addr: 'Av. de la Independencia', hours: 'L-S 8:00-20:00' },
            { name: 'Agente Caracolas', addr: 'Barrio Caracolas, Malabo', hours: 'L-D 8:00-21:00' },
            { name: 'Agente Ela Nguema', addr: 'Ela Nguema, Malabo', hours: 'L-S 8:00-19:00' },
            { name: 'Agente Bata Centro', addr: 'Centro de Bata', hours: 'L-D 8:00-21:00' },
          ].map(a => (
            <View key={a.name} style={s.agentCard}>
              <Text style={s.agentName}>{a.name}</Text>
              <Text style={s.agentInfo}>📍 {a.addr}  ·  🕐 {a.hours}</Text>
            </View>
          ))}
          <QuickAmounts amounts={[5000, 10000, 25000, 50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe a depositar (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <TouchableOpacity
            style={[s.primaryBtn, (!amount || loading) && s.primaryBtnDisabled]}
            onPress={doDeposit}
            disabled={!amount || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.primaryBtnText}>Confirmar depósito — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  );
};

// ── Modal Retirar ─────────────────────────────────────────────────
type WStep = 'menu' | 'tarjeta' | 'banco' | 'agente';

const WithdrawModal = ({
  visible, balance, onClose, onSuccess,
}: {
  visible: boolean; balance: number;
  onClose: () => void; onSuccess: () => void;
}) => {
  const [step, setStep] = useState<WStep>('menu');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setStep('menu'); setAmount(''); setDestination(''); };
  const close = () => { reset(); onClose(); };

  const doWithdraw = async (method: string) => {
    const n = Number(amount);
    if (!n || n < 1000) { Alert.alert('Error', 'Importe mínimo 1,000 XAF'); return; }
    if (n > balance) { Alert.alert('Error', 'Saldo insuficiente'); return; }
    if (!destination.trim()) { Alert.alert('Error', 'Introduce el destino'); return; }
    setLoading(true);
    try {
      await walletAPI.withdraw(n, method, destination);
      close();
      onSuccess();
      Alert.alert('✅ Retiro procesado', `${fmt(n)} XAF en camino a tu cuenta`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar');
    } finally { setLoading(false); }
  };

  return (
    <Sheet
      visible={visible}
      title={step === 'menu' ? 'Retirar dinero' : step === 'tarjeta' ? 'Retirar a tarjeta' : step === 'banco' ? 'Transferencia bancaria' : 'Retirar en agente'}
      subtitle={`Disponible: ${fmt(balance)} XAF`}
      onClose={close}
    >
      {step === 'menu' && (
        <View style={s.sheetBody}>
          <MethodBtn icon="💳" label="Retirar a tarjeta" sub="Tarjeta bancaria vinculada — 1-3 días" onPress={() => setStep('tarjeta')} />
          <MethodBtn icon="🏦" label="Transferencia bancaria" sub="A tu cuenta en GQ — 1-2 días" onPress={() => setStep('banco')} />
          <MethodBtn icon="🏪" label="Retirar en agente" sub="Efectivo inmediato en agentes EGCHAT" onPress={() => setStep('agente')} />
        </View>
      )}

      {step === 'tarjeta' && (
        <View style={s.sheetBody}>
          <QuickAmounts amounts={[5000, 10000, 25000, 50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <Field label="Número de tarjeta" value={destination} onChangeText={setDestination} placeholder="**** **** **** ****" keyboardType="numeric" />
          <TouchableOpacity
            style={[s.primaryBtn, s.withdrawBtn, (!amount || !destination || loading) && s.primaryBtnDisabled]}
            onPress={() => doWithdraw('Tarjeta bancaria')}
            disabled={!amount || !destination || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.primaryBtnText}>Retirar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'banco' && (
        <View style={s.sheetBody}>
          <QuickAmounts amounts={[5000, 10000, 25000, 50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <Field label="Banco" value={destination} onChangeText={setDestination} placeholder="BANGE, BGFI, CCEI..." />
          <TouchableOpacity
            style={[s.primaryBtn, s.withdrawBtn, (!amount || !destination || loading) && s.primaryBtnDisabled]}
            onPress={() => doWithdraw('Transferencia bancaria')}
            disabled={!amount || !destination || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.primaryBtnText}>Retirar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'agente' && (
        <View style={s.sheetBody}>
          <View style={s.infoBox}>
            <Text style={s.infoLabel}>Presenta tu QR en cualquier agente EGCHAT autorizado para retirar en efectivo de forma inmediata.</Text>
          </View>
          <QuickAmounts amounts={[5000, 10000, 25000, 50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <Field label="Nombre del agente" value={destination} onChangeText={setDestination} placeholder="Agente Centro Malabo..." />
          <TouchableOpacity
            style={[s.primaryBtn, s.withdrawBtn, (!amount || !destination || loading) && s.primaryBtnDisabled]}
            onPress={() => doWithdraw('Agente EGCHAT')}
            disabled={!amount || !destination || loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.primaryBtnText}>Confirmar retiro — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep('menu')}>
            <Text style={s.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  );
};

// ── Modal Enviar ──────────────────────────────────────────────────
const SendModal = ({
  visible, balance, onClose, onSuccess,
}: {
  visible: boolean; balance: number;
  onClose: () => void; onSuccess: () => void;
}) => {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);

  const close = () => { setTo(''); setAmount(''); setConcept(''); onClose(); };

  const doSend = async () => {
    const n = Number(amount);
    if (!to.trim()) { Alert.alert('Error', 'Introduce el teléfono del destinatario'); return; }
    if (!n || n < 100) { Alert.alert('Error', 'Importe mínimo 100 XAF'); return; }
    if (n > balance) { Alert.alert('Error', 'Saldo insuficiente'); return; }
    setLoading(true);
    try {
      await walletAPI.transfer(to.trim(), n, concept);
      close();
      onSuccess();
      Alert.alert('✅ Enviado', `${fmt(n)} XAF enviados correctamente`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo realizar la transferencia');
    } finally { setLoading(false); }
  };

  return (
    <Sheet visible={visible} title="Enviar dinero" subtitle={`Disponible: ${fmt(balance)} XAF`} onClose={close}>
      <View style={s.sheetBody}>
        <QuickAmounts amounts={[1000, 5000, 10000, 25000]} selected={amount} onSelect={setAmount} />
        <Field label="Teléfono del destinatario" value={to} onChangeText={setTo} placeholder="+240 222 XXX XXX" keyboardType="phone-pad" />
        <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="1000" keyboardType="numeric" />
        <Field label="Concepto (opcional)" value={concept} onChangeText={setConcept} placeholder="Pago de..." />
        <TouchableOpacity
          style={[s.primaryBtn, (!to || !amount || loading) && s.primaryBtnDisabled]}
          onPress={doSend}
          disabled={!to || !amount || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={s.primaryBtnText}>Enviar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
        </TouchableOpacity>
      </View>
    </Sheet>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function MonederoScreen() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('XAF');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadData = useCallback(async () => {
    try {
      const [bal, txs] = await Promise.all([
        walletAPI.getBalance(),
        walletAPI.getTransactions(1),
      ]);
      setBalance(bal.balance || 0);
      setCurrency(bal.currency || 'XAF');
      setTransactions(txs.transactions || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: C.bgPrimary }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Header */}
        <View style={[s.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          <Text style={[s.headerTitle, { color: C.textPrimary }]}>Monedero</Text>
        </View>

        {/* Tarjeta de saldo */}
        <View style={s.balanceCard}>
          <Text style={s.balanceLabel}>SALDO DISPONIBLE</Text>
          <View style={s.balanceRow}>
            <Text style={s.balanceAmount}>{fmt(balance)}</Text>
            <Text style={s.balanceCurrency}>{currency}</Text>
          </View>
          <Text style={s.balanceSub}>Monedero EGCHAT · Guinea Ecuatorial</Text>

          {/* Acciones */}
          <View style={s.actions}>
            {[
              { icon: '⬇️', label: 'Recargar', onPress: () => setShowRecharge(true) },
              { icon: '⬆️', label: 'Retirar', onPress: () => setShowWithdraw(true) },
              { icon: '↗️', label: 'Enviar', onPress: () => setShowSend(true) },
              { icon: '📊', label: 'Historial', onPress: () => {} },
            ].map(a => (
              <TouchableOpacity key={a.label} style={s.actionBtn} onPress={a.onPress} activeOpacity={0.7}>
                <View style={s.actionIcon}>
                  <Text style={s.actionEmoji}>{a.icon}</Text>
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transacciones */}
        <View style={[s.section, { backgroundColor: C.bgSecondary }]}>
          <Text style={[s.sectionTitle, { color: C.textPrimary }]}>Últimas transacciones</Text>
          {transactions.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💳</Text>
              <Text style={[s.emptyText, { color: C.textSecondary }]}>Sin transacciones aún</Text>
            </View>
          ) : (
            transactions.slice(0, 20).map((tx: any, i: number) => (
              <View key={tx.id || i} style={[s.txItem, i < transactions.length - 1 && [s.txBorder, { borderBottomColor: C.borderLight }]]}>
                <View style={[s.txIcon, { backgroundColor: isCredit(tx.type) ? C.accentLight : '#2d1117' }]}>
                  <Text style={s.txEmoji}>{getTxIcon(tx.type)}</Text>
                </View>
                <View style={s.txInfo}>
                  <Text style={[s.txLabel, { color: C.textPrimary }]}>{getTxLabel(tx)}</Text>
                  <Text style={[s.txDate, { color: C.textTertiary }]}>{formatDate(tx.created_at || tx.date)}</Text>
                  {tx.reference && <Text style={[s.txRef, { color: C.textTertiary }]} numberOfLines={1}>Ref: {tx.reference}</Text>}
                </View>
                <Text style={[s.txAmount, { color: isCredit(tx.type) ? Colors.accent : '#EF4444' }]}>
                  {isCredit(tx.type) ? '+' : '-'}{fmt(tx.amount)} {currency}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <RechargeModal
        visible={showRecharge}
        balance={balance}
        onClose={() => setShowRecharge(false)}
        onSuccess={loadData}
      />
      <WithdrawModal
        visible={showWithdraw}
        balance={balance}
        onClose={() => setShowWithdraw(false)}
        onSuccess={loadData}
      />
      <SendModal
        visible={showSend}
        balance={balance}
        onClose={() => setShowSend(false)}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },

  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { ...Typography.headerTitle, color: Colors.textPrimary },

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
  balanceAmount: { fontSize: 40, fontWeight: FontWeight.extrabold, color: Colors.white, letterSpacing: -1 },
  balanceCurrency: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: 'rgba(255,255,255,0.8)', marginBottom: 6 },
  balanceSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.xl },

  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: Spacing.xs },
  actionIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: { fontSize: FontSize.xs, color: Colors.white, fontWeight: FontWeight.semibold },

  section: {
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: { ...Typography.sectionTitle, color: Colors.textPrimary, marginBottom: Spacing.md },

  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { ...Typography.subtitle, color: Colors.textSecondary },

  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  txBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  txIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  txEmoji: { fontSize: 20 },
  txInfo: { flex: 1 },
  txLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  txDate: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  txRef: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 1 },
  txAmount: { fontSize: FontSize.base, fontWeight: FontWeight.bold, textAlign: 'right' },

  // Sheet modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    maxHeight: '90%',
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { ...Typography.headerTitle, color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  sheetSub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  sheetBody: { paddingTop: Spacing.sm },

  // Method button
  methodBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  methodIcon: { fontSize: 26, width: 40, textAlign: 'center' },
  methodText: { flex: 1 },
  methodLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  methodSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  methodArrow: { fontSize: 22, color: Colors.textTertiary },

  // Quick amounts
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  quickBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  quickBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.semibold },
  quickBtnTextActive: { color: Colors.accent },

  // Field
  fieldWrap: { marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6, fontWeight: FontWeight.semibold },
  fieldInput: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },

  // Code input
  codeHint: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  codeInput: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: Spacing.lg,
  },

  // Info box
  infoBox: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Agent card
  agentCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  agentName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  agentInfo: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  primaryBtnDisabled: { backgroundColor: Colors.border },
  primaryBtnText: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.bold },
  withdrawBtn: { backgroundColor: '#7C3AED' },
  backBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  backBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
