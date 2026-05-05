// WalletModals.tsx — Modales del monedero para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Modal, StyleSheet, SafeAreaView, Linking,
} from 'react-native';

// ── Tipos ─────────────────────────────────────────────────────────
type RStep = 'menu' | 'banco' | 'transferencia' | 'codigo' | 'efectivo' | 'confirm' | 'success';
type WStep = 'menu' | 'tarjeta' | 'banco' | 'agente' | 'confirm' | 'success';

// ── Componentes auxiliares ────────────────────────────────────────
const SectionHead = ({ title, sub, color }: { title: string; sub: string; color: string }) => (
  <View style={[styles.sectionHead, { backgroundColor: color }]}>
    <Text style={styles.sectionHeadTitle}>{title}</Text>
    <Text style={styles.sectionHeadSub}>{sub}</Text>
  </View>
);

const Field = ({
  label, value, onChangeText, keyboardType = 'default', placeholder,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; placeholder?: string;
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.fieldInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder || label}
      placeholderTextColor="#9CA3AF"
      keyboardType={keyboardType}
    />
  </View>
);

// ══════════════════════════════════════════════════════════════════
// MODAL RECARGA
// ══════════════════════════════════════════════════════════════════
interface RecargaProps {
  visible: boolean;
  onClose: () => void;
  userBalance: number;
  onCredit: (n: number) => void;
}

export const RecargaMonederoModal: React.FC<RecargaProps> = ({ visible, onClose, userBalance, onCredit }) => {
  const [step, setStep] = useState<RStep>('menu');
  const [amount, setAmount] = useState('');
  const [banco, setBanco] = useState('');
  const [codigo, setCodigo] = useState('');

  const amountNum = parseInt(amount || '0');
  const isValid = amountNum >= 1000;

  const METODOS = [
    { id: 'banco', label: '🏦 Desde banco', sub: 'Transferencia bancaria desde tu cuenta' },
    { id: 'transferencia', label: '↔️ Transferencia EGCHAT', sub: 'Recibe de otro usuario EGCHAT' },
    { id: 'codigo', label: '🎟️ Código de recarga', sub: 'Introduce un código de recarga prepago' },
    { id: 'efectivo', label: '💵 Depósito en efectivo', sub: 'En agentes autorizados EGCHAT' },
  ];

  const TITLES: Record<RStep, string> = {
    menu: 'Recargar monedero', banco: 'Desde banco', transferencia: 'Transferencia EGCHAT',
    codigo: 'Código de recarga', efectivo: 'Depósito en efectivo',
    confirm: 'Confirmar recarga', success: '¡Recarga completada!',
  };

  const reset = () => { setStep('menu'); setAmount(''); setBanco(''); setCodigo(''); };
  const close = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={step === 'menu' ? close : () => setStep('menu')}>
            <Text style={styles.backBtn}>{step === 'menu' ? '✕' : '← Atrás'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.modalTitle}>{TITLES[step]}</Text>
            <Text style={styles.modalSub}>Saldo: {userBalance.toLocaleString()} XAF</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {step === 'menu' && (
            <>
              <SectionHead title="Monedero EGCHAT" sub={`${userBalance.toLocaleString()} XAF disponibles`} color="#1A3A6B" />
              {METODOS.map(m => (
                <TouchableOpacity key={m.id} style={styles.menuItem} onPress={() => setStep(m.id as RStep)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemLabel}>{m.label}</Text>
                    <Text style={styles.menuItemSub}>{m.sub}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 'banco' && (
            <>
              <SectionHead title="Transferencia bancaria" sub="Datos para realizar el ingreso" color="#1B3A6B" />
              <View style={styles.infoBox}>
                {[['Beneficiario', 'EGCHAT S.A.'], ['Banco', 'BANGE / CCEI / BGFI'], ['Cuenta', 'GQ-EGCHAT-001-2026'], ['Concepto', 'Recarga EGCHAT + tu teléfono']].map(([l, v]) => (
                  <View key={l} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{l}</Text>
                    <Text style={styles.infoValue}>{v}</Text>
                  </View>
                ))}
              </View>
              <Field label="Importe (mín. 1,000 XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <TouchableOpacity
                style={[styles.btnPrimary, (!isValid || !banco) && styles.btnDisabled]}
                onPress={() => { if (isValid && banco) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>Confirmar {isValid ? `- ${amountNum.toLocaleString()} XAF` : ''}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'codigo' && (
            <>
              <SectionHead title="Código de recarga" sub="Canjea tu voucher prepago" color="#92400E" />
              <Field label="Código de 16 dígitos" value={codigo} onChangeText={setCodigo} placeholder="XXXX-XXXX-XXXX-XXXX" />
              <View style={styles.denominaciones}>
                {[1000, 2000, 5000, 10000, 25000, 50000].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.denom, amount === String(v) && styles.denomSelected]}
                    onPress={() => setAmount(String(v))}
                  >
                    <Text style={[styles.denomText, amount === String(v) && styles.denomTextSelected]}>
                      {v.toLocaleString()}
                    </Text>
                    <Text style={styles.denomXAF}>XAF</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.btnPrimary, codigo.replace(/-/g, '').length < 16 && styles.btnDisabled]}
                onPress={() => {
                  if (codigo.replace(/-/g, '').length >= 16) {
                    onCredit(parseInt(amount || '5000'));
                    setStep('success');
                  }
                }}
              >
                <Text style={styles.btnPrimaryText}>Canjear código</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'efectivo' && (
            <>
              <SectionHead title="Depósito en efectivo" sub="Agentes autorizados EGCHAT" color="#4C1D95" />
              {[
                { nombre: 'Agente EGCHAT Centro', dir: 'Av. de la Independencia, Malabo', tel: '+240222300001' },
                { nombre: 'Agente EGCHAT Caracolas', dir: 'Barrio Caracolas, Malabo', tel: '+240222300002' },
                { nombre: 'Agente EGCHAT Ela Nguema', dir: 'Ela Nguema, Malabo', tel: '+240222300003' },
                { nombre: 'Agente EGCHAT Bata', dir: 'Centro de Bata', tel: '+240222300004' },
              ].map(a => (
                <View key={a.nombre} style={styles.agentItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{a.nombre}</Text>
                    <Text style={styles.agentDir}>📍 {a.dir}</Text>
                  </View>
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${a.tel}`)}>
                    <Text style={styles.callBtnText}>📞 Llamar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {step === 'confirm' && (
            <>
              <SectionHead title="Confirmar recarga" sub="Revisa los datos antes de continuar" color="#1B3A6B" />
              <View style={styles.confirmBox}>
                {[['Método', 'Transferencia bancaria'], ['Importe', `${amountNum.toLocaleString()} XAF`]].map(([l, v]) => (
                  <View key={l} style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>{l}</Text>
                    <Text style={styles.confirmValue}>{v}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => setStep('success')}>
                <Text style={styles.btnPrimaryText}>He realizado la transferencia</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={styles.successWrap}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>¡Operación completada!</Text>
              <Text style={styles.successSub}>Se acreditará en breve.</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={close}>
                <Text style={styles.btnPrimaryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════
// MODAL RETIRO
// ══════════════════════════════════════════════════════════════════
interface RetiroProps {
  visible: boolean;
  onClose: () => void;
  userBalance: number;
  onDebit: (n: number) => void;
}

export const RetiroMonederoModal: React.FC<RetiroProps> = ({ visible, onClose, userBalance, onDebit }) => {
  const [step, setStep] = useState<WStep>('menu');
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [pin, setPin] = useState('');
  const [banco, setBanco] = useState('');
  const [cuenta, setCuenta] = useState('');

  const amountNum = parseInt(amount || '0');
  const isValid = amountNum >= 1000 && amountNum <= userBalance;

  const METODOS = [
    { id: 'tarjeta', label: '💳 Retirar a tarjeta', sub: 'Tarjeta bancaria vinculada · 1-3 días' },
    { id: 'banco', label: '🏦 Transferencia bancaria', sub: 'A tu cuenta bancaria en GQ · 1-2 días' },
    { id: 'agente', label: '🏠 Retirar en agente', sub: 'Efectivo inmediato en agentes EGCHAT' },
  ];

  const TITLES: Record<WStep, string> = {
    menu: 'Retirar dinero', tarjeta: 'Retirar a tarjeta', banco: 'Transferencia bancaria',
    agente: 'Retirar en agente', confirm: 'Confirmar retiro', success: '¡Retiro procesado!',
  };

  const reset = () => { setStep('menu'); setAmount(''); setCardNumber(''); setPin(''); setBanco(''); setCuenta(''); };
  const close = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={step === 'menu' ? close : () => setStep('menu')}>
            <Text style={styles.backBtn}>{step === 'menu' ? '✕' : '← Atrás'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.modalTitle}>{TITLES[step]}</Text>
            <Text style={styles.modalSub}>Disponible: {userBalance.toLocaleString()} XAF</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

          {step === 'menu' && (
            <>
              <SectionHead title="Retirar dinero" sub={`${userBalance.toLocaleString()} XAF disponibles`} color="#4C1D95" />
              {METODOS.map(m => (
                <TouchableOpacity key={m.id} style={styles.menuItem} onPress={() => setStep(m.id as WStep)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuItemLabel}>{m.label}</Text>
                    <Text style={styles.menuItemSub}>{m.sub}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 'tarjeta' && (
            <>
              <SectionHead title="Retirar a tarjeta" sub="Transferencia a tarjeta bancaria" color="#1B3A6B" />
              <Field label="Importe a retirar (mín. 1,000 XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <Field label="Últimos 4 dígitos de la tarjeta" value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" />
              <Field label="PIN de confirmación" value={pin} onChangeText={setPin} keyboardType="numeric" />
              {amountNum > userBalance && amountNum > 0 && (
                <Text style={styles.errorText}>⚠️ Saldo insuficiente</Text>
              )}
              <TouchableOpacity
                style={[styles.btnPrimary, (!isValid || !cardNumber || !pin) && styles.btnDisabled]}
                onPress={() => { if (isValid && cardNumber && pin) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>Continuar {isValid ? `- ${amountNum.toLocaleString()} XAF` : ''}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'banco' && (
            <>
              <SectionHead title="Transferencia bancaria" sub="A tu cuenta bancaria en GQ" color="#065F46" />
              <Field label="Importe a retirar (mín. 1,000 XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <Field label="Banco destino" value={banco} onChangeText={setBanco} />
              <Field label="Número de cuenta bancaria" value={cuenta} onChangeText={setCuenta} />
              <TouchableOpacity
                style={[styles.btnPrimary, (!isValid || !banco || !cuenta) && styles.btnDisabled]}
                onPress={() => { if (isValid && banco && cuenta) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>Continuar {isValid ? `- ${amountNum.toLocaleString()} XAF` : ''}</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'agente' && (
            <>
              <SectionHead title="Retirar en agente" sub="Efectivo inmediato" color="#4C1D95" />
              <Field label="Importe a retirar (mín. 1,000 XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              {[
                { nombre: 'Agente EGCHAT Centro', dir: 'Av. de la Independencia, Malabo', tel: '+240222300001' },
                { nombre: 'Agente EGCHAT Caracolas', dir: 'Barrio Caracolas, Malabo', tel: '+240222300002' },
              ].map(a => (
                <View key={a.nombre} style={styles.agentItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agentName}>{a.nombre}</Text>
                    <Text style={styles.agentDir}>📍 {a.dir}</Text>
                  </View>
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${a.tel}`)}>
                    <Text style={styles.callBtnText}>📞 Llamar</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.btnPrimary, !isValid && styles.btnDisabled]}
                onPress={() => { if (isValid) setStep('confirm'); }}
              >
                <Text style={styles.btnPrimaryText}>Generar código de retiro</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'confirm' && (
            <>
              <SectionHead title="Confirmar retiro" sub="Revisa los datos antes de continuar" color="#4C1D95" />
              <View style={styles.confirmBox}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Importe</Text>
                  <Text style={styles.confirmValue}>{amountNum.toLocaleString()} XAF</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Saldo restante</Text>
                  <Text style={styles.confirmValue}>{(userBalance - amountNum).toLocaleString()} XAF</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => { onDebit(amountNum); setStep('success'); }}>
                <Text style={styles.btnPrimaryText}>Confirmar retiro</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'success' && (
            <View style={styles.successWrap}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successTitle}>¡Retiro procesado!</Text>
              <Text style={styles.successSub}>Tu dinero está en camino.</Text>
              <TouchableOpacity style={styles.btnPrimary} onPress={close}>
                <Text style={styles.btnPrimaryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  backBtn: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  sectionHead: {
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  sectionHeadTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  sectionHeadSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5',
  },
  menuItemLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  menuItemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  chevron: { fontSize: 20, color: '#D1D5DB' },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  fieldInput: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  infoBox: {
    backgroundColor: '#EFF5FD', borderRadius: 12, padding: 14,
    marginBottom: 14, borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#DBEAFE',
  },
  infoLabel: { fontSize: 11, color: '#6B7280' },
  infoValue: { fontSize: 11, fontWeight: '700', color: '#1B3A6B' },
  denominaciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  denom: {
    width: '30%', backgroundColor: '#fff', borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#F0F2F5',
  },
  denomSelected: { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
  denomText: { fontSize: 12, fontWeight: '800', color: '#111827' },
  denomTextSelected: { color: '#92400E' },
  denomXAF: { fontSize: 9, color: '#9CA3AF' },
  agentItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 13,
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F2F5',
  },
  agentName: { fontSize: 12, fontWeight: '700', color: '#111827' },
  agentDir: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  callBtn: { backgroundColor: '#F5F3FF', borderRadius: 8, padding: 8 },
  callBtnText: { fontSize: 11, fontWeight: '700', color: '#4C1D95' },
  confirmBox: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#F0F2F5',
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  confirmLabel: { fontSize: 12, color: '#6B7280' },
  confirmValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
  successWrap: { alignItems: 'center', padding: 30, gap: 12 },
  successIcon: { fontSize: 60 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  successSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  btnPrimary: {
    backgroundColor: '#00c8a0', borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#E5E7EB' },
  btnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  errorText: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
});
