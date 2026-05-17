import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Modal, Pressable, RefreshControl,
  TextInput, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { walletAPI } from '../../src/api';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 0 });

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

const isCredit = (type: string) =>
  ['deposit', 'recharge', 'transfer_received'].includes(type);

const getTxLabel = (tx: any) => {
  if (tx.method) return tx.method;
  const map: Record<string, string> = {
    deposit: 'Recibido',
    withdraw: 'Enviado',
    transfer_sent: 'Enviado',
    transfer_received: 'Recibido',
    recharge: 'Recarga',
  };
  return map[tx.type] || tx.type;
};

const getTxDescription = (tx: any) => {
  if (tx.description) return tx.description;
  const map: Record<string, string> = {
    deposit: 'Depósito recibido',
    withdraw: 'Pago de servicios',
    transfer_sent: 'Transferencia enviada',
    transfer_received: `Transferencia recibida${tx.from_name ? ' de ' + tx.from_name : ''}`,
    recharge: 'Código de recarga',
  };
  return map[tx.type] || '';
};

// ── Cuentas bancarias mock (igual que la web) ─────────────────────
const BANK_ACCOUNTS = [
  { id: '1', bank: 'BANGE', type: 'Corriente', balance: 45200, currency: 'XAF', logo: '🏦' },
  { id: '2', bank: 'CCEI Bank', type: 'Ahorros', balance: 80000, currency: 'XAF', logo: '🏦' },
];

// ── Sheet modal base ──────────────────────────────────────────────
const Sheet = ({
  visible, title, subtitle, onClose, children,
}: {
  visible: boolean; title: string; subtitle?: string;
  onClose: () => void; children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={sh.overlay} onPress={onClose}>
      <Pressable style={sh.sheet} onPress={() => {}}>
        <View style={sh.handle} />
        <Text style={sh.sheetTitle}>{title}</Text>
        {subtitle ? <Text style={sh.sheetSub}>{subtitle}</Text> : null}
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Campo de input ────────────────────────────────────────────────
const Field = ({
  label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; autoCapitalize?: any;
}) => (
  <View style={sh.fieldWrap}>
    <Text style={sh.fieldLabel}>{label}</Text>
    <TextInput
      style={sh.fieldInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textTertiary}
      keyboardType={keyboardType || 'default'}
      autoCapitalize={autoCapitalize || 'none'}
    />
  </View>
);

// ── Montos rápidos ────────────────────────────────────────────────
const QuickAmounts = ({
  amounts, selected, onSelect,
}: { amounts: number[]; selected: string; onSelect: (v: string) => void }) => (
  <View style={sh.quickRow}>
    {amounts.map(a => (
      <TouchableOpacity
        key={a}
        style={[sh.quickBtn, selected === String(a) && sh.quickBtnActive]}
        onPress={() => onSelect(String(a))}
        activeOpacity={0.7}
      >
        <Text style={[sh.quickBtnText, selected === String(a) && sh.quickBtnTextActive]}>
          {fmt(a)}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

// ── Modal Recibir ─────────────────────────────────────────────────
const RecibirModal = ({
  visible, balance, onClose,
}: { visible: boolean; balance: number; onClose: () => void }) => (
  <Sheet visible={visible} title="Recibir dinero" subtitle={`Saldo: ${fmt(balance)} XAF`} onClose={onClose}>
    <View style={sh.sheetBody}>
      <View style={sh.infoBox}>
        <Text style={sh.infoTitle}>Comparte tu número para recibir</Text>
        {[
          ['Método', 'Transferencia EGCHAT'],
          ['Moneda', 'XAF (Franco CFA)'],
          ['Comisión', 'Sin comisión entre usuarios'],
        ].map(([l, v]) => (
          <View key={l} style={sh.infoRow}>
            <Text style={sh.infoLabel}>{l}</Text>
            <Text style={sh.infoValue}>{v}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={sh.primaryBtn} onPress={onClose} activeOpacity={0.8}>
        <Text style={sh.primaryBtnText}>Entendido</Text>
      </TouchableOpacity>
    </View>
  </Sheet>
);

// ── Modal Pagar ───────────────────────────────────────────────────
const PagarModal = ({
  visible, balance, onClose, onSuccess,
}: { visible: boolean; balance: number; onClose: () => void; onSuccess: () => void }) => {
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
    <Sheet visible={visible} title="Pagar / Enviar" subtitle={`Disponible: ${fmt(balance)} XAF`} onClose={close}>
      <View style={sh.sheetBody}>
        <QuickAmounts amounts={[1000, 5000, 10000, 25000]} selected={amount} onSelect={setAmount} />
        <Field label="Teléfono del destinatario" value={to} onChangeText={setTo}
          placeholder="+240 222 XXX XXX" keyboardType="phone-pad" />
        <Field label="Importe (XAF)" value={amount} onChangeText={setAmount}
          placeholder="1000" keyboardType="numeric" />
        <Field label="Concepto (opcional)" value={concept} onChangeText={setConcept}
          placeholder="Pago de..." />
        <TouchableOpacity
          style={[sh.primaryBtn, (!to || !amount || loading) && sh.primaryBtnDisabled]}
          onPress={doSend}
          disabled={!to || !amount || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={sh.primaryBtnText}>Enviar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
        </TouchableOpacity>
      </View>
    </Sheet>
  );
};

// ── Modal Recarga ─────────────────────────────────────────────────
type RStep = 'menu' | 'banco' | 'codigo' | 'agente';

const RecargaModal = ({
  visible, balance, onClose, onSuccess,
}: { visible: boolean; balance: number; onClose: () => void; onSuccess: () => void }) => {
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
      close(); onSuccess();
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
      close(); onSuccess();
      Alert.alert('🎁 ¡Código canjeado!', `+${fmt(res.amount || 0)} XAF añadidos`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Código inválido o ya usado');
    } finally { setLoading(false); }
  };

  const titles: Record<RStep, string> = {
    menu: 'Recargar saldo',
    banco: 'Transferencia bancaria',
    codigo: 'Código de recarga',
    agente: 'Agente EGCHAT',
  };

  return (
    <Sheet
      visible={visible}
      title={titles[step]}
      subtitle={`Saldo actual: ${fmt(balance)} XAF`}
      onClose={close}
    >
      {step === 'menu' && (
        <View style={sh.sheetBody}>
          {[
            { icon: '🏦', label: 'Transferencia bancaria', sub: 'BANGE, BGFI, CCEI — 1-2 días', s: 'banco' as RStep },
            { icon: '🎁', label: 'Código de recarga', sub: 'Voucher prepago de 16 dígitos', s: 'codigo' as RStep },
            { icon: '🏪', label: 'Agente EGCHAT', sub: 'Depósito en efectivo — inmediato', s: 'agente' as RStep },
          ].map(m => (
            <TouchableOpacity key={m.s} style={sh.methodBtn}
              onPress={() => { setMethod(m.label); setStep(m.s); }} activeOpacity={0.7}>
              <Text style={sh.methodIcon}>{m.icon}</Text>
              <View style={sh.methodText}>
                <Text style={sh.methodLabel}>{m.label}</Text>
                <Text style={sh.methodSub}>{m.sub}</Text>
              </View>
              <Text style={sh.methodArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 'banco' && (
        <View style={sh.sheetBody}>
          <View style={sh.infoBox}>
            {[['Beneficiario','EGCHAT S.A.'],['Bancos','BANGE / CCEI / BGFI'],
              ['Cuenta','GQ-EGCHAT-001-2026'],['Concepto','Recarga + tu teléfono']].map(([l,v]) => (
              <View key={l} style={sh.infoRow}>
                <Text style={sh.infoLabel}>{l}</Text>
                <Text style={sh.infoValue}>{v}</Text>
              </View>
            ))}
          </View>
          <QuickAmounts amounts={[5000,10000,25000,50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <TouchableOpacity
            style={[sh.primaryBtn, (!amount || loading) && sh.primaryBtnDisabled]}
            onPress={doDeposit} disabled={!amount || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} />
              : <Text style={sh.primaryBtnText}>Confirmar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={sh.backBtn} onPress={() => setStep('menu')}>
            <Text style={sh.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'codigo' && (
        <View style={sh.sheetBody}>
          <Text style={sh.codeHint}>Introduce el código de 16 dígitos del voucher</Text>
          <TextInput
            style={sh.codeInput}
            value={code}
            onChangeText={v => {
              const clean = v.replace(/[^0-9A-Za-z]/g, '').slice(0, 16);
              setCode(clean.replace(/(.{4})/g, '$1-').replace(/-$/, ''));
            }}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[sh.primaryBtn, (code.replace(/-/g,'').length < 12 || loading) && sh.primaryBtnDisabled]}
            onPress={doCode} disabled={code.replace(/-/g,'').length < 12 || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} />
              : <Text style={sh.primaryBtnText}>Canjear código</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={sh.backBtn} onPress={() => setStep('menu')}>
            <Text style={sh.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'agente' && (
        <View style={sh.sheetBody}>
          {[
            { name: 'Agente Centro Malabo', addr: 'Av. de la Independencia', hours: 'L-S 8:00-20:00' },
            { name: 'Agente Caracolas', addr: 'Barrio Caracolas, Malabo', hours: 'L-D 8:00-21:00' },
            { name: 'Agente Ela Nguema', addr: 'Ela Nguema, Malabo', hours: 'L-S 8:00-19:00' },
            { name: 'Agente Bata Centro', addr: 'Centro de Bata', hours: 'L-D 8:00-21:00' },
          ].map(a => (
            <View key={a.name} style={sh.agentCard}>
              <Text style={sh.agentName}>{a.name}</Text>
              <Text style={sh.agentInfo}>📍 {a.addr}  ·  🕐 {a.hours}</Text>
            </View>
          ))}
          <QuickAmounts amounts={[5000,10000,25000,50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe a depositar (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <TouchableOpacity
            style={[sh.primaryBtn, (!amount || loading) && sh.primaryBtnDisabled]}
            onPress={doDeposit} disabled={!amount || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} />
              : <Text style={sh.primaryBtnText}>Confirmar depósito — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={sh.backBtn} onPress={() => setStep('menu')}>
            <Text style={sh.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  );
};

// ── Modal Retiro ──────────────────────────────────────────────────
type WStep = 'menu' | 'tarjeta' | 'banco' | 'agente';

const RetiroModal = ({
  visible, balance, onClose, onSuccess,
}: { visible: boolean; balance: number; onClose: () => void; onSuccess: () => void }) => {
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
      close(); onSuccess();
      Alert.alert('✅ Retiro procesado', `${fmt(n)} XAF en camino a tu cuenta`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar');
    } finally { setLoading(false); }
  };

  const titles: Record<WStep, string> = {
    menu: 'Retirar dinero', tarjeta: 'Retirar a tarjeta',
    banco: 'Transferencia bancaria', agente: 'Retirar en agente',
  };

  return (
    <Sheet visible={visible} title={titles[step]} subtitle={`Disponible: ${fmt(balance)} XAF`} onClose={close}>
      {step === 'menu' && (
        <View style={sh.sheetBody}>
          {[
            { icon: '💳', label: 'Retirar a tarjeta', sub: 'Tarjeta bancaria vinculada — 1-3 días', s: 'tarjeta' as WStep },
            { icon: '🏦', label: 'Transferencia bancaria', sub: 'A tu cuenta en GQ — 1-2 días', s: 'banco' as WStep },
            { icon: '🏪', label: 'Retirar en agente', sub: 'Efectivo inmediato en agentes EGCHAT', s: 'agente' as WStep },
          ].map(m => (
            <TouchableOpacity key={m.s} style={sh.methodBtn} onPress={() => setStep(m.s)} activeOpacity={0.7}>
              <Text style={sh.methodIcon}>{m.icon}</Text>
              <View style={sh.methodText}>
                <Text style={sh.methodLabel}>{m.label}</Text>
                <Text style={sh.methodSub}>{m.sub}</Text>
              </View>
              <Text style={sh.methodArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {step === 'tarjeta' && (
        <View style={sh.sheetBody}>
          <QuickAmounts amounts={[5000,10000,25000,50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <Field label="Número de tarjeta" value={destination} onChangeText={setDestination} placeholder="**** **** **** ****" keyboardType="numeric" />
          <TouchableOpacity
            style={[sh.primaryBtn, sh.withdrawBtn, (!amount || !destination || loading) && sh.primaryBtnDisabled]}
            onPress={() => doWithdraw('Tarjeta bancaria')} disabled={!amount || !destination || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} />
              : <Text style={sh.primaryBtnText}>Retirar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={sh.backBtn} onPress={() => setStep('menu')}>
            <Text style={sh.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'banco' && (
        <View style={sh.sheetBody}>
          <QuickAmounts amounts={[5000,10000,25000,50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <Field label="Banco" value={destination} onChangeText={setDestination} placeholder="BANGE, BGFI, CCEI..." />
          <TouchableOpacity
            style={[sh.primaryBtn, sh.withdrawBtn, (!amount || !destination || loading) && sh.primaryBtnDisabled]}
            onPress={() => doWithdraw('Transferencia bancaria')} disabled={!amount || !destination || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} />
              : <Text style={sh.primaryBtnText}>Retirar — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={sh.backBtn} onPress={() => setStep('menu')}>
            <Text style={sh.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'agente' && (
        <View style={sh.sheetBody}>
          <View style={sh.infoBox}>
            <Text style={sh.infoLabel}>Presenta tu QR en cualquier agente EGCHAT autorizado para retirar en efectivo de forma inmediata.</Text>
          </View>
          <QuickAmounts amounts={[5000,10000,25000,50000]} selected={amount} onSelect={setAmount} />
          <Field label="Importe (XAF)" value={amount} onChangeText={setAmount} placeholder="5000" keyboardType="numeric" />
          <Field label="Nombre del agente" value={destination} onChangeText={setDestination} placeholder="Agente Centro Malabo..." />
          <TouchableOpacity
            style={[sh.primaryBtn, sh.withdrawBtn, (!amount || !destination || loading) && sh.primaryBtnDisabled]}
            onPress={() => doWithdraw('Agente EGCHAT')} disabled={!amount || !destination || loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.white} />
              : <Text style={sh.primaryBtnText}>Confirmar retiro — {amount ? fmt(Number(amount)) : '0'} XAF</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={sh.backBtn} onPress={() => setStep('menu')}>
            <Text style={sh.backBtnText}>← Volver</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL — Mi Cartera
// ══════════════════════════════════════════════════════════════════
export default function MonederoScreen() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('XAF');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(false);

  const [showRecibir, setShowRecibir] = useState(false);
  const [showPagar, setShowPagar] = useState(false);
  const [showRecarga, setShowRecarga] = useState(false);
  const [showRetiro, setShowRetiro] = useState(false);

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
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      {/* ── Header gradiente ── */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <View style={s.headerLeft}>
          <View style={s.logoWrap}>
            <Image source={require('../../assets/icon.png')} style={s.logoImg} resizeMode="cover" />
          </View>
          <Text style={s.logoText}>EG</Text>
          <Text style={s.logoTextBold}>CHAT</Text>
        </View>
        <Text style={s.headerTitle}>Mi Cartera</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ── Tarjeta MONEDERO EGCHAT ── */}
        <View style={s.walletCard}>
          <Text style={s.walletCardLabel}>MONEDERO EGCHAT</Text>

          {/* Saldo oculto / revelar */}
          <TouchableOpacity
            style={s.revealBtn}
            onPress={() => setBalanceVisible(v => !v)}
            activeOpacity={0.85}
          >
            {balanceVisible ? (
              <Text style={s.revealAmount}>{fmt(balance)} <Text style={s.revealCurrency}>{currency}</Text></Text>
            ) : (
              <View style={s.revealHidden}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={s.revealHiddenText}>Toca para revelar</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={s.walletSubLabel}>Saldo disponible</Text>

          {/* Botones de acción */}
          <View style={s.actionsRow}>
            {[
              { icon: 'arrow-down-circle-outline' as const, label: 'Recibir', onPress: () => setShowRecibir(true) },
              { icon: 'card-outline' as const, label: 'Pagar', onPress: () => setShowPagar(true) },
              { icon: 'arrow-up-circle-outline' as const, label: 'Recarga', onPress: () => setShowRecarga(true) },
              { icon: 'sync-outline' as const, label: 'Retiro', onPress: () => setShowRetiro(true) },
            ].map(a => (
              <TouchableOpacity key={a.label} style={s.actionBtn} onPress={a.onPress} activeOpacity={0.75}>
                <View style={s.actionIconWrap}>
                  <Ionicons name={a.icon} size={26} color={Colors.brand} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── MIS CUENTAS ── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: C.textPrimary }]}>MIS CUENTAS</Text>
          <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={Colors.brand} />
          </TouchableOpacity>
        </View>

        <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
          {BANK_ACCOUNTS.map((acc, i) => (
            <View key={acc.id}>
              <View style={s.bankRow}>
                <View style={s.bankIconWrap}>
                  <Ionicons name="business-outline" size={22} color={Colors.brand} />
                </View>
                <View style={s.bankInfo}>
                  <Text style={[s.bankName, { color: C.textPrimary }]}>{acc.bank}</Text>
                  <Text style={[s.bankType, { color: C.textSecondary }]}>{acc.type}</Text>
                </View>
                <View style={s.bankBalanceWrap}>
                  <Text style={[s.bankBalance, { color: C.textPrimary }]}>{fmt(acc.balance)}</Text>
                  <Text style={[s.bankCurrency, { color: C.textSecondary }]}>{acc.currency}</Text>
                </View>
              </View>
              {i < BANK_ACCOUNTS.length - 1 && (
                <View style={[s.divider, { backgroundColor: C.borderLight }]} />
              )}
            </View>
          ))}
        </View>

        {/* ── HISTORIAL DE TRANSFERENCIAS ── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: C.textPrimary }]}>HISTORIAL DE TRANSFERENCIAS</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={s.verTodo}>Ver todo →</Text>
          </TouchableOpacity>
        </View>

        <View style={[s.card, { backgroundColor: C.bgSecondary }]}>
          {transactions.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>💳</Text>
              <Text style={[s.emptyText, { color: C.textSecondary }]}>Sin transacciones aún</Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((tx: any, i: number) => (
              <View key={tx.id || i}>
                <View style={s.txRow}>
                  {/* Icono dirección */}
                  <View style={[
                    s.txIconWrap,
                    { backgroundColor: isCredit(tx.type) ? '#E8F8EE' : '#FEF2F2' },
                  ]}>
                    <Ionicons
                      name={isCredit(tx.type) ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color={isCredit(tx.type) ? Colors.brand : Colors.error}
                    />
                  </View>

                  {/* Info */}
                  <View style={s.txInfo}>
                    <View style={s.txLabelRow}>
                      <Ionicons name="checkmark-circle" size={13} color={Colors.brand} style={{ marginRight: 4 }} />
                      <Text style={[s.txLabel, { color: C.textPrimary }]}>{getTxLabel(tx)}</Text>
                    </View>
                    <Text style={[s.txDesc, { color: C.textSecondary }]}>{getTxDescription(tx)}</Text>
                    <Text style={[s.txDate, { color: C.textTertiary }]}>
                      {formatDate(tx.created_at || tx.date || new Date().toISOString())}
                    </Text>
                  </View>

                  {/* Monto */}
                  <View style={s.txAmountWrap}>
                    <Text style={[
                      s.txAmount,
                      { color: isCredit(tx.type) ? Colors.brand : Colors.error },
                    ]}>
                      {isCredit(tx.type) ? '+' : '-'}{fmt(tx.amount)}
                    </Text>
                    <Text style={[s.txCurrency, { color: C.textSecondary }]}>{currency}</Text>
                  </View>
                </View>
                {i < Math.min(transactions.length, 10) - 1 && (
                  <View style={[s.divider, { backgroundColor: C.borderLight }]} />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Modales ── */}
      <RecibirModal visible={showRecibir} balance={balance} onClose={() => setShowRecibir(false)} />
      <PagarModal visible={showPagar} balance={balance} onClose={() => setShowPagar(false)} onSuccess={loadData} />
      <RecargaModal visible={showRecarga} balance={balance} onClose={() => setShowRecarga(false)} onSuccess={loadData} />
      <RetiroModal visible={showRetiro} balance={balance} onClose={() => setShowRetiro(false)} onSuccess={loadData} />
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS — Pantalla principal
// ══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoWrap: {
    width: 30, height: 30, borderRadius: 15,
    overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoImg: { width: 30, height: 30 },
  logoText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  logoTextBold: { fontSize: 17, fontWeight: '900', color: '#fff' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Tarjeta monedero
  walletCard: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#0D2B4E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  walletCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // Revelar saldo
  revealBtn: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  revealHidden: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  revealHiddenText: { fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  revealAmount: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  revealCurrency: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  walletSubLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },

  // Botones de acción
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIconWrap: {
    width: 56, height: 56,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },

  // Secciones
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  verTodo: { fontSize: 13, color: Colors.brand, fontWeight: '600' },

  // Card contenedor
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: Colors.bgSecondary,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: 16 },

  // Fila banco
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  bankIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  bankType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  bankBalanceWrap: { alignItems: 'flex-end' },
  bankBalance: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  bankCurrency: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },

  // Fila transacción
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  txIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txLabelRow: { flexDirection: 'row', alignItems: 'center' },
  txLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  txDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  txDate: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txCurrency: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});

// ══════════════════════════════════════════════════════════════════
// ESTILOS — Sheet modales
// ══════════════════════════════════════════════════════════════════
const sh = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  sheetSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  sheetBody: { paddingTop: 4 },

  // Info box
  infoBox: {
    backgroundColor: '#EFF5FD',
    borderRadius: 12, padding: 14,
    marginBottom: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#DBEAFE',
  },
  infoLabel: { fontSize: 12, color: Colors.textSecondary },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#1B3A6B' },

  // Method button
  methodBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderRadius: 14, padding: 14,
    marginBottom: 8, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  methodIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  methodText: { flex: 1 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  methodSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  methodArrow: { fontSize: 22, color: Colors.textTertiary },

  // Quick amounts
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.bgPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.accentLight, borderColor: Colors.brand },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  quickBtnTextActive: { color: Colors.brand },

  // Field
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  fieldInput: {
    backgroundColor: Colors.bgPrimary, borderRadius: 10, padding: 12,
    fontSize: 14, color: Colors.textPrimary,
    borderWidth: 1, borderColor: Colors.border,
  },

  // Code input
  codeHint: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10, textAlign: 'center' },
  codeInput: {
    backgroundColor: Colors.bgPrimary, borderRadius: 12, padding: 14,
    fontSize: 18, fontWeight: '700', color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
    textAlign: 'center', letterSpacing: 2, marginBottom: 14,
  },

  // Agent card
  agentCard: {
    backgroundColor: Colors.bgPrimary, borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  agentName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  agentInfo: { fontSize: 11, color: Colors.textSecondary, marginTop: 3 },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.brand, borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: Colors.border },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  withdrawBtn: { backgroundColor: '#EF4444' },
  backBtn: { alignItems: 'center', marginTop: 12 },
  backBtnText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
});
