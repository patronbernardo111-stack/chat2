// ══════════════════════════════════════════════════════════════════
// EGCHAT — Home Dashboard (Parte 1)
// Fiel a la versión web: header, saldo, ID Digital, Noticias,
// APPS grid, FAB +, LIA-25 flotante
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { walletAPI, authAPI } from '../../src/api';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import {
  Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Tipos ─────────────────────────────────────────────────────────
interface UserProfile {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  verified?: boolean;
}

// ── Iconos SVG inline ─────────────────────────────────────────────
const IconBell = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </Svg>
);

const IconMenu = ({ color = '#fff', size = 20 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Line x1="3" y1="6" x2="21" y2="6"/>
    <Line x1="3" y1="12" x2="21" y2="12"/>
    <Line x1="3" y1="18" x2="21" y2="18"/>
  </Svg>
);

const IconEye = ({ color = 'rgba(255,255,255,0.7)', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <Circle cx="12" cy="12" r="3"/>
  </Svg>
);

const IconEyeOff = ({ color = 'rgba(255,255,255,0.7)', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <Line x1="1" y1="1" x2="23" y2="23"/>
  </Svg>
);

const IconSend = ({ color = Colors.brand, size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="22" y1="2" x2="11" y2="13"/>
    <Polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </Svg>
);

const IconRefresh = ({ color = Colors.brand, size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 4 23 10 17 10"/>
    <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </Svg>
);

const IconPlus = ({ color = '#fff', size = 28 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Line x1="12" y1="5" x2="12" y2="19"/>
    <Line x1="5" y1="12" x2="19" y2="12"/>
  </Svg>
);

const IconClose = ({ color = '#fff', size = 22 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
    <Line x1="18" y1="6" x2="6" y2="18"/>
    <Line x1="6" y1="6" x2="18" y2="18"/>
  </Svg>
);

// ── APPS principales (grid visible en home) ───────────────────────
const HOME_APPS = [
  { id: 'estados',  label: 'Estados',  route: '/stories',  color: '#00B4E6' },
  { id: 'apuestas', label: 'Juegos',   route: '/apuestas', color: '#8b5cf6' },
  { id: 'cemac',    label: 'Cemac',    route: '/cemac',    color: '#00C8A0' },
  { id: 'mitaxi',   label: 'MiTaxi',   route: '/mitaxi',   color: '#f59e0b' },
];

// ── Iconos SVG para APPS y FAB — idénticos a la versión web ──────
const SvgIcon = ({ id, color = '#00C8A0', size = 24 }: { id: string; color?: string; size?: number }) => {
  const s = size;
  switch (id) {
    case 'estados':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="4"/><Circle cx="12" cy="12" r="9" strokeDasharray="2.5 2" strokeWidth="1.5"/></Svg>;
    case 'apuestas':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="2" width="20" height="20" rx="4"/><Circle cx="8" cy="8" r="1.2" fill={color} stroke="none"/><Circle cx="16" cy="8" r="1.2" fill={color} stroke="none"/><Circle cx="8" cy="16" r="1.2" fill={color} stroke="none"/><Circle cx="16" cy="16" r="1.2" fill={color} stroke="none"/><Circle cx="12" cy="12" r="1.2" fill={color} stroke="none"/></Svg>;
    case 'cemac':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9 22 9 12 15 12 15 22"/></Svg>;
    case 'mitaxi':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/><Circle cx="7.5" cy="17" r="2.5"/><Circle cx="16.5" cy="17" r="2.5"/><Path d="M7 9h10"/></Svg>;
    case 'mensajes':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><Line x1="9" y1="10" x2="15" y2="10"/><Line x1="9" y1="14" x2="13" y2="14"/></Svg>;
    case 'cartera':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/><Rect x="16" y="11" width="2" height="2" fill={color} stroke="none"/></Svg>;
    case 'electricidad':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
    case 'agua':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2C6 8 4 12 4 15a8 8 0 0 0 16 0c0-3-2-7-8-13z"/></Svg>;
    case 'internet':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Line x1="2" y1="12" x2="22" y2="12"/><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>;
    case 'recarga':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Rect x="5" y="2" width="14" height="20" rx="2"/><Line x1="12" y1="18" x2="12.01" y2="18"/></Svg>;
    case 'tv':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Rect x="2" y="7" width="20" height="15" rx="2"/><Polyline points="17 2 12 7 7 2"/></Svg>;
    case 'bancos':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Line x1="3" y1="22" x2="21" y2="22"/><Line x1="6" y1="18" x2="6" y2="11"/><Line x1="10" y1="18" x2="10" y2="11"/><Line x1="14" y1="18" x2="14" y2="11"/><Line x1="18" y1="18" x2="18" y2="11"/><Polygon points="12 2 20 7 4 7"/></Svg>;
    case 'salud':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3"/><Path d="M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z"/><Line x1="14" y1="11" x2="14" y2="17"/><Line x1="11" y1="14" x2="17" y2="14"/></Svg>;
    case 'impuestos':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><Polyline points="14 2 14 8 20 8"/><Line x1="16" y1="13" x2="8" y2="13"/><Line x1="16" y1="17" x2="8" y2="17"/></Svg>;
    case 'correos':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><Polyline points="22,6 12,13 2,6"/></Svg>;
    case 'seguros':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><Polyline points="9 12 11 14 15 10"/></Svg>;
    case 'super':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Circle cx="9" cy="21" r="1"/><Circle cx="20" cy="21" r="1"/><Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></Svg>;
    case 'restaurantes':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8h1a4 4 0 0 1 0 8h-1"/><Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><Line x1="6" y1="1" x2="6" y2="4"/><Line x1="10" y1="1" x2="10" y2="4"/><Line x1="14" y1="1" x2="14" y2="4"/></Svg>;
    case 'vuelos':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></Svg>;
    case 'gasolineras':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><Path d="M17 22V11l4-4v15"/><Line x1="3" y1="22" x2="21" y2="22"/><Line x1="7" y1="10" x2="11" y2="10"/></Svg>;
    case 'ocio':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>;
    default:
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/></Svg>;
  }
};

// ── TODOS los servicios del FAB + ─────────────────────────────────
const FAB_SERVICES = [
  { id: 'mensajes',     label: 'Mensajes',     route: '/mensajeria',       color: '#00B4E6' },
  { id: 'cartera',      label: 'Cartera',      route: '/(tabs)/monedero',  color: '#00C8A0' },
  { id: 'mitaxi',       label: 'MiTaxi',       route: '/mitaxi',           color: '#f59e0b' },
  { id: 'electricidad', label: 'Electricidad', route: '/(tabs)/servicios', color: '#eab308' },
  { id: 'agua',         label: 'Agua',         route: '/(tabs)/servicios', color: '#3b82f6' },
  { id: 'internet',     label: 'Internet',     route: '/(tabs)/servicios', color: '#8b5cf6' },
  { id: 'recarga',      label: 'Recarga',      route: '/(tabs)/servicios', color: '#06b6d4' },
  { id: 'tv',           label: 'Canales TV',   route: '/(tabs)/servicios', color: '#ec4899' },
  { id: 'bancos',       label: 'Bancos',       route: '/bancos',           color: '#1d4ed8' },
  { id: 'salud',        label: 'Salud',        route: '/seguros-salud',    color: '#ef4444' },
  { id: 'impuestos',    label: 'Impuestos',    route: '/(tabs)/servicios', color: '#64748b' },
  { id: 'correos',      label: 'Correos',      route: '/(tabs)/servicios', color: '#f97316' },
  { id: 'seguros',      label: 'Seguros',      route: '/seguros-salud',    color: '#10b981' },
  { id: 'super',        label: 'Supermercado', route: '/supermercados',    color: '#84cc16' },
  { id: 'restaurantes', label: 'Restaurantes', route: '/(tabs)/servicios', color: '#f43f5e' },
  { id: 'vuelos',       label: 'Vuelos',       route: '/(tabs)/servicios', color: '#0ea5e9' },
  { id: 'gasolineras',  label: 'Gasolineras',  route: '/(tabs)/servicios', color: '#d97706' },
  { id: 'cemac',        label: 'Zona CEMAC',   route: '/cemac',            color: '#00C8A0' },
  { id: 'ocio',         label: 'Ocio',         route: '/ocio',             color: '#a855f7' },
  { id: 'apuestas',     label: 'Apuestas',     route: '/apuestas',         color: '#6366f1' },
];

// ── Componente AppIcon (grid home) ────────────────────────────────
const AppIcon = ({ id, label, color, onPress }: { id: string; label: string; color: string; onPress: () => void }) => (
  <TouchableOpacity style={st.appItem} onPress={onPress} activeOpacity={0.75}>
    <View style={[st.appIconBox, { borderColor: color + '30' }]}>
      <SvgIcon id={id} color={color} size={32} />
    </View>
    <Text style={st.appLabel}>{label}</Text>
  </TouchableOpacity>
);

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL — HomeScreen
// ══════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('XAF');
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newsCount] = useState(8);
  const [fabOpen, setFabOpen] = useState(false);
  const [temp] = useState('27°');
  const [city] = useState('Malabo');

  // ── Estados de los paneles del header ───────────────────────────
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', type: 'message',  title: '💬 Bienvenido a EGCHAT', body: 'Tu cuenta está activa y lista para usar', time: 'Ahora', read: false },
    { id: '2', type: 'system',   title: '🔒 Cifrado E2E activado', body: 'Todos tus mensajes están cifrados', time: 'Hoy', read: false },
  ]);

  // Animaciones FAB — una por cada servicio
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabOverlayOpacity = useRef(new Animated.Value(0)).current;
  const fabItemAnims = useRef(FAB_SERVICES.map(() => new Animated.Value(0))).current;
  // Animación LIA — pulso continuo
  const liaPulse = useRef(new Animated.Value(1)).current;

  // ── LIA arrastrable ─────────────────────────────────────────────
  const { width: SW, height: SH } = Dimensions.get('window');
  const LIA_SIZE = 60;
  // Posición inicial: esquina inferior derecha
  const liaPan = useRef(new Animated.ValueXY({
    x: SW - LIA_SIZE - Spacing.lg,
    y: SH - LIA_SIZE - 160,
  })).current;
  const liaLastPos = useRef({ x: SW - LIA_SIZE - Spacing.lg, y: SH - LIA_SIZE - 160 });
  const liaDragging = useRef(false);

  const liaPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4,
      onPanResponderGrant: () => {
        liaDragging.current = false;
        liaPan.setOffset({ x: liaLastPos.current.x, y: liaLastPos.current.y });
        liaPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gs) => {
        if (Math.abs(gs.dx) > 4 || Math.abs(gs.dy) > 4) liaDragging.current = true;
        Animated.event(
          [null, { dx: liaPan.x, dy: liaPan.y }],
          { useNativeDriver: false }
        )(_, gs);
      },
      onPanResponderRelease: (_, gs) => {
        liaPan.flattenOffset();
        // Guardar posición final, con límites de pantalla
        const newX = Math.max(0, Math.min(SW - LIA_SIZE, liaLastPos.current.x + gs.dx));
        const newY = Math.max(0, Math.min(SH - LIA_SIZE - 80, liaLastPos.current.y + gs.dy));
        liaLastPos.current = { x: newX, y: newY };
        liaPan.setValue({ x: newX, y: newY });
      },
    })
  ).current;

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const insets = useSafeAreaInsets();

  // ── Animación LIA pulso ─────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liaPulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(liaPulse, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Carga de datos ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [balData, userData] = await Promise.allSettled([
        walletAPI.getBalance(),
        authAPI.me(),
      ]);
      if (balData.status === 'fulfilled') {
        setBalance(balData.value?.balance || 0);
        setCurrency(balData.value?.currency || 'XAF');
      }
      if (userData.status === 'fulfilled') {
        setUser(userData.value);
      }
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // ── FAB animaciones ─────────────────────────────────────────────
  const openFab = () => {
    setFabOpen(true);
    Animated.parallel([
      Animated.timing(fabRotate, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(fabOverlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ...fabItemAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          delay: i * 18,
          useNativeDriver: true,
        })
      ),
    ]).start();
  };

  const closeFab = () => {
    Animated.parallel([
      Animated.timing(fabRotate, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(fabOverlayOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ...fabItemAnims.map(anim =>
        Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true })
      ),
    ]).start(() => setFabOpen(false));
  };

  const toggleFab = () => (fabOpen ? closeFab() : openFab());

  const fabIconRotation = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // ── Formato saldo ───────────────────────────────────────────────
  const fmtBalance = (n: number) =>
    n.toLocaleString('es-ES', { minimumFractionDigits: 0 });

  const balanceDisplay = balanceVisible
    ? `${fmtBalance(balance)} ${currency}`
    : '●●●● ●●●●';

  // ── Navegar desde FAB ───────────────────────────────────────────
  const navigateFab = (route: string) => {
    closeFab();
    setTimeout(() => router.push(route as any), 220);
  };

  if (loading) {
    return (
      <View style={[st.center, { backgroundColor: C.bgPrimary }]}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['bottom', 'left', 'right']}>

      {/* ════════════════════════════════════════════════════════
          HEADER — Logo + Temperatura + Campanita + Menú
      ════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[st.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        {/* Logo real de la app */}
        <View style={st.headerLogo}>
          <View style={st.logoImgWrap}>
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={st.logoImg}
              resizeMode="contain"
            />
          </View>
          <Text style={st.logoText}>EG</Text>
          <Text style={st.logoTextBold}>CHAT</Text>
        </View>

        {/* Acciones derechas */}
        <View style={st.headerRight}>
          {/* Temperatura */}
          <TouchableOpacity style={st.headerPill} activeOpacity={0.8} onPress={() => setShowWeather(true)}>
            <Text style={st.headerPillText}>☁️ {temp} {city}</Text>
          </TouchableOpacity>

          {/* Campanita */}
          <TouchableOpacity
            style={st.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => {
              setShowNotifications(true);
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}
          >
            <IconBell color="#fff" size={20} />
            {notifications.some(n => !n.read) && <View style={st.notifBadge} />}
          </TouchableOpacity>

          {/* Tres barras */}
          <TouchableOpacity
            style={st.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => setShowMenu(true)}
          >
            <IconMenu color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} colors={[Colors.brand]} />
        }
        contentContainerStyle={st.scrollContent}
      >

        {/* ════════════════════════════════════════════════════════
            BANNER SALDO DISPONIBLE
        ════════════════════════════════════════════════════════ */}
        <LinearGradient
          colors={['#1a3a5c', '#0d2d4a', '#0a2240']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.balanceBanner}
        >
          <Text style={st.balanceTitle}>SALDO DISPONIBLE</Text>

          {/* Saldo con puntos y ojo */}
          <View style={st.balanceRow}>
            <Text style={st.balanceAmount}>{balanceDisplay}</Text>
            <TouchableOpacity
              onPress={() => setBalanceVisible(v => !v)}
              style={st.eyeBtn}
              activeOpacity={0.7}
            >
              {balanceVisible
                ? <IconEye color="rgba(255,255,255,0.7)" size={18} />
                : <IconEyeOff color="rgba(255,255,255,0.7)" size={18} />
              }
            </TouchableOpacity>
          </View>

          {/* Botones RECARGAR y ENVIAR */}
          <View style={st.balanceActions}>
            <TouchableOpacity
              style={st.balanceBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/monedero' as any)}
            >
              <IconRefresh color={Colors.brand} size={15} />
              <Text style={st.balanceBtnText}>RECARGAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={st.balanceBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/monedero' as any)}
            >
              <IconSend color={Colors.brand} size={15} />
              <Text style={st.balanceBtnText}>ENVIAR</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ════════════════════════════════════════════════════════
            CARDS — ID Digital + Noticias
        ════════════════════════════════════════════════════════ */}
        <View style={st.cardsRow}>
          {/* ID Digital */}
          <TouchableOpacity
            style={[st.infoCard, { backgroundColor: C.bgSecondary }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/ajustes' as any)}
          >
            <View style={st.infoCardIcon}>
              <Text style={st.infoCardEmoji}>🪪</Text>
            </View>
            <View style={st.infoCardText}>
              <Text style={[st.infoCardTitle, { color: C.textPrimary }]}>ID Digital</Text>
              <Text style={[st.infoCardSub, { color: Colors.accent }]}>
                {user ? '✓ Verificado' : 'Sin verificar'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Noticias */}
          <TouchableOpacity
            style={[st.infoCard, { backgroundColor: C.bgSecondary }]}
            activeOpacity={0.8}
          >
            <View style={st.infoCardIcon}>
              <Text style={st.infoCardEmoji}>📰</Text>
            </View>
            <View style={st.infoCardText}>
              <Text style={[st.infoCardTitle, { color: C.textPrimary }]}>Noticias</Text>
              <Text style={[st.infoCardSub, { color: C.textSecondary }]}>
                {newsCount} nuevas
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════
            APPS — Estados, Juegos, Cemac, MiTaxi
        ════════════════════════════════════════════════════════ */}
        <View style={st.appsSection}>
          <Text style={[st.sectionLabel, { color: C.textSecondary }]}>APPS</Text>
          <View style={st.appsGrid}>
            {HOME_APPS.map(app => (
              <AppIcon
                key={app.id}
                id={app.id}
                label={app.label}
                color={app.color}
                onPress={() => router.push(app.route as any)}
              />
            ))}
          </View>
        </View>

        {/* Espacio inferior para que el FAB no tape contenido */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ════════════════════════════════════════════════════════
          FAB OVERLAY — fondo oscuro al abrir el menú +
      ════════════════════════════════════════════════════════ */}
      {fabOpen && (
        <Animated.View
          style={[st.fabOverlay, { opacity: fabOverlayOpacity }]}
          pointerEvents="box-none"
        >
          <Pressable style={st.fabOverlayPress} onPress={closeFab} />
        </Animated.View>
      )}

      {/* ════════════════════════════════════════════════════════
          FAB RADIAL — 360° completos, 2 anillos concéntricos
          Posicionamiento absoluto desde el centro del FAB
      ════════════════════════════════════════════════════════ */}
      {fabOpen && (() => {
        const { width: SW } = Dimensions.get('window');
        // Centro del FAB en coordenadas de pantalla
        const FAB_CX = SW / 2;          // centro horizontal
        const FAB_BOTTOM = 68 + 30;     // bottom del centro del FAB (bottom:68 + radio:30)
        const ITEM_SIZE = 48;
        const ITEM_HALF = ITEM_SIZE / 2;
        const RING1_COUNT = 10;
        const RING2_COUNT = FAB_SERVICES.length - RING1_COUNT;
        const R1 = 110;
        const R2 = 200;

        return FAB_SERVICES.map((svc, i) => {
          const isRing2 = i >= RING1_COUNT;
          const ringIdx = isRing2 ? i - RING1_COUNT : i;
          const ringCount = isRing2 ? RING2_COUNT : RING1_COUNT;
          const R = isRing2 ? R2 : R1;

          // 360° uniformes, empezando desde arriba (-90°)
          const angleDeg = -90 + (360 / ringCount) * ringIdx;
          const angleRad = (angleDeg * Math.PI) / 180;

          // Posición final del centro del ítem
          const finalX = FAB_CX + Math.cos(angleRad) * R - ITEM_HALF;
          const finalY = FAB_BOTTOM + Math.sin(angleRad) * R * -1 - ITEM_HALF;

          // Animar desde el centro del FAB hacia la posición final
          const animLeft = fabItemAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [FAB_CX - ITEM_HALF, finalX],
          });
          const animBottom = fabItemAnims[i].interpolate({
            inputRange: [0, 1],
            outputRange: [FAB_BOTTOM - ITEM_HALF, finalY],
          });

          return (
            <Animated.View
              key={svc.id}
              style={{
                position: 'absolute',
                left: animLeft,
                bottom: animBottom,
                width: ITEM_SIZE,
                alignItems: 'center',
                zIndex: 25,
                opacity: fabItemAnims[i],
              }}
              pointerEvents="box-none"
            >
              <TouchableOpacity
                style={[st.fabRadialBtn, { borderColor: svc.color + '80' }]}
                onPress={() => navigateFab(svc.route)}
                activeOpacity={0.8}
              >
                <SvgIcon id={svc.id} color={svc.color} size={22} />
              </TouchableOpacity>
              <Animated.Text
                style={[st.fabRadialLabel, { opacity: fabItemAnims[i] }]}
                numberOfLines={1}
              >
                {svc.label}
              </Animated.Text>
            </Animated.View>
          );
        });
      })()}

      {/* ════════════════════════════════════════════════════════
          LIA-25 — Asistente flotante ARRASTRABLE
          El usuario puede moverlo a cualquier posición
      ════════════════════════════════════════════════════════ */}
      <Animated.View
        {...liaPanResponder.panHandlers}
        style={[
          st.liaBtn,
          {
            transform: [
              { translateX: liaPan.x },
              { translateY: liaPan.y },
              { scale: liaPulse },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (!liaDragging.current) router.push('/(tabs)/lia' as any);
          }}
        >
          <LinearGradient
            colors={['#00C8A0', '#00B4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.liaBtnGradient}
          >
            <Image
              source={require('../../assets/logo-transparent.png')}
              style={st.liaLogoImg}
              resizeMode="contain"
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ════════════════════════════════════════════════════════
          FAB + — Botón central flotante
      ════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={st.fab}
        activeOpacity={0.9}
        onPress={toggleFab}
      >
        <LinearGradient
          colors={['#1a3a5c', '#0d2d4a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.fabGradient}
        >
          <Animated.View style={{ transform: [{ rotate: fabIconRotation }] }}>
            {fabOpen
              ? <IconClose color="#fff" size={24} />
              : <IconPlus color="#fff" size={28} />
            }
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ════════════════════════════════════════════════════════
          PANELES DEL HEADER
      ════════════════════════════════════════════════════════ */}
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
      <HamburgerMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        user={user}
      />
      <WeatherModal
        visible={showWeather}
        onClose={() => setShowWeather(false)}
        temp={temp}
        city={city}
        condition="cloudy"
      />

    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════
const LIA_BTN_SIZE = 60;
const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // ── Logo header ──────────────────────────────────────────────────
  logoImgWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: '#00C8A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 34,
    height: 34,
    transform: [{ scale: 1.6 }],
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  logoTextBold: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginLeft: -4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerPill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  headerPillText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    borderWidth: 1.5,
    borderColor: Colors.brand,
  },

  // ── Banner Saldo ─────────────────────────────────────────────────
  balanceBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.lg,
  },
  balanceTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
    flex: 1,
  },
  eyeBtn: {
    padding: 4,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  balanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  balanceBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.brand,
    letterSpacing: 0.5,
  },

  // ── Cards ID Digital + Noticias ──────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  infoCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardEmoji: { fontSize: 18 },
  infoCardText: { flex: 1 },
  infoCardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  infoCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── APPS section ─────────────────────────────────────────────────
  appsSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  appsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  appItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  appIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,200,160,0.2)',
    ...Shadow.md,
  },
  appLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // ── FAB overlay ──────────────────────────────────────────────────
  fabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  fabOverlayPress: {
    flex: 1,
  },

  // ── FAB radial items ─────────────────────────────────────────────
  fabRadialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,200,160,0.6)',
    overflow: 'hidden',
  },
  fabRadialEmoji: {
    fontSize: 22,
  },
  fabRadialLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 64,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── LIA-25 flotante arrastrable ──────────────────────────────────
  liaBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 30,
    borderRadius: LIA_BTN_SIZE / 2,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  liaBtnGradient: {
    width: LIA_BTN_SIZE,
    height: LIA_BTN_SIZE,
    borderRadius: LIA_BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liaLogoImg: {
    width: LIA_BTN_SIZE,
    height: LIA_BTN_SIZE,
    borderRadius: LIA_BTN_SIZE / 2,
    transform: [{ scale: 1.5 }],
  },

  // ── FAB + central ────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 68,
    alignSelf: 'center',
    zIndex: 30,
    borderRadius: 30,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
