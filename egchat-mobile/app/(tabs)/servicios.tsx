import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Modal, Pressable, TextInput, ActivityIndicator, Linking, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { serviciosAPI, taxiAPI, walletAPI, authAPI } from '../../src/api';
import { EGButton, EGInput, EGCard } from '../../src/components/ui';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import { ServiceIcon } from '../../src/components/ServiceIcon';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Secciones de servicios — iconos y colores idénticos a la web ──
const SERVICE_SECTIONS = [
  {
    id: 'basicos',
    title: 'Básicos',
    services: [
      { id: 'recarga',      svgIcon: 'recharge',      label: 'Recarga Tel.',  color: '#07C160' },
      { id: 'internet',     svgIcon: 'world',         label: 'Internet',      color: '#1485EE' },
      { id: 'tv',           svgIcon: 'services',      label: 'Canales',       color: '#8B5CF6' },
    ],
  },
  {
    id: 'financieros',
    title: 'Servicios Financieros',
    services: [
      { id: 'bancos',       svgIcon: 'banking',       label: 'Bancos',        color: '#1485EE' },
      { id: 'seguros',      svgIcon: 'seguros',       label: 'Seguros',       color: '#2E9E6B' },
      { id: 'facturas',     svgIcon: 'factura',       label: 'Facturas',      color: '#C47D2A' },
      { id: 'inversion',    svgIcon: 'invest',        label: 'Inversión',     color: '#6B5BD6' },
      { id: 'tarjetas',     svgIcon: 'tarjeta',       label: 'Tarjetas',      color: '#C0392B' },
      { id: 'historial',    svgIcon: 'historial',     label: 'Historial',     color: '#5A7090' },
    ],
  },
  {
    id: 'publicos',
    title: 'Servicios Públicos',
    services: [
      { id: 'electricidad', svgIcon: 'electricidad',  label: 'Electricidad',  color: '#C47D2A' },
      { id: 'agua',         svgIcon: 'rain',          label: 'Agua',          color: '#1485EE' },
      { id: 'salud',        svgIcon: 'salud',         label: 'Salud',         color: '#C0392B' },
      { id: 'educacion',    svgIcon: 'edu',           label: 'Educación',     color: '#6B5BD6' },
      { id: 'correos',      svgIcon: 'mensajes',      label: 'Correos',       color: '#C47D2A' },
      { id: 'impuestos',    svgIcon: 'gobierno',      label: 'Impuestos',     color: '#C0392B' },
    ],
  },
  {
    id: 'diarios',
    title: 'Servicios Diarios',
    services: [
      { id: 'supermercado', svgIcon: 'comercio',      label: 'Supermercado',  color: '#2E9E6B' },
      { id: 'comida',       svgIcon: 'money',         label: 'Comida',        color: '#C0392B' },
      { id: 'restaurantes', svgIcon: 'restaurante',   label: 'Restaurante',   color: '#C47D2A' },
      { id: 'hotel',        svgIcon: 'hotel',         label: 'Hotel',         color: '#1485EE' },
      { id: 'vuelos',       svgIcon: 'vuelos',        label: 'Vuelos',        color: '#6B5BD6' },
      { id: 'gasolineras',  svgIcon: 'gasolinera',    label: 'Gasolinera',    color: '#C47D2A' },
      { id: 'tienda',       svgIcon: 'tienda',        label: 'Tienda',        color: '#2E9E6B' },
      { id: 'lavanderia',   svgIcon: 'lavanderia',    label: 'Lavandería',    color: '#1485EE' },
      { id: 'belleza',      svgIcon: 'belleza',       label: 'Belleza',       color: '#C0392B' },
      { id: 'noticias',     svgIcon: 'noticias',      label: 'Noticias',      color: '#6B5BD6' },
    ],
  },
  {
    id: 'herramientas',
    title: 'Herramientas',
    services: [
      { id: 'id_digital',   svgIcon: 'id-card',       label: 'ID Digital',    color: '#6B5BD6' },
      { id: 'lia',          svgIcon: 'ai',            label: 'Lia-25',        color: '#1485EE' },
      { id: 'actividad',    svgIcon: 'historial',     label: 'Actividad',     color: '#0E7FA8' },
      { id: 'emergencias',  svgIcon: 'emergencia',    label: 'Emergencia',    color: '#C0392B' },
      { id: 'ajustes',      svgIcon: 'ajustes',       label: 'Ajustes',       color: '#5A7090' },
    ],
  },
];

// ── Tipos de taxi ─────────────────────────────────────────────────
const RIDE_TYPES = [
  { id: 'moto',  label: 'Moto',    sub: '1 pasajero',   price: 500,  eta: '2 min', color: '#F97316' },
  { id: 'taxi',  label: 'Taxi',    sub: '4 pasajeros',  price: 1000, eta: '4 min', color: '#EAB308' },
  { id: 'suv',   label: 'Confort', sub: 'SUV 4 plazas', price: 2000, eta: '5 min', color: '#6366F1' },
  { id: 'vip',   label: 'VIP',     sub: 'Premium',      price: 3500, eta: '7 min', color: '#7C3AED' },
];

// ── Modal genérico (bottom sheet) ─────────────────────────────────
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
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
    setLoading(true); setStep('searching');
    try { await taxiAPI.requestRide({ address: origin }, { address: dest }, selectedRide.id); } catch {}
    setTimeout(() => { setStep('matched'); setLoading(false); }, 3000);
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
            <TouchableOpacity key={r.id} onPress={() => setSelectedRide(r)}
              style={[styles.rideOption, selectedRide.id === r.id && { borderColor: r.color, borderWidth: 2 }]}
              activeOpacity={0.7}>
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
            <View style={styles.driverAvatar}><Text style={styles.driverInitials}>CN</Text></View>
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
const UtilityModal = ({ visible, onClose, type }: { visible: boolean; onClose: () => void; type: 'electricidad' | 'agua' }) => {
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
    } catch { setFactura({ contrato, importe: 15000, periodo: 'Mayo 2026', estado: 'pendiente' }); }
    finally { setLoading(false); }
  };

  const pagar = async () => {
    if (!factura) return;
    setPaying(true);
    try {
      if (type === 'electricidad') await serviciosAPI.pagarElectricidad(contrato, factura.importe, 'monedero');
      else await serviciosAPI.pagarAgua(contrato, factura.importe, 'monedero');
      Alert.alert('✅', 'Pago realizado correctamente');
      setFactura(null); setContrato(''); onClose();
    } catch (e: any) { Alert.alert('Error', e.message || 'No se pudo procesar el pago'); }
    finally { setPaying(false); }
  };

  return (
    <ServiceModal visible={visible} title={title} onClose={() => { setFactura(null); setContrato(''); onClose(); }}>
      <EGInput label="Número de contrato" value={contrato} onChangeText={setContrato} placeholder="Ej: 123456789" keyboardType="numeric" />
      <EGButton title={loading ? 'Consultando...' : 'Consultar factura'} onPress={consultar} loading={loading} />
      {factura && (
        <EGCard style={styles.facturaCard}>
          <Text style={styles.facturaTitle}>Factura encontrada</Text>
          {[['Contrato', factura.contrato], ['Período', factura.periodo || 'Mayo 2026'], ['Importe', `${(factura.importe || 15000).toLocaleString()} XAF`]].map(([l, v]) => (
            <View key={l} style={styles.facturaRow}>
              <Text style={styles.facturaLabel}>{l}</Text>
              <Text style={[styles.facturaValue, l === 'Importe' && { color: Colors.accent, fontWeight: FontWeight.bold }]}>{v}</Text>
            </View>
          ))}
          <EGButton title={paying ? 'Pagando...' : `Pagar ${(factura.importe || 15000).toLocaleString()} XAF`} onPress={pagar} loading={paying} style={styles.actionBtn} />
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
      await walletAPI.withdraw(Number(amount), 'recarga_movil', phone);
      Alert.alert('✅', `Recarga de ${Number(amount).toLocaleString()} XAF enviada a ${phone}`);
      setPhone(''); setAmount(''); onClose();
    } catch (e: any) { Alert.alert('Error', e.message || 'No se pudo procesar la recarga'); }
    finally { setLoading(false); }
  };

  return (
    <ServiceModal visible={visible} title="📱 Recarga de saldo" onClose={onClose}>
      <Text style={styles.sectionLabel}>Operador</Text>
      <View style={styles.operatorRow}>
        {OPERATORS.map(op => (
          <TouchableOpacity key={op} onPress={() => setOperator(op)}
            style={[styles.operatorChip, operator === op && styles.operatorChipActive]}>
            <Text style={[styles.operatorText, operator === op && styles.operatorTextActive]}>{op}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <EGInput label="Número de teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+240 222 XXX XXX" />
      <Text style={styles.sectionLabel}>Importe</Text>
      <View style={styles.amountRow}>
        {AMOUNTS.map(a => (
          <TouchableOpacity key={a} onPress={() => setAmount(String(a))}
            style={[styles.amountChip, amount === String(a) && styles.amountChipActive]}>
            <Text style={[styles.amountText, amount === String(a) && styles.amountTextActive]}>{a.toLocaleString()}</Text>
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
  { name: 'GETESA',     cat: 'Telecom / Internet',     color: '#003082', plans: ['Hogar 10Mbps — 15,000 XAF/mes', 'Fibra 100Mbps — 30,000 XAF/mes', 'Empresa 500Mbps — 80,000 XAF/mes'] },
  { name: 'GECOMSA',    cat: 'Operador Móvil / Datos', color: '#0066CC', plans: ['Datos Diario 1GB — 500 XAF', 'Mensual 10GB — 8,000 XAF', 'Ilimitado — 20,000 XAF/mes'] },
  { name: 'Conexxia',   cat: 'Internet Empresarial',   color: '#8B5CF6', plans: ['Empresarial — 120,000 XAF/mes', 'VPN Corporativa — 50,000 XAF/mes'] },
  { name: 'Guineanet',  cat: 'Proveedor Internet',     color: '#10B981', plans: ['Residencial 20Mbps — 12,000 XAF/mes', 'Inalámbrico 50Mbps — 18,000 XAF/mes'] },
  { name: 'Fenix',      cat: 'Tecnología / Internet',  color: '#F97316', plans: ['Fibra Residencial — 22,000 XAF/mes', 'Empresarial — 95,000 XAF/mes'] },
  { name: 'IPX EG',     cat: 'Conectividad',           color: '#6366F1', plans: ['Internet Dedicado 1Gbps — 200,000 XAF/mes'] },
  { name: 'Officetech', cat: 'Tecnología / TI',        color: '#0EA5E9', plans: ['Internet + Soporte TI — 60,000 XAF/mes'] },
];

const InternetModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof INTERNET_PROVIDERS[0] | null>(null);
  const [loading, setLoading] = useState(false);

  const contract = (plan: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('✅ Solicitud enviada', `Tu solicitud para "${plan}" ha sido registrada. Un agente te contactará pronto.`);
      setSelected(null); onClose();
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
  { name: 'Canal Sol',    cat: 'TV Local',         color: '#0A2463', plans: ['Sol Básico — 3,000 XAF/mes', 'Sol Plus — 6,000 XAF/mes', 'Sol Anual — 60,000 XAF/año'] },
  { name: 'Canal+',       cat: 'TV Premium',       color: '#0A0A0A', plans: ['Séries — 18,000 XAF/mes', 'Sport — 22,000 XAF/mes', 'Canal+ Tout — 38,000 XAF/mes'] },
  { name: 'Canal Sat',    cat: 'TV Satélite',      color: '#1E3A5F', plans: ['Sat Básico 50ch — 8,000 XAF/mes', 'Sat Familiar 80ch — 14,000 XAF/mes', 'Sat Premium 150ch — 25,000 XAF/mes'] },
  { name: 'Sony Sat',     cat: 'TV Satélite',      color: '#1A1A1A', plans: ['Sony Sat Básico — 10,000 XAF/mes', 'Sony Sat Plus — 18,000 XAF/mes'] },
  { name: 'Guinea Vista', cat: 'TV Local',         color: '#B45309', plans: ['Info — 2,000 XAF/mes', 'Plus — 4,500 XAF/mes'] },
  { name: 'Cachu y Hnos', cat: 'Entretenimiento', color: '#1B4332', plans: ['Básico — 2,500 XAF/mes', 'Premium — 5,000 XAF/mes'] },
  { name: 'Kuryebe',      cat: 'TV Digital',       color: '#7C3AED', plans: ['Básico — 2,000 XAF/mes', 'Plus — 4,000 XAF/mes'] },
];

const CanalesTVModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof TV_CHANNELS[0] | null>(null);

  const subscribe = (plan: string) => {
    Alert.alert('✅ Suscripción', `Suscripción a "${plan}" procesada correctamente.`);
    setSelected(null); onClose();
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
  { name: 'BANGE',            full: 'Banco Nacional de Guinea Ecuatorial', color: '#003082', phone: '+240 333 09 00 00', services: ['Cuenta corriente', 'Tarjeta débito/crédito', 'Transferencias', 'Préstamos'] },
  { name: 'BGFI',             full: 'BGFI Bank Guinea Ecuatorial',         color: '#1E3A5F', phone: '+240 333 09 11 11', services: ['Banca personal', 'Banca empresarial', 'Inversiones', 'Seguros'] },
  { name: 'CCEI',             full: 'CCEI Bank Guinea Ecuatorial',         color: '#0066CC', phone: '+240 333 09 22 22', services: ['Cuenta de ahorro', 'Microcréditos', 'Transferencias CEMAC', 'Domiciliaciones'] },
  { name: 'Ecobank',          full: 'Ecobank Guinea Ecuatorial',           color: '#00A651', phone: '+240 333 09 33 33', services: ['Banca digital', 'Xpress Account', 'Transferencias África', 'Divisas'] },
  { name: 'Société Générale', full: 'Société Générale GQ',                color: '#E30613', phone: '+240 333 09 44 44', services: ['Banca personal', 'Banca privada', 'Financiación', 'Seguros'] },
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

// ── Modal Seguros ─────────────────────────────────────────────────
const INSURANCE_TYPES = [
  { icon: '🚗', name: 'Seguro de Auto',     desc: 'Cobertura total o terceros para tu vehículo',       price: 'Desde 25,000 XAF/año' },
  { icon: '🏠', name: 'Seguro de Hogar',    desc: 'Protección para tu vivienda y contenido',           price: 'Desde 15,000 XAF/año' },
  { icon: '❤️', name: 'Seguro de Vida',     desc: 'Protección para ti y tu familia',                   price: 'Desde 10,000 XAF/mes' },
  { icon: '🏥', name: 'Seguro Médico',      desc: 'Cobertura sanitaria completa',                      price: 'Desde 20,000 XAF/mes' },
  { icon: '✈️', name: 'Seguro de Viaje',    desc: 'Cobertura para viajes nacionales e internacionales', price: 'Desde 5,000 XAF/viaje' },
  { icon: '💼', name: 'Seguro Empresarial', desc: 'Protección para tu negocio y empleados',            price: 'Consultar' },
];

const SegurosModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🛡️ Seguros" onClose={onClose}>
    <Text style={styles.sectionLabel}>Tipos de seguro disponibles</Text>
    {INSURANCE_TYPES.map(ins => (
      <TouchableOpacity key={ins.name} style={styles.planCard}
        onPress={() => Alert.alert('Solicitar seguro', `Un agente te contactará para el "${ins.name}".\n\nPrecio: ${ins.price}`)}
        activeOpacity={0.7}>
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

// ── Modal Facturas ────────────────────────────────────────────────
const FacturasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [contrato, setContrato] = useState('');
  const [tipo, setTipo] = useState<'electricidad' | 'agua' | 'internet'>('electricidad');
  const [factura, setFactura] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const TIPOS = [
    { id: 'electricidad', label: '⚡ Luz' },
    { id: 'agua',         label: '💧 Agua' },
    { id: 'internet',     label: '🌐 Internet' },
  ] as const;

  const consultar = async () => {
    if (!contrato.trim()) { Alert.alert('Error', 'Introduce el número de contrato'); return; }
    setLoading(true);
    setTimeout(() => {
      setFactura({ contrato, importe: tipo === 'electricidad' ? 15000 : tipo === 'agua' ? 8000 : 20000, periodo: 'Mayo 2026', estado: 'pendiente' });
      setLoading(false);
    }, 1200);
  };

  return (
    <ServiceModal visible={visible} title="🧾 Facturas" onClose={() => { setFactura(null); setContrato(''); onClose(); }}>
      <Text style={styles.sectionLabel}>Tipo de servicio</Text>
      <View style={styles.operatorRow}>
        {TIPOS.map(t => (
          <TouchableOpacity key={t.id} onPress={() => { setTipo(t.id); setFactura(null); }}
            style={[styles.operatorChip, tipo === t.id && styles.operatorChipActive]}>
            <Text style={[styles.operatorText, tipo === t.id && styles.operatorTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <EGInput label="Número de contrato" value={contrato} onChangeText={setContrato} placeholder="Ej: 123456789" keyboardType="numeric" />
      <EGButton title={loading ? 'Consultando...' : 'Consultar factura'} onPress={consultar} loading={loading} />
      {factura && (
        <EGCard style={styles.facturaCard}>
          <Text style={styles.facturaTitle}>Factura encontrada</Text>
          {[['Contrato', factura.contrato], ['Período', factura.periodo], ['Importe', `${factura.importe.toLocaleString()} XAF`]].map(([l, v]) => (
            <View key={l} style={styles.facturaRow}>
              <Text style={styles.facturaLabel}>{l}</Text>
              <Text style={[styles.facturaValue, l === 'Importe' && { color: Colors.accent, fontWeight: FontWeight.bold }]}>{v}</Text>
            </View>
          ))}
          <EGButton title={`Pagar ${factura.importe.toLocaleString()} XAF`}
            onPress={() => { Alert.alert('✅', 'Pago realizado correctamente'); setFactura(null); setContrato(''); onClose(); }}
            style={styles.actionBtn} />
        </EGCard>
      )}
    </ServiceModal>
  );
};

// ── Modal Inversión ───────────────────────────────────────────────
const INVESTMENTS = [
  { icon: '📈', name: 'Fondos de inversión', desc: 'Diversifica tu cartera con fondos locales', return: '+8-12% anual' },
  { icon: '🏠', name: 'Inversión inmobiliaria', desc: 'Propiedades en Malabo y Bata', return: '+15% anual' },
  { icon: '🌍', name: 'Bonos CEMAC', desc: 'Deuda pública de la zona CEMAC', return: '+5-7% anual' },
  { icon: '💰', name: 'Depósito a plazo fijo', desc: 'Ahorro garantizado en bancos locales', return: '+3-5% anual' },
  { icon: '⛽', name: 'Sector energético', desc: 'Participación en proyectos de GEPetrol', return: 'Consultar' },
];

const InversionModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="📈 Inversión" onClose={onClose}>
    <Text style={styles.sectionLabel}>Oportunidades de inversión</Text>
    {INVESTMENTS.map(inv => (
      <TouchableOpacity key={inv.name} style={styles.planCard}
        onPress={() => Alert.alert(inv.name, `${inv.desc}\n\nRetorno estimado: ${inv.return}\n\nUn asesor financiero te contactará.`)}
        activeOpacity={0.7}>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceIcon}>{inv.icon}</Text>
          <View style={styles.insuranceInfo}>
            <Text style={styles.providerName}>{inv.name}</Text>
            <Text style={styles.providerCat}>{inv.desc}</Text>
            <Text style={[styles.providerCat, { color: '#22c55e', fontWeight: FontWeight.semibold }]}>{inv.return}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Tarjetas ────────────────────────────────────────────────
const TarjetasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="💳 Tarjetas" onClose={onClose}>
    <Text style={styles.sectionLabel}>Gestión de tarjetas</Text>
    {[
      { icon: '💳', name: 'Tarjeta de débito EGCHAT', desc: 'Vinculada a tu monedero digital', action: 'Solicitar' },
      { icon: '💎', name: 'Tarjeta de crédito', desc: 'Crédito hasta 500,000 XAF', action: 'Solicitar' },
      { icon: '🔒', name: 'Bloquear tarjeta', desc: 'Bloquea temporalmente tu tarjeta', action: 'Gestionar' },
      { icon: '📊', name: 'Límites de gasto', desc: 'Configura tus límites diarios', action: 'Configurar' },
      { icon: '🌍', name: 'Pagos internacionales', desc: 'Activa pagos fuera de Guinea Ecuatorial', action: 'Activar' },
    ].map(item => (
      <TouchableOpacity key={item.name} style={styles.planCard}
        onPress={() => Alert.alert(item.name, item.desc)}
        activeOpacity={0.7}>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceIcon}>{item.icon}</Text>
          <View style={styles.insuranceInfo}>
            <Text style={styles.providerName}>{item.name}</Text>
            <Text style={styles.providerCat}>{item.desc}</Text>
          </View>
          <Text style={styles.planAction}>{item.action} →</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Historial ───────────────────────────────────────────────
const HistorialModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const MOCK_HISTORY = [
    { icon: '⚡', desc: 'Pago SEGESA',         amount: '-15,000 XAF', date: '15 May 2026', color: '#EAB308' },
    { icon: '📱', desc: 'Recarga GETESA',       amount: '-2,000 XAF',  date: '14 May 2026', color: '#8B5CF6' },
    { icon: '💧', desc: 'Pago SNGE Agua',       amount: '-8,000 XAF',  date: '12 May 2026', color: '#0EA5E9' },
    { icon: '🚕', desc: 'MiTaxi - Centro',      amount: '-1,000 XAF',  date: '10 May 2026', color: '#F59E0B' },
    { icon: '💰', desc: 'Recarga monedero',     amount: '+50,000 XAF', date: '08 May 2026', color: '#22c55e' },
    { icon: '🌐', desc: 'Internet GECOMSA',     amount: '-8,000 XAF',  date: '05 May 2026', color: '#6366F1' },
  ];

  return (
    <ServiceModal visible={visible} title="🕐 Historial" onClose={onClose}>
      <Text style={styles.sectionLabel}>Últimas transacciones</Text>
      {MOCK_HISTORY.map((h, i) => (
        <View key={i} style={[styles.providerCard, { justifyContent: 'space-between' }]}>
          <View style={[styles.rideIconBox, { backgroundColor: h.color + '20', width: 40, height: 40 }]}>
            <Text style={{ fontSize: 18 }}>{h.icon}</Text>
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{h.desc}</Text>
            <Text style={styles.providerCat}>{h.date}</Text>
          </View>
          <Text style={[styles.providerName, { color: h.amount.startsWith('+') ? '#22c55e' : Colors.textPrimary }]}>{h.amount}</Text>
        </View>
      ))}
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

// ── Modal Educación ───────────────────────────────────────────────
const EDUCATION = [
  { icon: '🏫', name: 'Colegios públicos',       desc: 'Red de colegios del Estado',                  phone: '+240 333 09 60 00' },
  { icon: '🏛️', name: 'UNGE',                    desc: 'Universidad Nacional de Guinea Ecuatorial',   phone: '+240 333 09 61 00' },
  { icon: '📚', name: 'Biblioteca Nacional',      desc: 'Recursos educativos y culturales',            phone: '+240 333 09 62 00' },
  { icon: '🎓', name: 'Becas y ayudas',           desc: 'Programas de becas del Ministerio',           phone: '+240 333 09 63 00' },
  { icon: '💻', name: 'Formación profesional',    desc: 'Centros de FP y capacitación técnica',        phone: '+240 333 09 64 00' },
  { icon: '🌍', name: 'Educación internacional',  desc: 'Convenios con universidades extranjeras',     phone: '+240 333 09 65 00' },
];

const EducacionModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🎓 Educación" onClose={onClose}>
    <Text style={styles.sectionLabel}>Centros y servicios educativos</Text>
    {EDUCATION.map(e => (
      <TouchableOpacity key={e.name} style={styles.providerCard}
        onPress={() => Alert.alert(e.name, e.desc + '\n\nTeléfono: ' + e.phone, [
          { text: 'Cerrar', style: 'cancel' },
          { text: '📞 Llamar', onPress: () => Linking.openURL(`tel:${e.phone}`) },
        ])}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{e.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{e.name}</Text>
          <Text style={styles.providerCat}>{e.desc}</Text>
        </View>
        <Text style={styles.providerArrow}>›</Text>
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
  { icon: '📦', name: 'Envío nacional',      desc: 'Paquetes dentro de Guinea Ecuatorial', price: 'Desde 2,000 XAF' },
  { icon: '✈️', name: 'Envío internacional', desc: 'Paquetes al extranjero',               price: 'Desde 15,000 XAF' },
  { icon: '📬', name: 'Apartado postal',      desc: 'Alquiler de apartado en Correos GQ',  price: '5,000 XAF/año' },
  { icon: '🔍', name: 'Seguimiento de envío', desc: 'Rastrea tu paquete en tiempo real',   price: 'Gratis' },
  { icon: '🏢', name: 'Oficinas de Correos',  desc: 'Malabo, Bata, Ebebiyín, Mongomo',     price: 'L-V 8:00-17:00' },
];

const CorreosModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="📮 Correos GQ" onClose={onClose}>
    <Text style={styles.sectionLabel}>Servicios postales</Text>
    {POSTAL_SERVICES.map(ps => (
      <TouchableOpacity key={ps.name} style={styles.planCard}
        onPress={() => Alert.alert(ps.name, `${ps.desc}\n\nPrecio: ${ps.price}`)}
        activeOpacity={0.7}>
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
  { name: 'Supermarket Malabo',   area: 'Centro Malabo',     phone: '+240 222 30 10 01', hours: 'L-D 8:00-21:00' },
  { name: 'Hipermarket Caracolas',area: 'Caracolas, Malabo', phone: '+240 222 30 10 02', hours: 'L-D 8:00-22:00' },
  { name: 'Supermercado Bata',    area: 'Centro Bata',       phone: '+240 222 30 10 03', hours: 'L-S 8:00-20:00' },
  { name: 'Tienda Nguema',        area: 'Ela Nguema',        phone: '+240 222 30 10 04', hours: 'L-D 7:00-21:00' },
  { name: 'Mercado Central',      area: 'Malabo',            phone: '+240 222 30 10 05', hours: 'L-S 6:00-18:00' },
];
const SM_CATEGORIES = ['🥩 Carnicería', '🥦 Verduras', '🥛 Lácteos', '🍞 Panadería', '🧴 Higiene', '🍷 Bebidas', '🧹 Limpieza', '🐟 Pescadería'];

const SupermercadoModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🛒 Supermercados" onClose={onClose}>
    <Text style={styles.sectionLabel}>Categorías</Text>
    <View style={styles.categoryGrid}>
      {SM_CATEGORIES.map(cat => (
        <TouchableOpacity key={cat} style={styles.categoryChip}
          onPress={() => Alert.alert('Próximamente', 'Compra online disponible pronto')} activeOpacity={0.7}>
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

// ── Modal Comida / Delivery ───────────────────────────────────────
const FOOD_DELIVERY = [
  { icon: '🍗', name: 'Pollo Asado Malabo',   desc: 'Pollo, brochetas, ensaladas',      phone: '+240 222 30 40 01', time: '25-35 min' },
  { icon: '🍕', name: 'Pizzería Caracolas',    desc: 'Pizzas, pastas, ensaladas',        phone: '+240 222 30 40 02', time: '30-45 min' },
  { icon: '🥗', name: 'Ensaladas & Wraps',     desc: 'Comida saludable y ligera',        phone: '+240 222 30 40 03', time: '20-30 min' },
  { icon: '🍔', name: 'Burger House GQ',       desc: 'Hamburguesas y sándwiches',        phone: '+240 222 30 40 04', time: '25-40 min' },
  { icon: '🐟', name: 'Mariscos del Puerto',   desc: 'Pescado fresco, mariscos',         phone: '+240 222 30 40 05', time: '35-50 min' },
  { icon: '🍱', name: 'Cocina Local Nguema',   desc: 'Platos típicos guineanos',         phone: '+240 222 30 40 06', time: '20-35 min' },
];

const ComidaModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="💵 Comida - Delivery" onClose={onClose}>
    <Text style={styles.sectionLabel}>Restaurantes con delivery</Text>
    {FOOD_DELIVERY.map(f => (
      <TouchableOpacity key={f.name} style={styles.providerCard}
        onPress={() => Alert.alert(f.name, `${f.desc}\n\n⏱ Tiempo estimado: ${f.time}`, [
          { text: 'Cerrar', style: 'cancel' },
          { text: '📞 Pedir', onPress: () => Linking.openURL(`tel:${f.phone}`) },
        ])}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{f.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{f.name}</Text>
          <Text style={styles.providerCat}>{f.desc}</Text>
        </View>
        <Text style={[styles.providerCat, { color: Colors.accent }]}>⏱ {f.time}</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Restaurantes ────────────────────────────────────────────
const RESTAURANTS = [
  { icon: '🍽️', name: 'La Bahía',             desc: 'Cocina internacional · Centro Malabo', phone: '+240 222 30 22 01', price: 'Desde 8,000 XAF' },
  { icon: '🍽️', name: 'El Rincón Guineano',   desc: 'Cocina local · Ela Nguema',           phone: '+240 222 30 22 02', price: 'Desde 5,000 XAF' },
  { icon: '🍕', name: 'Pizzería Malabo',       desc: 'Italiana · Caracolas',                phone: '+240 222 30 22 03', price: 'Desde 4,000 XAF' },
  { icon: '🦞', name: 'Marisquería del Puerto',desc: 'Mariscos · Puerto Malabo',            phone: '+240 222 30 22 04', price: 'Desde 10,000 XAF' },
  { icon: '☕', name: 'Café Central',          desc: 'Cafetería · Centro',                  phone: '+240 222 30 22 05', price: 'Desde 1,500 XAF' },
];

const RestaurantesModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="☕ Restaurantes" onClose={onClose}>
    <Text style={styles.sectionLabel}>Restaurantes disponibles</Text>
    {RESTAURANTS.map(r => (
      <TouchableOpacity key={r.name} style={styles.providerCard}
        onPress={() => Alert.alert(r.name, `${r.desc}\n\n💰 ${r.price}`, [
          { text: 'Cerrar', style: 'cancel' },
          { text: '📞 Reservar', onPress: () => Linking.openURL(`tel:${r.phone}`) },
        ])}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{r.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{r.name}</Text>
          <Text style={styles.providerCat}>{r.desc}</Text>
        </View>
        <Text style={[styles.providerCat, { color: Colors.accent }]}>{r.price}</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Hotel ───────────────────────────────────────────────────
const HOTELS = [
  { name: 'Hotel Bahía',      stars: '⭐⭐⭐⭐',  price: '45,000 XAF/noche', phone: '+240 222 30 20 01', amenities: ['WiFi', 'Piscina', 'Restaurante', 'AC'] },
  { name: 'Hotel Impala',     stars: '⭐⭐⭐',    price: '30,000 XAF/noche', phone: '+240 222 30 20 02', amenities: ['WiFi', 'Restaurante', 'AC'] },
  { name: 'Sofitel Malabo',   stars: '⭐⭐⭐⭐⭐', price: '120,000 XAF/noche',phone: '+240 222 30 20 03', amenities: ['WiFi', 'Piscina', 'Spa', 'Gimnasio', 'Restaurante'] },
  { name: 'Hotel Ureca',      stars: '⭐⭐⭐',    price: '25,000 XAF/noche', phone: '+240 222 30 20 04', amenities: ['WiFi', 'AC', 'Desayuno incluido'] },
  { name: 'Aparthotel Bata',  stars: '⭐⭐⭐',    price: '28,000 XAF/noche', phone: '+240 222 30 20 05', amenities: ['WiFi', 'Cocina', 'AC'] },
];

const HotelModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const [selected, setSelected] = useState<typeof HOTELS[0] | null>(null);
  return (
    <ServiceModal visible={visible} title="🏨 Hoteles" onClose={() => { setSelected(null); onClose(); }}>
      {!selected ? (
        <View>
          <Text style={styles.sectionLabel}>Hoteles disponibles</Text>
          {HOTELS.map(h => (
            <TouchableOpacity key={h.name} style={styles.providerCard} onPress={() => setSelected(h)} activeOpacity={0.7}>
              <Text style={styles.providerDotEmoji}>🏨</Text>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{h.name}</Text>
                <Text style={styles.providerCat}>{h.stars}  ·  {h.price}</Text>
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
            <Text style={styles.infoCardTitle}>{selected.stars}  {selected.price}</Text>
            <Text style={styles.sectionLabel}>Servicios incluidos</Text>
            {selected.amenities.map(a => (
              <View key={a} style={styles.serviceRow}>
                <Text style={styles.serviceRowDot}>●</Text>
                <Text style={styles.serviceRowText}>{a}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
              <Text style={styles.callBtnText}>📞 Reservar: {selected.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ServiceModal>
  );
};

// ── Modal Gasolineras ─────────────────────────────────────────────
const GAS_STATIONS = [
  { name: 'GEPetrol Centro',    area: 'Av. de la Independencia · 24h', phone: '+240 222 30 30 01', price: '650 XAF/L' },
  { name: 'GEPetrol Caracolas', area: 'Barrio Caracolas · 6:00-22:00', phone: '+240 222 30 30 02', price: '650 XAF/L' },
  { name: 'Total Malabo',       area: 'Carretera del Aeropuerto · 24h', phone: '+240 222 30 30 03', price: '660 XAF/L' },
  { name: 'GEPetrol Bata',      area: 'Centro Bata · 6:00-22:00',      phone: '+240 222 30 30 04', price: '650 XAF/L' },
];

const GasolinerasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="⛽ Gasolineras" onClose={onClose}>
    <Text style={styles.sectionLabel}>Gasolineras cercanas</Text>
    {GAS_STATIONS.map(g => (
      <View key={g.name} style={styles.providerCard}>
        <Text style={styles.providerDotEmoji}>⛽</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{g.name}</Text>
          <Text style={styles.providerCat}>{g.area}</Text>
        </View>
        <Text style={[styles.providerName, { color: Colors.accent }]}>{g.price}</Text>
      </View>
    ))}
    <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]}
      onPress={() => Alert.alert('GEPetrol', 'Servicio de atención al cliente\n+240 333 09 80 00')}>
      <Text style={styles.callBtnText}>📞 Atención al cliente GEPetrol</Text>
    </TouchableOpacity>
  </ServiceModal>
);

// ── Modal Tienda ──────────────────────────────────────────────────
const STORES = [
  { icon: '👗', name: 'Moda y ropa',        desc: 'Tiendas de ropa y accesorios en Malabo' },
  { icon: '📱', name: 'Electrónica',         desc: 'Móviles, tablets y accesorios' },
  { icon: '🏠', name: 'Hogar y decoración',  desc: 'Muebles, decoración y electrodomésticos' },
  { icon: '💄', name: 'Belleza y cosmética', desc: 'Productos de belleza y cuidado personal' },
  { icon: '📚', name: 'Libros y papelería',  desc: 'Libros, material escolar y oficina' },
  { icon: '🎁', name: 'Regalos',             desc: 'Ideas y tiendas de regalos' },
];

const TiendaModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🛍️ Tienda" onClose={onClose}>
    <Text style={styles.sectionLabel}>Categorías de tiendas</Text>
    {STORES.map(s => (
      <TouchableOpacity key={s.name} style={styles.planCard}
        onPress={() => Alert.alert('Próximamente', `La sección "${s.name}" estará disponible pronto.`)}
        activeOpacity={0.7}>
        <View style={styles.insuranceRow}>
          <Text style={styles.insuranceIcon}>{s.icon}</Text>
          <View style={styles.insuranceInfo}>
            <Text style={styles.providerName}>{s.name}</Text>
            <Text style={styles.providerCat}>{s.desc}</Text>
          </View>
          <Text style={styles.planAction}>Ver →</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Lavandería ──────────────────────────────────────────────
const LAUNDRY = [
  { name: 'Lavandería Express Malabo', area: 'Centro Malabo',  phone: '+240 222 30 50 01', price: 'Desde 3,000 XAF/kg', hours: 'L-S 8:00-20:00' },
  { name: 'Clean & Go',               area: 'Caracolas',       phone: '+240 222 30 50 02', price: 'Desde 2,500 XAF/kg', hours: 'L-D 7:00-21:00' },
  { name: 'Lavandería Bata',          area: 'Centro Bata',     phone: '+240 222 30 50 03', price: 'Desde 2,000 XAF/kg', hours: 'L-S 8:00-19:00' },
];

const LavanderiaModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🫧 Lavandería" onClose={onClose}>
    <Text style={styles.sectionLabel}>Lavanderías disponibles</Text>
    {LAUNDRY.map(l => (
      <View key={l.name} style={styles.providerCard}>
        <Text style={styles.providerDotEmoji}>🫧</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{l.name}</Text>
          <Text style={styles.providerCat}>📍 {l.area}  ·  🕐 {l.hours}</Text>
          <Text style={[styles.providerCat, { color: Colors.accent }]}>{l.price}</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${l.phone}`)}>
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    ))}
  </ServiceModal>
);

// ── Modal Belleza ─────────────────────────────────────────────────
const BEAUTY = [
  { icon: '💇', name: 'Salón Glamour Malabo',  desc: 'Peluquería y estética femenina',  phone: '+240 222 30 60 01' },
  { icon: '💈', name: 'Barbería El Estilo',    desc: 'Cortes y arreglos masculinos',    phone: '+240 222 30 60 02' },
  { icon: '💅', name: 'Nail Studio GQ',        desc: 'Manicura, pedicura y nail art',   phone: '+240 222 30 60 03' },
  { icon: '🧖', name: 'Spa Relax Center',      desc: 'Masajes y tratamientos corporales',phone: '+240 222 30 60 04' },
  { icon: '🌿', name: 'Centro de Estética',    desc: 'Tratamientos faciales y corporales',phone: '+240 222 30 60 05' },
];

const BellezaModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="❤️ Belleza" onClose={onClose}>
    <Text style={styles.sectionLabel}>Salones y centros de belleza</Text>
    {BEAUTY.map(b => (
      <TouchableOpacity key={b.name} style={styles.providerCard}
        onPress={() => Alert.alert(b.name, b.desc, [
          { text: 'Cerrar', style: 'cancel' },
          { text: '📞 Llamar', onPress: () => Linking.openURL(`tel:${b.phone}`) },
        ])}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{b.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{b.name}</Text>
          <Text style={styles.providerCat}>{b.desc}</Text>
        </View>
        <Text style={styles.providerArrow}>›</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal Noticias ────────────────────────────────────────────────
const NEWS_SOURCES = [
  { icon: '📰', name: 'La Gaceta de Guinea',   desc: 'Diario oficial y noticias nacionales', url: 'https://lagacetadeguinea.com' },
  { icon: '📡', name: 'TVGE Noticias',          desc: 'Televisión de Guinea Ecuatorial',      url: 'https://tvge.gq' },
  { icon: '🌍', name: 'Noticias CEMAC',         desc: 'Noticias de la región CEMAC',          url: 'https://cemac.int' },
  { icon: '📻', name: 'Radio Nacional GQ',      desc: 'Radio pública de Guinea Ecuatorial',   url: '' },
  { icon: '💼', name: 'Economía GQ',            desc: 'Noticias económicas y empresariales',  url: '' },
];

const NoticiasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="📰 Noticias" onClose={onClose}>
    <Text style={styles.sectionLabel}>Fuentes de noticias</Text>
    {NEWS_SOURCES.map(n => (
      <TouchableOpacity key={n.name} style={styles.providerCard}
        onPress={() => n.url ? Linking.openURL(n.url) : Alert.alert(n.name, n.desc)}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{n.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{n.name}</Text>
          <Text style={styles.providerCat}>{n.desc}</Text>
        </View>
        <Text style={styles.providerArrow}>{n.url ? '🔗' : '›'}</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Modal ID Digital ──────────────────────────────────────────────
const IdDigitalModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="🪪 ID Digital" onClose={onClose}>
    <View style={[styles.infoCard, { alignItems: 'center', marginBottom: Spacing.md }]}>
      <Text style={{ fontSize: 60, marginBottom: Spacing.md }}>🪪</Text>
      <Text style={[styles.infoCardTitle, { textAlign: 'center' }]}>Identidad Digital EGCHAT</Text>
      <Text style={[styles.providerCat, { textAlign: 'center', marginTop: Spacing.sm }]}>
        Tu identidad digital verificada en Guinea Ecuatorial
      </Text>
    </View>
    {[
      { icon: '✅', label: 'DNI verificado',        desc: 'Documento de identidad vinculado' },
      { icon: '📱', label: 'Número verificado',     desc: 'Teléfono confirmado por SMS' },
      { icon: '🔒', label: 'Cuenta segura',         desc: 'Autenticación de dos factores activa' },
      { icon: '🌍', label: 'Zona CEMAC',            desc: 'Válido en los 6 países CEMAC' },
    ].map(item => (
      <View key={item.label} style={styles.providerCard}>
        <Text style={styles.providerDotEmoji}>{item.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.label}</Text>
          <Text style={styles.providerCat}>{item.desc}</Text>
        </View>
      </View>
    ))}
    <TouchableOpacity style={[styles.callBtn, { marginTop: Spacing.md }]}
      onPress={() => Alert.alert('ID Digital', 'Función de verificación de identidad próximamente disponible.')}>
      <Text style={styles.callBtnText}>🪪 Verificar mi identidad</Text>
    </TouchableOpacity>
  </ServiceModal>
);

// ── Modal Actividad ───────────────────────────────────────────────
const ActividadModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const ACTIVITY = [
    { icon: '💬', desc: 'Mensaje enviado a Juan',       time: 'Hace 5 min',   type: 'chat' },
    { icon: '⚡', desc: 'Factura SEGESA consultada',    time: 'Hace 1 hora',  type: 'service' },
    { icon: '🚕', desc: 'Taxi solicitado - Centro',     time: 'Hace 3 horas', type: 'taxi' },
    { icon: '📱', desc: 'Recarga 2,000 XAF - GETESA',  time: 'Ayer 14:30',   type: 'recarga' },
    { icon: '🏦', desc: 'Consulta BANGE',               time: 'Ayer 10:15',   type: 'banco' },
    { icon: '🌐', desc: 'Plan internet contratado',     time: 'Hace 2 días',  type: 'internet' },
  ];
  return (
    <ServiceModal visible={visible} title="🕐 Actividad reciente" onClose={onClose}>
      <Text style={styles.sectionLabel}>Últimas acciones</Text>
      {ACTIVITY.map((a, i) => (
        <View key={i} style={styles.providerCard}>
          <Text style={styles.providerDotEmoji}>{a.icon}</Text>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{a.desc}</Text>
            <Text style={styles.providerCat}>{a.time}</Text>
          </View>
        </View>
      ))}
    </ServiceModal>
  );
};

// ── Modal Emergencias ─────────────────────────────────────────────
const EMERGENCY_NUMBERS = [
  { icon: '🚒', name: 'Bomberos',              number: '115',              color: '#EF4444' },
  { icon: '🚑', name: 'Ambulancia / SAMU',     number: '116',              color: '#DC2626' },
  { icon: '👮', name: 'Policía Nacional',       number: '114',              color: '#1E3A5F' },
  { icon: '🏥', name: 'Hospital General',       number: '+240 333 09 50 00', color: '#DC2626' },
  { icon: '⚡', name: 'Averías SEGESA',         number: '+240 333 09 70 00', color: '#EAB308' },
  { icon: '💧', name: 'Averías SNGE',           number: '+240 333 09 71 00', color: '#0EA5E9' },
  { icon: '🛡️', name: 'Guardia Civil',          number: '112',              color: '#374151' },
  { icon: '🌊', name: 'Protección Civil',       number: '+240 333 09 72 00', color: '#0369A1' },
];

const EmergenciasModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ServiceModal visible={visible} title="⚠️ Emergencias" onClose={onClose}>
    <View style={{ backgroundColor: '#FEF2F2', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#FECACA' }}>
      <Text style={{ fontSize: FontSize.sm, color: '#991B1B', textAlign: 'center', fontWeight: FontWeight.semibold }}>
        ⚠️ En caso de emergencia real, llama directamente al número correspondiente
      </Text>
    </View>
    <Text style={styles.sectionLabel}>Números de emergencia</Text>
    {EMERGENCY_NUMBERS.map(e => (
      <TouchableOpacity key={e.name} style={[styles.providerCard, { borderLeftWidth: 3, borderLeftColor: e.color }]}
        onPress={() => Alert.alert(e.name, `Número: ${e.number}`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: '📞 Llamar ahora', style: 'destructive', onPress: () => Linking.openURL(`tel:${e.number}`) },
        ])}
        activeOpacity={0.7}>
        <Text style={styles.providerDotEmoji}>{e.icon}</Text>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{e.name}</Text>
          <Text style={[styles.providerCat, { color: e.color, fontWeight: FontWeight.bold }]}>{e.number}</Text>
        </View>
        <Text style={styles.callIcon}>📞</Text>
      </TouchableOpacity>
    ))}
  </ServiceModal>
);

// ── Drawer lateral ────────────────────────────────────────────────
const DrawerMenu = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={drawerStyles.overlay} onPress={onClose}>
      <Pressable style={drawerStyles.drawer} onPress={() => {}}>
        <Text style={drawerStyles.title}>Menú</Text>
        {[
          { icon: '🤖', label: 'LIA-25 — IA Asistente',  action: () => { onClose(); router.push('/(tabs)/lia' as any); } },
          { icon: '🗺️', label: 'Mapa de Malabo',          action: () => { onClose(); router.push('/map' as any); } },
          { icon: '📲', label: 'Escanear QR',             action: () => { onClose(); router.push('/_qr-scanner' as any); } },
          { icon: '👥', label: 'Contactos',               action: () => { onClose(); router.push('/contacts' as any); } },
          { icon: '📖', label: 'Estados / Stories',       action: () => { onClose(); router.push('/stories' as any); } },
          { icon: '⚙️', label: 'Ajustes',                 action: () => { onClose(); router.push('/(tabs)/ajustes' as any); } },
        ].map(item => (
          <TouchableOpacity key={item.label} style={drawerStyles.item} onPress={item.action} activeOpacity={0.7}>
            <Text style={drawerStyles.itemIcon}>{item.icon}</Text>
            <Text style={drawerStyles.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </Pressable>
    </Pressable>
  </Modal>
);

const drawerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end', alignItems: 'flex-end' },
  drawer: {
    width: '75%', height: '100%',
    backgroundColor: Colors.bgSecondary,
    padding: Spacing.xl, paddingTop: 60, gap: Spacing.xs,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  itemLabel: { fontSize: FontSize.base, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
});

// ── Pantalla principal ────────────────────────────────────────────
export default function ServiciosScreen() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadData = async () => {
    try {
      const me = await authAPI.me().catch(() => null);
      setUser(me);
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Servicios que abren modal inline
  const MODAL_SERVICES = [
    'taxi', 'electricidad', 'agua', 'recarga', 'internet', 'tv',
    'bancos', 'seguros', 'facturas', 'inversion', 'tarjetas', 'historial',
    'salud', 'educacion', 'impuestos', 'correos',
    'supermercado', 'comida', 'restaurantes', 'hotel', 'gasolineras',
    'tienda', 'lavanderia', 'belleza', 'noticias',
    'id_digital', 'actividad', 'emergencias',
  ];

  const openService = (id: string) => {
    if (MODAL_SERVICES.includes(id)) {
      setActiveModal(id);
    } else if (id === 'cemac') {
      router.push('/cemac' as any);
    } else if (id === 'ocio') {
      router.push('/ocio' as any);
    } else if (id === 'apuestas') {
      router.push('/apuestas' as any);
    } else if (id === 'lia') {
      router.push('/(tabs)/lia' as any);
    } else if (id === 'ajustes') {
      router.push('/(tabs)/ajustes' as any);
    } else {
      Alert.alert('Próximamente', 'Este servicio estará disponible pronto.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      {/* ── Header con gradiente ── */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={{ width: 34, height: 34, borderRadius: 17 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerLogo}>EG</Text>
          <Text style={styles.headerLogoAccent}>CHAT</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.weatherChip}>
            <TouchableOpacity onPress={() => setShowWeather(true)} activeOpacity={0.8}>
              <Text style={styles.weatherText}>☁️ 27° Malabo</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.headerIconBtn}
            onPress={() => { setShowNotifications(true); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }}
            activeOpacity={0.8}>
            <Text style={styles.headerIconText}>🔔</Text>
            {notifications.some(n => !n.read) && (
              <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowMenu(true)} activeOpacity={0.8}>
            <Text style={styles.headerIconText}>☰</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C8A0" colors={['#00C8A0']} />}
      >
        {/* ── Título de la pantalla ── */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: C.textPrimary }]}>Servicios</Text>
        </View>

        {/* ── Secciones de servicios ── */}
        {SERVICE_SECTIONS.map(section => (
          <View key={section.id} style={styles.sectionWrapper}>
            {/* Cabecera de sección */}
            <View style={[styles.sectionHeader, { borderBottomColor: C.borderLight }]}>
              <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>{section.title}</Text>
            </View>

            {/* Grid de servicios de la sección */}
            <View style={[styles.sectionCard, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}>
              <View style={styles.grid}>
                {section.services.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.serviceItem}
                    onPress={() => openService(s.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceIconBox}>
                      <ServiceIcon name={s.svgIcon} size={26} color={s.color} />
                    </View>
                    <Text style={[styles.serviceLabel, { color: C.textPrimary }]} numberOfLines={1}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Drawer menú ── */}
      <DrawerMenu visible={showDrawer} onClose={() => setShowDrawer(false)} />

      {/* ── Paneles del header ── */}
      <NotificationsPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onClearAll={() => setNotifications([])}
        onNotifPress={(n) => {
          setNotifications(prev => prev.filter(x => x.id !== n.id));
          setShowNotifications(false);
          if (n.chatId) router.push(`/chat/${n.chatId}` as any);
        }}
      />
      <HamburgerMenu visible={showMenu} onClose={() => setShowMenu(false)} user={user} />
      <WeatherModal visible={showWeather} onClose={() => setShowWeather(false)} temp="27°" city="Malabo" condition="cloudy" />

      {/* ── Modales de servicios ── */}
      <TaxiModal          visible={activeModal === 'taxi'}          onClose={() => setActiveModal(null)} />
      <UtilityModal       visible={activeModal === 'electricidad'}  onClose={() => setActiveModal(null)} type="electricidad" />
      <UtilityModal       visible={activeModal === 'agua'}          onClose={() => setActiveModal(null)} type="agua" />
      <RecargaModal       visible={activeModal === 'recarga'}       onClose={() => setActiveModal(null)} />
      <InternetModal      visible={activeModal === 'internet'}      onClose={() => setActiveModal(null)} />
      <CanalesTVModal     visible={activeModal === 'tv'}            onClose={() => setActiveModal(null)} />
      <BancosModal        visible={activeModal === 'bancos'}        onClose={() => setActiveModal(null)} />
      <SegurosModal       visible={activeModal === 'seguros'}       onClose={() => setActiveModal(null)} />
      <FacturasModal      visible={activeModal === 'facturas'}      onClose={() => setActiveModal(null)} />
      <InversionModal     visible={activeModal === 'inversion'}     onClose={() => setActiveModal(null)} />
      <TarjetasModal      visible={activeModal === 'tarjetas'}      onClose={() => setActiveModal(null)} />
      <HistorialModal     visible={activeModal === 'historial'}     onClose={() => setActiveModal(null)} />
      <SaludModal         visible={activeModal === 'salud'}         onClose={() => setActiveModal(null)} />
      <EducacionModal     visible={activeModal === 'educacion'}     onClose={() => setActiveModal(null)} />
      <ImpuestosModal     visible={activeModal === 'impuestos'}     onClose={() => setActiveModal(null)} />
      <CorreosModal       visible={activeModal === 'correos'}       onClose={() => setActiveModal(null)} />
      <SupermercadoModal  visible={activeModal === 'supermercado'}  onClose={() => setActiveModal(null)} />
      <ComidaModal        visible={activeModal === 'comida'}        onClose={() => setActiveModal(null)} />
      <RestaurantesModal  visible={activeModal === 'restaurantes'}  onClose={() => setActiveModal(null)} />
      <HotelModal         visible={activeModal === 'hotel'}         onClose={() => setActiveModal(null)} />
      <GasolinerasModal   visible={activeModal === 'gasolineras'}   onClose={() => setActiveModal(null)} />
      <TiendaModal        visible={activeModal === 'tienda'}        onClose={() => setActiveModal(null)} />
      <LavanderiaModal    visible={activeModal === 'lavanderia'}    onClose={() => setActiveModal(null)} />
      <BellezaModal       visible={activeModal === 'belleza'}       onClose={() => setActiveModal(null)} />
      <NoticiasModal      visible={activeModal === 'noticias'}      onClose={() => setActiveModal(null)} />
      <IdDigitalModal     visible={activeModal === 'id_digital'}    onClose={() => setActiveModal(null)} />
      <ActividadModal     visible={activeModal === 'actividad'}     onClose={() => setActiveModal(null)} />
      <EmergenciasModal   visible={activeModal === 'emergencias'}   onClose={() => setActiveModal(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding, paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoCircle: {
    width: 34, height: 34, borderRadius: 17,
    overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  headerLogo: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerLogoAccent: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weatherChip: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  weatherText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconText: { fontSize: 16, color: '#fff' },

  // Título de página
  pageHeader: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  pageTitle: {
    fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
  },

  // Secciones
  sectionWrapper: { marginBottom: Spacing.sm },
  sectionHeader: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: FontSize.sm, fontWeight: FontWeight.semibold,
    color: Colors.textSecondary, letterSpacing: 0.2,
  },
  sectionCard: {
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },

  // Grid de servicios (4 columnas como la web)
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
  },
  serviceItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    gap: Spacing.xs,
  },
  serviceIconBox: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  serviceEmoji: { fontSize: 26 },
  serviceLabel: {
    fontSize: 11, fontWeight: '600',
    color: Colors.textPrimary, textAlign: 'center',
    lineHeight: 14,
  },

  // Modal bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl, paddingBottom: Spacing['3xl'], maxHeight: '88%',
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg,
  },
  sheetTitle: {
    ...Typography.headerTitle, color: Colors.textPrimary,
    marginBottom: Spacing.xl, textAlign: 'center',
  },

  // Etiquetas de sección dentro de modales
  sectionLabel: {
    ...Typography.fieldLabel, color: Colors.textTertiary,
    marginBottom: Spacing.sm, marginTop: Spacing.md,
  },

  // Taxi
  rideOption: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.md,
  },
  rideIconBox: { width: 44, height: 44, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  rideEmoji: { fontSize: 22 },
  rideInfo: { flex: 1 },
  rideLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rideSub: { fontSize: FontSize.sm, color: Colors.textTertiary },
  ridePrice: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  actionBtn: { marginTop: Spacing.md },
  centerContent: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  searchingText: { ...Typography.chatHeaderName, color: Colors.textPrimary },
  searchingSub: { ...Typography.subtitle, color: Colors.textSecondary },
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.md,
  },
  driverAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  driverInitials: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  driverInfo: { flex: 1 },
  driverName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  driverSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  etaText: { fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  fareText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.accent, textAlign: 'center', marginBottom: Spacing.md },

  // Facturas
  facturaCard: { marginTop: Spacing.lg, padding: Spacing.lg },
  facturaTitle: { ...Typography.chatHeaderName, color: Colors.textPrimary, marginBottom: Spacing.md },
  facturaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  facturaLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  facturaValue: { fontSize: FontSize.base, color: Colors.textPrimary },

  // Recarga
  operatorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  operatorChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border },
  operatorChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  operatorText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  operatorTextActive: { color: Colors.accent },
  amountRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  amountChip: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.bgTertiary, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  amountChipActive: { backgroundColor: Colors.accentLight, borderColor: Colors.accent },
  amountText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  amountTextActive: { color: Colors.accent },

  // Proveedores / listas
  providerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  providerDot: { width: 12, height: 12, borderRadius: 6 },
  providerDotEmoji: { fontSize: 22, width: 28, textAlign: 'center' },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  providerCat: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  providerArrow: { fontSize: 22, color: Colors.textTertiary },

  // Planes
  planCard: { backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planText: { flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
  planAction: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.bold },

  // Navegación dentro de modales
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backText: { fontSize: FontSize.base, color: Colors.accent, fontWeight: FontWeight.semibold },

  // Info card
  infoCard: { backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight },
  infoCardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  serviceRowDot: { fontSize: 8, color: Colors.accent },
  serviceRowText: { fontSize: FontSize.sm, color: Colors.textPrimary },

  // Botones de llamada
  callBtn: { backgroundColor: Colors.accentLight, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md },
  callBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
  callIcon: { fontSize: 22 },

  // Seguros / items con icono
  insuranceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1 },
  insuranceIcon: { fontSize: 26, width: 32, textAlign: 'center' },
  insuranceInfo: { flex: 1 },

  // Supermercado categorías
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  categoryChip: { backgroundColor: Colors.bgTertiary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight },
  categoryText: { fontSize: FontSize.sm, color: Colors.textPrimary },
});
