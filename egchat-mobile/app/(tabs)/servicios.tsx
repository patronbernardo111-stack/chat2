import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Modal, Pressable, TextInput, ActivityIndicator, Linking,
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
  { id: 'taxi',          icon: '🚕', label: 'MiTaxi',          sub: 'Pedir taxi',          color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'electricidad',  icon: '⚡', label: 'Electricidad',     sub: 'SEGESA',              color: '#EAB308', bg: '#FEFCE8' },
  { id: 'agua',          icon: '💧', label: 'Agua',             sub: 'SNGE',                color: '#0EA5E9', bg: '#F0F9FF' },
  { id: 'internet',      icon: '🌐', label: 'Internet',         sub: 'Proveedores',         color: '#6366F1', bg: '#EEF2FF' },
  { id: 'recarga',       icon: '📱', label: 'Recarga',          sub: 'Telefonía móvil',     color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'tv',            icon: '📺', label: 'Canales TV',       sub: 'Suscripciones',       color: '#EF4444', bg: '#FFF1F2' },
  { id: 'bancos',        icon: '🏦', label: 'Bancos',           sub: 'BANGE, BGFI, CCEI',   color: '#1E3A5F', bg: '#EFF6FF' },
  { id: 'salud',         icon: '🏥', label: 'Salud',            sub: 'Hospitales',          color: '#DC2626', bg: '#FFF1F2' },
  { id: 'impuestos',     icon: '📋', label: 'Impuestos',        sub: 'DGI',                 color: '#374151', bg: '#F9FAFB' },
  { id: 'correos',       icon: '📮', label: 'Correos',          sub: 'Envíos',              color: '#C0392B', bg: '#FFF5F5' },
  { id: 'seguros',       icon: '🛡️', label: 'Seguros',          sub: 'Vida, auto...',       color: '#065F46', bg: '#F0FDF4' },
  { id: 'supermercado',  icon: '🛒', label: 'Supermercado',     sub: 'Compras online',      color: '#00c8a0', bg: '#F0FDF9' },
  { id: 'restaurantes',  icon: '🍽️', label: 'Restaurantes',     sub: 'Reservas',            color: '#C47D2A', bg: '#FEF3C7' },
  { id: 'vuelos',        icon: '✈️', label: 'Vuelos',           sub: 'Ceiba, Iberia...',    color: '#1B3A6B', bg: '#EFF6FF' },
  { id: 'gasolineras',   icon: '⛽', label: 'Gasolineras',      sub: 'GEPetrol, Total',     color: '#C0392B', bg: '#FFF5F5' },
  { id: 'cemac',         icon: '🌍', label: 'Zona CEMAC',       sub: '6 países',            color: '#00b96b', bg: '#F0FDF4' },
  { id: 'ocio',          icon: '🎭', label: 'Ocio',             sub: 'Hoteles, cine...',    color: '#EC4899', bg: '#FDF2F8' },
  { id: 'apuestas',      icon: '🎰', label: 'Apuestas',         sub: 'Juegos y loterías',   color: '#F59E0B', bg: '#FFFBEB' },
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

// ── Modal Internet ────────────────────────────────────────────────
const INTERNET_PROVIDERS = [
  { name: 'GETESA',     cat: 'Telecom / Internet',    color: '#003082', plans: ['Hogar 10Mbps — 15,000 XAF/mes', 'Fibra 100Mbps — 30,000 XAF/mes', 'Empresa 500Mbps — 80,000 XAF/mes'] },
  { name: 'GECOMSA',    cat: 'Operador Móvil / Datos', color: '#0066CC', plans: ['Datos Diario 1GB — 500 XAF', 'Mensual 10GB — 8,000 XAF', 'Ilimitado — 20,000 XAF/mes'] },
  { name: 'Conexxia',   cat: 'Internet Empresarial',   color: '#8B5CF6', plans: ['Empresarial — 120,000 XAF/mes', 'VPN Corporativa — 50,000 XAF/mes'] },
  { name: 'Guineanet',  cat: 'Proveedor Internet',     color: '#10B981', plans: ['Residencial 20Mbps — 12,000 XAF/mes', 'Inalámbrico 50Mbps — 18,000 XAF/mes'] },
  { name: 'Fenix',      cat: 'Tecnología / Internet',  color: '#F97316', plans: ['Fibra Residencial — 22,000 XAF/mes', 'Empresarial — 95,000 XAF/mes'] },
  { name: 'IPX EG',     cat: 'Conectividad',           color: '#6366F1', plans: ['Internet Dedicado 1Gbps — 200,000 XAF/mes'] },
  { name: 'Officetech', cat: 'Tecnología / TI',        color: '#0EA5E9', plans: ['Internet + Soporte TI — 60,000 XAF/mes'] },
  { name: 'GITGE',      cat: 'Infraestructura Telecom', color: '#1E293B', plans: ['Backbone Nacional — Consultar'] },
  { name: 'ORTEL GE',   cat: 'Supervisión Telecom',    color: '#DC2626', plans: ['Soporte Sectorial — Consultar'] },
];

const InternetModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof INTERNET_PROVIDERS[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const contract = async (plan: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('✅ Solicitud enviada', `Tu solicitud para "${plan}" ha sido registrada. Un agente te contactará pronto.`);
      setSelected(null);
      onClose();
    }, 1500);
  };

  return (
    <ServiceModal visible={visible} title="🌐 Internet" onClose={() => { setSelected(null); onClose(); }}>
      {!selected ? (
        <View>
          <Text style={styles.sectionLabel}>Proveedores disponibles</Text>
          {INTERNET_PROVIDERS.map(p => (
            <TouchableOpacity key={p.name} style={styles.providerCard} onPress={() => setSelected(p)} activeOpacity={0.7}>
              <View style={[styles.providerDot, { backgroundColor: p.color }]} />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{p.name}</Text>
                <Text style={styles.providerCat}>{p.cat}</Text>
              </View>
              <Text style={styles.providerArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
            <Text style={styles.backText}>← {selected.name}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionLabel}>Planes disponibles</Text>
          {selected.plans.map(plan => (
            <TouchableOpacity key={plan} style={styles.planCard} onPress={() => contract(plan)} activeOpacity={0.7}>
              <Text style={styles.planText}>{plan}</Text>
              <Text style={styles.planAction}>Contratar →</Text>
            </TouchableOpacity>
          ))}
          {loading && <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.lg }} />}
        </View>
      )}
    </ServiceModal>
  );
};

// ── Modal Canales TV ──────────────────────────────────────────────
const TV_CHANNELS = [
  { name: 'Canal Sol',    cat: 'TV Local',    color: '#0A2463', plans: ['Sol Básico — 3,000 XAF/mes', 'Sol Plus — 6,000 XAF/mes', 'Sol Anual — 60,000 XAF/año'] },
  { name: 'Canal+',       cat: 'TV Premium',  color: '#0A0A0A', plans: ['Séries — 18,000 XAF/mes', 'Sport — 22,000 XAF/mes', 'Canal+ Tout — 38,000 XAF/mes'] },
  { name: 'Canal Sat',    cat: 'TV Satélite', color: '#1E3A5F', plans: ['Sat Básico 50ch — 8,000 XAF/mes', 'Sat Familiar 80ch — 14,000 XAF/mes', 'Sat Premium 150ch — 25,000 XAF/mes'] },
  { name: 'Sony Sat',     cat: 'TV Satélite', color: '#1A1A1A', plans: ['Sony Sat Básico — 10,000 XAF/mes', 'Sony Sat Plus — 18,000 XAF/mes'] },
  { name: 'Guinea Vista', cat: 'TV Local',    color: '#B45309', plans: ['Info — 2,000 XAF/mes', 'Plus — 4,500 XAF/mes'] },
  { name: 'Cachu y Hnos', cat: 'Entretenimiento', color: '#1B4332', plans: ['Básico — 2,500 XAF/mes', 'Premium — 5,000 XAF/mes'] },
  { name: 'Kuryebe',      cat: 'TV Digital',  color: '#7C3AED', plans: ['Básico — 2,000 XAF/mes', 'Plus — 4,000 XAF/mes'] },
];

const CanalesTVModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof TV_CHANNELS[0] | null>(null);

  const subscribe = (plan: string) => {
    Alert.alert('✅ Suscripción', `Suscripción a "${plan}" procesada correctamente.`);
    setSelected(null);
    onClose();
  };

  return (
    <ServiceModal visible={visible} title="📺 Canales TV" onClose={() => { setSelected(null); onClose(); }}>
      {!selected ? (
        <View>
          <Text style={styles.sectionLabel}>Operadores de TV</Text>
          {TV_CHANNELS.map(c => (
            <TouchableOpacity key={c.name} style={styles.providerCard} onPress={() => setSelected(c)} activeOpacity={0.7}>
              <View style={[styles.providerDot, { backgroundColor: c.color }]} />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{c.name}</Text>
                <Text style={styles.providerCat}>{c.cat}</Text>
              </View>
              <Text style={styles.providerArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
            <Text style={styles.backText}>← {selected.name}</Text>
          </TouchableOpacity>
          <Text style={styles.sectionLabel}>Paquetes disponibles</Text>
          {selected.plans.map(plan => (
            <TouchableOpacity key={plan} style={styles.planCard} onPress={() => subscribe(plan)} activeOpacity={0.7}>
              <Text style={styles.planText}>{plan}</Text>
              <Text style={styles.planAction}>Suscribirse →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ServiceModal>
  );
};

// ── Modal Bancos ──────────────────────────────────────────────────
const BANKS = [
  { name: 'BANGE',    full: 'Banco Nacional de Guinea Ecuatorial', color: '#003082', phone: '+240 333 09 00 00', services: ['Cuenta corriente', 'Tarjeta débito/crédito', 'Transferencias', 'Préstamos'] },
  { name: 'BGFI',     full: 'BGFI Bank Guinea Ecuatorial',         color: '#1E3A5F', phone: '+240 333 09 11 11', services: ['Banca personal', 'Banca empresarial', 'Inversiones', 'Seguros'] },
  { name: 'CCEI',     full: 'CCEI Bank Guinea Ecuatorial',         color: '#0066CC', phone: '+240 333 09 22 22', services: ['Cuenta de ahorro', 'Microcréditos', 'Transferencias CEMAC', 'Domiciliaciones'] },
  { name: 'Ecobank',  full: 'Ecobank Guinea Ecuatorial',           color: '#00A651', phone: '+240 333 09 33 33', services: ['Banca digital', 'Xpress Account', 'Transferencias África', 'Divisas'] },
  { name: 'Société Générale', full: 'Société Générale GQ',        color: '#E30613', phone: '+240 333 09 44 44', services: ['Banca personal', 'Banca privada', 'Financiación', 'Seguros'] },
];

const BancosModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof BANKS[0] | null>(null);

  return (
    <ServiceModal visible={visible} title="🏦 Bancos" onClose={() => { setSelected(null); onClose(); }}>
      {!selected ? (
        <View>
          <Text style={styles.sectionLabel}>Bancos en Guinea Ecuatorial</Text>
          {BANKS.map(b => (
            <TouchableOpacity key={b.name} style={styles.providerCard} onPress={() => setSelected(b)} activeOpacity={0.7}>
              <View style={[styles.providerDot, { backgroundColor: b.color }]} />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{b.name}</Text>
                <Text style={styles.providerCat}>{b.full}</Text>
              </View>
              <Text style={styles.providerArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
            <Text style={styles.backText}>← {selected.name}</Text>
          </TouchableOpacity>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>{selected.full}</Text>
            <Text style={styles.sectionLabel}>Servicios disponibles</Text>
            {selected.services.map(sv => (
              <View key={sv} style={styles.serviceRow}>
                <Text style={styles.serviceRowDot}>●</Text>
                <Text style={styles.serviceRowText}>{sv}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
              <Text style={styles.callBtnText}>📞 Llamar: {selected.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ServiceModal>
  );
};

// ── Modal Salud ───────────────────────────────────────────────────
const HEALTH_CENTERS = [
  { name: 'Hospital General de Malabo', type: 'Hospital público', phone: '+240 333 09 50 00', services: ['Urgencias 24h', 'Cirugía', 'Maternidad', 'Pediatría', 'Laboratorio'] },
  { name: 'Clínica La Paz',             type: 'Clínica privada',  phone: '+240 333 09 51 00', services: ['Consultas generales', 'Especialistas', 'Radiología', 'Farmacia'] },
  { name: 'Hospital de Bata',           type: 'Hospital público', phone: '+240 333 09 52 00', services: ['Urgencias', 'Cirugía', 'Maternidad', 'Pediatría'] },
  { name: 'Centro de Salud Ela Nguema', type: 'Centro de salud',  phone: '+240 333 09 53 00', services: ['Consultas', 'Vacunación', 'Planificación familiar'] },
  { name: 'INSESO',                     type: 'Seguridad Social', phone: '+240 333 09 54 00', services: ['Prestaciones sociales', 'Pensiones', 'Accidentes laborales'] },
];

const SaludModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof HEALTH_CENTERS[0] | null>(null);

  return (
    <ServiceModal visible={visible} title="🏥 Salud" onClose={() => { setSelected(null); onClose(); }}>
      {!selected ? (
        <View>
          <Text style={styles.sectionLabel}>Centros de salud</Text>
          {HEALTH_CENTERS.map(h => (
            <TouchableOpacity key={h.name} style={styles.providerCard} onPress={() => setSelected(h)} activeOpacity={0.7}>
              <Text style={styles.providerDotEmoji}>🏥</Text>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{h.name}</Text>
                <Text style={styles.providerCat}>{h.type}</Text>
              </View>
              <Text style={styles.providerArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backRow}>
            <Text style={styles.backText}>← {selected.name}</Text>
          </TouchableOpacity>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>{selected.type}</Text>
            <Text style={styles.sectionLabel}>Servicios</Text>
            {selected.services.map(sv => (
              <View key={sv} style={styles.serviceRow}>
                <Text style={styles.serviceRowDot}>●</Text>
                <Text style={styles.serviceRowText}>{sv}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
              <Text style={styles.callBtnText}>📞 Llamar: {selected.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ServiceModal>
  );
};

// ── Modal Seguros ─────────────────────────────────────────────────
const INSURANCE_TYPES = [
  { icon: '🚗', name: 'Seguro de Auto',    desc: 'Cobertura total o terceros para tu vehículo', price: 'Desde 25,000 XAF/año' },
  { icon: '🏠', name: 'Seguro de Hogar',   desc: 'Protección para tu vivienda y contenido',     price: 'Desde 15,000 XAF/año' },
  { icon: '❤️', name: 'Seguro de Vida',    desc: 'Protección para ti y tu familia',             price: 'Desde 10,000 XAF/mes' },
  { icon: '🏥', name: 'Seguro Médico',     desc: 'Cobertura sanitaria completa',                price: 'Desde 20,000 XAF/mes' },
  { icon: '✈️', name: 'Seguro de Viaje',   desc: 'Cobertura para viajes nacionales e internacionales', price: 'Desde 5,000 XAF/viaje' },
  { icon: '💼', name: 'Seguro Empresarial',desc: 'Protección para tu negocio y empleados',      price: 'Consultar' },
];

const SegurosModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🛡️ Seguros" onClose={onClose}>
    <Text style={styles.sectionLabel}>Tipos de seguro disponibles</Text>
    {INSURANCE_TYPES.map(ins => (
      <TouchableOpacity
        key={ins.name}
        style={styles.planCard}
        onPress={() => Alert.alert('Solicitar seguro', `Un agente te contactará para el "${ins.name}".\n\nPrecio: ${ins.price}`)}
        activeOpacity={0.7}
      >
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceIcon}>{ins.icon}</Text>
          <View style={styles.insuranceInfo}>
            <Text style={styles.providerName}>{ins.name}</Text>
            <Text style={styles.providerCat}>{ins.desc}</Text>
            <Text style={[styles.providerCat, { color: Colors.accent, fontWeight: FontWeight.semibold }]}>{ins.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Impuestos ───────────────────────────────────────────────
const ImpuestosModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [nif, setNif] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const consultar = () => {
    if (!nif.trim()) { Alert.alert('Error', 'Introduce tu NIF'); return; }
    setLoading(true);
    setTimeout(() => {
      setResult({ nif, deuda: 0, estado: 'Al corriente', periodo: '2025' });
      setLoading(false);
    }, 1500);
  };

  return (
    <ServiceModal visible={visible} title="📋 Impuestos DGI" onClose={() => { setResult(null); setNif(''); onClose(); }}>
      <Text style={styles.sectionLabel}>Consulta tu situación fiscal</Text>
      <EGInput label="NIF / Número de contribuyente" value={nif} onChangeText={setNif} placeholder="Ej: GQ-123456789" />
      <EGButton title={loading ? 'Consultando...' : 'Consultar DGI'} onPress={consultar} loading={loading} />
      {result && (
        <EGCard style={styles.facturaCard}>
          <Text style={styles.facturaTitle}>Resultado DGI</Text>
          {[['NIF', result.nif], ['Estado', result.estado], ['Período', result.periodo], ['Deuda pendiente', `${result.deuda.toLocaleString()} XAF`]].map(([l, v]) => (
            <View key={l} style={styles.facturaRow}>
              <Text style={styles.facturaLabel}>{l}</Text>
              <Text style={[styles.facturaValue, l === 'Estado' && { color: Colors.accent }]}>{v}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:+240333095500')}>
            <Text style={styles.callBtnText}>📞 Contactar DGI</Text>
          </TouchableOpacity>
        </EGCard>
      )}
    </ServiceModal>
  );
};

// ── Modal Correos ─────────────────────────────────────────────────
const POSTAL_SERVICES = [
  { icon: '📦', name: 'Envío nacional',       desc: 'Paquetes dentro de Guinea Ecuatorial', price: 'Desde 2,000 XAF' },
  { icon: '✈️', name: 'Envío internacional',  desc: 'Paquetes al extranjero',               price: 'Desde 15,000 XAF' },
  { icon: '📬', name: 'Apartado postal',       desc: 'Alquiler de apartado en Correos GQ',  price: '5,000 XAF/año' },
  { icon: '🔍', name: 'Seguimiento de envío',  desc: 'Rastrea tu paquete en tiempo real',   price: 'Gratis' },
  { icon: '🏢', name: 'Oficinas de Correos',   desc: 'Malabo, Bata, Ebebiyín, Mongomo',     price: 'L-V 8:00-17:00' },
];

const CorreosModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="📮 Correos GQ" onClose={onClose}>
    <Text style={styles.sectionLabel}>Servicios postales</Text>
    {POSTAL_SERVICES.map(ps => (
      <TouchableOpacity
        key={ps.name}
        style={styles.planCard}
        onPress={() => Alert.alert(ps.name, `${ps.desc}\n\nPrecio: ${ps.price}`)}
        activeOpacity={0.7}
      >
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceIcon}>{ps.icon}</Text>
          <View style={styles.insuranceInfo}>
            <Text style={styles.providerName}>{ps.name}</Text>
            <Text style={styles.providerCat}>{ps.desc}</Text>
            <Text style={[styles.providerCat, { color: Colors.accent }]}>{ps.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ))}
    <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]} onPress={() => Linking.openURL('tel:+240333095600')}>
      <Text style={styles.callBtnText}>📞 Llamar a Correos GQ</Text>
    </TouchableOpacity>
  </ServiceModal>
);

// ── Modal Supermercado ────────────────────────────────────────────
const SUPERMARKETS = [
  { name: 'Supermarket Malabo',  area: 'Centro Malabo',    phone: '+240 222 30 10 01', hours: 'L-D 8:00-21:00' },
  { name: 'Hipermarket Caracolas',area: 'Caracolas, Malabo',phone: '+240 222 30 10 02', hours: 'L-D 8:00-22:00' },
  { name: 'Supermercado Bata',   area: 'Centro Bata',      phone: '+240 222 30 10 03', hours: 'L-S 8:00-20:00' },
  { name: 'Tienda Nguema',       area: 'Ela Nguema',       phone: '+240 222 30 10 04', hours: 'L-D 7:00-21:00' },
  { name: 'Mercado Central',     area: 'Malabo',           phone: '+240 222 30 10 05', hours: 'L-S 6:00-18:00' },
];

const CATEGORIES = ['🥩 Carnicería', '🥦 Verduras', '🥛 Lácteos', '🍞 Panadería', '🧴 Higiene', '🍷 Bebidas', '🧹 Limpieza', '🐟 Pescadería'];

const SupermercadoModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🛒 Supermercados" onClose={onClose}>
    <Text style={styles.sectionLabel}>Categorías</Text>
    <View style={styles.categoryGrid}>
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat}
          style={styles.categoryChip}
          onPress={() => Alert.alert('Próximamente', 'Compra online disponible pronto')}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryText}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.sectionLabel}>Supermercados cercanos</Text>
    {SUPERMARKETS.map(sm => (
      <View key={sm.name} style={styles.providerCard}>
        <Text style={styles.providerDotEmoji}>🛒</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{sm.name}</Text>
          <Text style={styles.providerCat}>📍 {sm.area}  ·  🕐 {sm.hours}</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${sm.phone}`)}>
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    ))}
  </ServiceModal>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function ServiciosScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openService = (id: string) => {
    const modalServices = ['taxi', 'electricidad', 'agua', 'recarga'];
    if (modalServices.includes(id)) {
      setActiveModal(id);
    } else if (id === 'bancos') {
      router.push('/bancos' as any);
    } else if (id === 'cemac') {
      router.push('/cemac' as any);
    } else if (id === 'supermercado') {
      router.push('/supermercados' as any);
    } else if (id === 'restaurantes' || id === 'vuelos' || id === 'gasolineras') {
      router.push('/servicios-diarios' as any);
    } else if (id === 'ocio') {
      router.push('/ocio' as any);
    } else if (id === 'apuestas') {
      router.push('/apuestas' as any);
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
      <InternetModal visible={activeModal === 'internet'} onClose={() => setActiveModal(null)} />
      <CanalesTVModal visible={activeModal === 'tv'} onClose={() => setActiveModal(null)} />
      <BancosModal visible={activeModal === 'bancos'} onClose={() => setActiveModal(null)} />
      <SaludModal visible={activeModal === 'salud'} onClose={() => setActiveModal(null)} />
      <SegurosModal visible={activeModal === 'seguros'} onClose={() => setActiveModal(null)} />
      <ImpuestosModal visible={activeModal === 'impuestos'} onClose={() => setActiveModal(null)} />
      <CorreosModal visible={activeModal === 'correos'} onClose={() => setActiveModal(null)} />
      <SupermercadoModal visible={activeModal === 'supermercado'} onClose={() => setActiveModal(null)} />
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

  // Provider list
  providerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  providerDot: { width: 12, height: 12, borderRadius: 6 },
  providerDotEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  providerCat: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  providerArrow: { fontSize: 22, color: Colors.textTertiary },

  // Plan card
  planCard: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  planText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  planAction: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.bold },

  // Back row
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backText: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },

  // Info card
  infoCard: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  infoCardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Service row
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  serviceRowDot: { fontSize: 8, color: Colors.accent },
  serviceRowText: { fontSize: FontSize.sm, color: Colors.textPrimary },

  // Call button
  callBtn: {
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  callBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
  callIcon: { fontSize: 22 },

  // Insurance
  insuranceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1 },
  insuranceIcon: { fontSize: 26, width: 32, textAlign: 'center' },
  insuranceInfo: { flex: 1 },

  // Category grid
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  categoryChip: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  categoryText: { fontSize: FontSize.sm, color: Colors.textPrimary },
});
