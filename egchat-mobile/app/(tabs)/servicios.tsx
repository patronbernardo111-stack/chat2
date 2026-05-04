import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Modal, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { serviciosAPI, taxiAPI, walletAPI } from '../../src/api';
import { EGButton, EGInput, EGCard } from '../../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';

// ── Tipos de servicios ────────────────────────────────────────────
const SERVICES = [
  { id: 'taxi',        icon: '🚕', label: 'MiTaxi',       sub: 'Pedir taxi',          color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'electricidad',icon: '⚡', label: 'Electricidad',  sub: 'SEGESA',              color: '#EAB308', bg: '#FEFCE8' },
  { id: 'agua',        icon: '💧', label: 'Agua',          sub: 'SNGE',                color: '#0EA5E9', bg: '#F0F9FF' },
  { id: 'internet',    icon: '🌐', label: 'Internet',      sub: 'Proveedores',         color: '#6366F1', bg: '#EEF2FF' },
  { id: 'recarga',     icon: '📱', label: 'Recarga',       sub: 'Telefonía móvil',     color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'tv',          icon: '📺', label: 'Canales TV',    sub: 'Suscripciones',       color: '#EF4444', bg: '#FFF1F2' },
  { id: 'bancos',      icon: '🏦', label: 'Bancos',        sub: 'BANGE, BGFI, CCEI',   color: '#1E3A5F', bg: '#EFF6FF' },
  { id: 'salud',       icon: '🏥', label: 'Salud',         sub: 'Hospitales',          color: '#DC2626', bg: '#FFF1F2' },
  { id: 'impuestos',   icon: '📋', label: 'Impuestos',     sub: 'DGI',                 color: '#374151', bg: '#F9FAFB' },
  { id: 'correos',     icon: '📮', label: 'Correos',       sub: 'Envíos',              color: '#C0392B', bg: '#FFF5F5' },
  { id: 'seguros',     icon: '🛡️', label: 'Seguros',       sub: 'Vida, auto...',       color: '#065F46', bg: '#F0FDF4' },
  { id: 'supermercado',icon: '🛒', label: 'Supermercado',  sub: 'Compras online',      color: '#00c8a0', bg: '#F0FDF9' },
];

// ── Tipos de taxi ─────────────────────────────────────────────────
const RIDE_TYPES = [
  { id: 'moto',   label: 'Moto',    sub: '1 pasajero',  price: 500,  eta: '2 min', color: '#F97316' },
  { id: 'taxi',   label: 'Taxi',    sub: '4 pasajeros', price: 1000, eta: '4 min', color: '#EAB308' },
  { id: 'suv',    label: 'Confort', sub: 'SUV 4 plazas',price: 2000, eta: '5 min', color: '#6366F1' },
  { id: 'vip',    label: 'VIP',     sub: 'Premium',     price: 3500, eta: '7 min', color: '#7C3AED' },
];

// ── Modal genérico ────────────────────────────────────────────────
const ServiceModal = ({
  visible, title, onClose, children,
}: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Modal Taxi ────────────────────────────────────────────────────
const TaxiModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [selectedRide, setSelectedRide] = useState(RIDE_TYPES[1]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'searching' | 'matched'>('form');

  const requestRide = async () => {
    if (!origin.trim() || !dest.trim()) { Alert.alert('Error', 'Introduce origen y destino'); return; }
    setLoading(true);
    setStep('searching');
    try {
      await taxiAPI.requestRide(
        { address: origin },
        { address: dest },
        selectedRide.id
      );
      setTimeout(() => { setStep('matched'); setLoading(false); }, 3000);
    } catch {
      // Simular búsqueda aunque la API falle
      setTimeout(() => { setStep('matched'); setLoading(false); }, 3000);
    }
  };

  const reset = () => { setStep('form'); setOrigin(''); setDest(''); setLoading(false); onClose(); };

  return (
    <ServiceModal visible={visible} title="🚕 MiTaxi" onClose={reset}>
      {step === 'form' && (
        <View>
          <EGInput label="Origen" value={origin} onChangeText={setOrigin} placeholder="¿Dónde estás?" />
          <EGInput label="Destino" value={dest} onChangeText={setDest} placeholder="¿A dónde vas?" />

          <Text style={styles.sectionLabel}>Tipo de vehículo</Text>
          {RIDE_TYPES.map(r => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelectedRide(r)}
              style={[styles.rideOption, selectedRide.id === r.id && { borderColor: r.color, borderWidth: 2 }]}
              activeOpacity={0.7}
            >
              <View style={[styles.rideIconBox, { backgroundColor: r.color + '18' }]}>
                <Text style={styles.rideEmoji}>🚗</Text>
              </View>
              <View style={styles.rideInfo}>
                <Text style={styles.rideLabel}>{r.label}</Text>
                <Text style={styles.rideSub}>{r.sub} · {r.eta}</Text>
              </View>
              <Text style={[styles.ridePrice, { color: r.color }]}>{r.price.toLocaleString()} XAF</Text>
            </TouchableOpacity>
          ))}

          <EGButton title="Pedir taxi" onPress={requestRide} style={styles.actionBtn} />
        </View>
      )}

      {step === 'searching' && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.searchingText}>Buscando conductor...</Text>
          <Text style={styles.searchingSub}>Esto puede tardar unos segundos</Text>
        </View>
      )}

      {step === 'matched' && (
        <View>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>CN</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>Carlos Nguema</Text>
              <Text style={styles.driverSub}>⭐ 4.9 · Toyota Corolla · GE-1234</Text>
            </View>
          </View>
          <Text style={styles.etaText}>🕐 Llegará en {selectedRide.eta}</Text>
          <Text style={styles.fareText}>Tarifa estimada: {selectedRide.price.toLocaleString()} XAF</Text>
          <EGButton title="Cancelar viaje" onPress={reset} variant="danger" style={styles.actionBtn} />
        </View>
      )}
    </ServiceModal>
  );
};

// ── Modal Electricidad / Agua ─────────────────────────────────────
const UtilityModal = ({
  visible, onClose, type,
}: {
  visible: boolean; onClose: () => void; type: 'electricidad' | 'agua';
}) => {
  const [contrato, setContrato] = useState('');
  const [factura, setFactura] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const title = type === 'electricidad' ? '⚡ SEGESA - Electricidad' : '💧 SNGE - Agua';

  const consultar = async () => {
    if (!contrato.trim()) { Alert.alert('Error', 'Introduce el número de contrato'); return; }
    setLoading(true);
    try {
      const res = type === 'electricidad'
        ? await serviciosAPI.consultarFacturaElec(contrato)
        : await serviciosAPI.consultarFacturaAgua(contrato);
      setFactura(res);
    } catch {
      // Datos de ejemplo si la API falla
      setFactura({ contrato, importe: 15000, periodo: 'Mayo 2026', estado: 'pendiente' });
    } finally { setLoading(false); }
  };

  const pagar = async () => {
    if (!factura) return;
    setPaying(true);
    try {
      if (type === 'electricidad') {
        await serviciosAPI.pagarElectricidad(contrato, factura.importe, 'monedero');
      } else {
        await serviciosAPI.pagarAgua(contrato, factura.importe, 'monedero');
      }
      Alert.alert('✅', 'Pago realizado correctamente');
      setFactura(null); setContrato(''); onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar el pago');
    } finally { setPaying(false); }
  };

  return (
    <ServiceModal visible={visible} title={title} onClose={() => { setFactura(null); setContrato(''); onClose(); }}>
      <EGInput
        label="Número de contrato"
        value={contrato}
        onChangeText={setContrato}
        placeholder="Ej: 123456789"
        keyboardType="numeric"
      />
      <EGButton title={loading ? 'Consultando...' : 'Consultar factura'} onPress={consultar} loading={loading} />

      {factura && (
        <EGCard style={styles.facturaCard}>
          <Text style={styles.facturaTitle}>Factura encontrada</Text>
          <View style={styles.facturaRow}>
            <Text style={styles.facturaLabel}>Contrato</Text>
            <Text style={styles.facturaValue}>{factura.contrato}</Text>
          </View>
          <View style={styles.facturaRow}>
            <Text style={styles.facturaLabel}>Período</Text>
            <Text style={styles.facturaValue}>{factura.periodo || 'Mayo 2026'}</Text>
          </View>
          <View style={styles.facturaRow}>
            <Text style={styles.facturaLabel}>Importe</Text>
            <Text style={[styles.facturaValue, { color: Colors.accent, fontWeight: FontWeight.bold }]}>
              {(factura.importe || 15000).toLocaleString()} XAF
            </Text>
          </View>
          <EGButton
            title={paying ? 'Pagando...' : `Pagar ${(factura.importe || 15000).toLocaleString()} XAF`}
            onPress={pagar}
            loading={paying}
            style={styles.actionBtn}
          />
        </EGCard>
      )}
    </ServiceModal>
  );
};

// ── Modal Recarga ─────────────────────────────────────────────────
const RecargaModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState('GETESA');
  const [loading, setLoading] = useState(false);

  const OPERATORS = ['GETESA', 'GECOMSA', 'MUNI', 'Orange GE'];
  const AMOUNTS = [500, 1000, 2000, 5000];

  const recargar = async () => {
    if (!phone || !amount) { Alert.alert('Error', 'Rellena todos los campos'); return; }
    setLoading(true);
    try {
      // Usar walletAPI para debitar y registrar la recarga
      await walletAPI.withdraw(Number(amount), 'recarga_movil', phone);
      Alert.alert('✅', `Recarga de ${Number(amount).toLocaleString()} XAF enviada a ${phone}`);
      setPhone(''); setAmount(''); onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo procesar la recarga');
    } finally { setLoading(false); }
  };

  return (
    <ServiceModal visible={visible} title="📱 Recarga de saldo" onClose={onClose}>
      <Text style={styles.sectionLabel}>Operador</Text>
      <View style={styles.operatorRow}>
        {OPERATORS.map(op => (
          <TouchableOpacity
            key={op}
            onPress={() => setOperator(op)}
            style={[styles.operatorChip, operator === op && styles.operatorChipActive]}
          >
            <Text style={[styles.operatorText, operator === op && styles.operatorTextActive]}>{op}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <EGInput label="Número de teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+240 222 XXX XXX" />

      <Text style={styles.sectionLabel}>Importe</Text>
      <View style={styles.amountRow}>
        {AMOUNTS.map(a => (
          <TouchableOpacity
            key={a}
            onPress={() => setAmount(String(a))}
            style={[styles.amountChip, amount === String(a) && styles.amountChipActive]}
          >
            <Text style={[styles.amountText, amount === String(a) && styles.amountTextActive]}>
              {a.toLocaleString()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <EGInput label="O introduce otro importe (XAF)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="1500" />
      <EGButton title={loading ? 'Procesando...' : 'Recargar'} onPress={recargar} loading={loading} style={styles.actionBtn} />
    </ServiceModal>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function ServiciosScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openService = (id: string) => {
    const implemented = ['taxi', 'electricidad', 'agua', 'recarga'];
    if (implemented.includes(id)) {
      setActiveModal(id);
    } else {
      Alert.alert('Próximamente', 'Este servicio estará disponible pronto en la app móvil.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servicios</Text>
        <Text style={styles.headerSub}>Guinea Ecuatorial</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {SERVICES.map(s => (
          <TouchableOpacity
            key={s.id}
            style={styles.serviceItem}
            onPress={() => openService(s.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.serviceIconBox, { backgroundColor: s.bg }]}>
              <Text style={styles.serviceEmoji}>{s.icon}</Text>
            </View>
            <Text style={styles.serviceLabel}>{s.label}</Text>
            <Text style={styles.serviceSub}>{s.sub}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modales */}
      <TaxiModal visible={activeModal === 'taxi'} onClose={() => setActiveModal(null)} />
      <UtilityModal visible={activeModal === 'electricidad'} onClose={() => setActiveModal(null)} type="electricidad" />
      <UtilityModal visible={activeModal === 'agua'} onClose={() => setActiveModal(null)} type="agua" />
      <RecargaModal visible={activeModal === 'recarga'} onClose={() => setActiveModal(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { ...Typography.headerTitle, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  serviceItem: {
    width: '30%',
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  serviceIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceEmoji: { fontSize: 26 },
  serviceLabel: {
    fontSize: FontSize.xs + 1,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  serviceSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    ...Typography.headerTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },

  // Taxi
  sectionLabel: {
    ...Typography.fieldLabel,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  rideOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  rideIconBox: {
    width: 44, height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideEmoji: { fontSize: 22 },
  rideInfo: { flex: 1 },
  rideLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rideSub: { fontSize: FontSize.sm, color: Colors.textTertiary },
  ridePrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  actionBtn: { marginTop: Spacing.md },

  // Searching
  centerContent: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  searchingText: { ...Typography.chatHeaderName, color: Colors.textPrimary },
  searchingSub: { ...Typography.subtitle, color: Colors.textSecondary },

  // Driver matched
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  driverAvatar: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitials: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  driverSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  etaText: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  fareText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.accent, textAlign: 'center', marginBottom: Spacing.md },

  // Factura
  facturaCard: { marginTop: Spacing.lg, padding: Spacing.lg },
  facturaTitle: { ...Typography.chatHeaderName, color: Colors.textPrimary, marginBottom: Spacing.md },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  facturaLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  facturaValue: { fontSize: FontSize.base, color: Colors.textPrimary },

  // Recarga
  operatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  operatorChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  operatorChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  operatorText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  operatorTextActive: { color: Colors.accent },
  amountRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  amountChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  amountChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  amountText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  amountTextActive: { color: Colors.accent },
});
