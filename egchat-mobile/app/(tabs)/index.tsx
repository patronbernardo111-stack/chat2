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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { walletAPI, authAPI } from '../../src/api';
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
  { id: 'estados',  icon: '🌀', label: 'Estados',  route: '/stories'   },
  { id: 'juegos',   icon: '🎮', label: 'Juegos',   route: '/apuestas'  },
  { id: 'cemac',    icon: '🌍', label: 'Cemac',    route: '/cemac'     },
  { id: 'mitaxi',   icon: '🚕', label: 'MiTaxi',   route: '/mitaxi'    },
];

// ── TODOS los servicios del FAB + (igual que la versión web) ──────
const FAB_SERVICES = [
  // Fila 1
  { id: 'mensajes',     icon: '💬', label: 'Mensajes',     route: '/mensajeria'        },
  { id: 'cartera',      icon: '💳', label: 'Cartera',      route: '/(tabs)/monedero'   },
  { id: 'taxi',         icon: '🚕', label: 'MiTaxi',       route: '/mitaxi'            },
  { id: 'electricidad', icon: '⚡', label: 'Electricidad', route: '/(tabs)/servicios'  },
  // Fila 2
  { id: 'agua',         icon: '💧', label: 'Agua',         route: '/(tabs)/servicios'  },
  { id: 'internet',     icon: '🌐', label: 'Internet',     route: '/(tabs)/servicios'  },
  { id: 'recarga',      icon: '📱', label: 'Recarga',      route: '/(tabs)/servicios'  },
  { id: 'tv',           icon: '📺', label: 'Canales TV',   route: '/(tabs)/servicios'  },
  // Fila 3
  { id: 'bancos',       icon: '🏦', label: 'Bancos',       route: '/bancos'            },
  { id: 'salud',        icon: '🏥', label: 'Salud',        route: '/seguros-salud'     },
  { id: 'impuestos',    icon: '📋', label: 'Impuestos',    route: '/(tabs)/servicios'  },
  { id: 'correos',      icon: '📮', label: 'Correos',      route: '/(tabs)/servicios'  },
  // Fila 4
  { id: 'seguros',      icon: '🛡️', label: 'Seguros',      route: '/seguros-salud'     },
  { id: 'super',        icon: '🛒', label: 'Supermercado', route: '/supermercados'     },
  { id: 'restaurantes', icon: '🍽️', label: 'Restaurantes', route: '/(tabs)/servicios'  },
  { id: 'vuelos',       icon: '✈️', label: 'Vuelos',       route: '/(tabs)/servicios'  },
  // Fila 5
  { id: 'gasolineras',  icon: '⛽', label: 'Gasolineras',  route: '/(tabs)/servicios'  },
  { id: 'cemac',        icon: '🌍', label: 'Zona CEMAC',   route: '/cemac'             },
  { id: 'ocio',         icon: '🎭', label: 'Ocio',         route: '/ocio'              },
  { id: 'apuestas',     icon: '🎰', label: 'Apuestas',     route: '/apuestas'          },
];

// ── Componente AppIcon (grid home) ────────────────────────────────
const AppIcon = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={st.appItem} onPress={onPress} activeOpacity={0.75}>
    <View style={st.appIconBox}>
      <Text style={st.appEmoji}>{icon}</Text>
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

  // Animaciones FAB — una por cada servicio
  const fabRotate = useRef(new Animated.Value(0)).current;
  const fabOverlayOpacity = useRef(new Animated.Value(0)).current;
  const fabItemAnims = useRef(FAB_SERVICES.map(() => new Animated.Value(0))).current;

  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

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
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>

      {/* ════════════════════════════════════════════════════════
          HEADER — Logo + Temperatura + Campanita + Menú
      ════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={st.header}
      >
        {/* Logo real de la app */}
        <View style={st.headerLogo}>
          <View style={st.logoImgWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={st.logoImg}
              resizeMode="cover"
            />
          </View>
          <Text style={st.logoText}>EG</Text>
          <Text style={st.logoTextBold}>CHAT</Text>
        </View>

        {/* Acciones derechas */}
        <View style={st.headerRight}>
          {/* Temperatura */}
          <TouchableOpacity style={st.headerPill} activeOpacity={0.8}>
            <Text style={st.headerPillText}>☁️ {temp} {city}</Text>
          </TouchableOpacity>

          {/* Campanita */}
          <TouchableOpacity style={st.headerIconBtn} activeOpacity={0.8}>
            <IconBell color="#fff" size={20} />
            {/* Badge notificaciones */}
            <View style={st.notifBadge} />
          </TouchableOpacity>

          {/* Tres barras */}
          <TouchableOpacity
            style={st.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/ajustes' as any)}
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
                icon={app.icon}
                label={app.label}
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
          FAB RADIAL — iconos en círculo alrededor del botón +
          8 ítems en arco superior (180°), resto en scroll
      ════════════════════════════════════════════════════════ */}
      {fabOpen && FAB_SERVICES.map((svc, i) => {
        // Distribuimos los ítems en arco de 200° centrado arriba del FAB
        // Ángulo: de -260° a -60° (arco superior de 200°)
        const total = FAB_SERVICES.length;
        const startAngle = -260; // grados
        const endAngle   = -60;
        const step = (endAngle - startAngle) / (total - 1);
        const angleDeg = startAngle + step * i;
        const angleRad = (angleDeg * Math.PI) / 180;
        const RADIUS = 115; // px desde el centro del FAB

        // translateX/Y animados: van de 0 → posición final
        const tx = fabItemAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(angleRad) * RADIUS],
        });
        const ty = fabItemAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(angleRad) * RADIUS],
        });

        return (
          <Animated.View
            key={svc.id}
            style={[
              st.fabRadialItem,
              {
                opacity: fabItemAnims[i],
                transform: [{ translateX: tx }, { translateY: ty }],
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={st.fabRadialBtn}
              onPress={() => navigateFab(svc.route)}
              activeOpacity={0.8}
            >
              <Text style={st.fabRadialEmoji}>{svc.icon}</Text>
            </TouchableOpacity>
            <Animated.Text
              style={[st.fabRadialLabel, { opacity: fabItemAnims[i] }]}
              numberOfLines={1}
            >
              {svc.label}
            </Animated.Text>
          </Animated.View>
        );
      })}

      {/* ════════════════════════════════════════════════════════
          LIA-25 — Asistente flotante (círculo derecho)
      ════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={st.liaBtn}
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/lia' as any)}
      >
        <LinearGradient
          colors={['#00C8A0', '#00B4E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.liaBtnGradient}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={st.liaLogoImg}
            resizeMode="cover"
          />
        </LinearGradient>
      </TouchableOpacity>

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

    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════
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
    paddingVertical: Spacing.md,
    paddingTop: Platform.OS === 'android' ? Spacing.md : Spacing.sm,
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
  },
  logoImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  appEmoji: { fontSize: 32 },
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
  // Cada ítem se posiciona absolutamente centrado sobre el FAB
  // y se desplaza con translateX/Y animado
  fabRadialItem: {
    position: 'absolute',
    // Centrado sobre el FAB (60px de diámetro → 30px de radio)
    bottom: 68 + 30 - 28,   // centro FAB - mitad del botón radial
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 25,
    width: 56,
    marginLeft: -28,        // centrar horizontalmente
  },
  fabRadialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
    borderWidth: 1,
    borderColor: 'rgba(0,200,160,0.2)',
  },
  fabRadialEmoji: {
    fontSize: 24,
  },
  fabRadialLabel: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 64,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── LIA-25 flotante ──────────────────────────────────────────────
  liaBtn: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 90,
    zIndex: 30,
    ...Shadow.lg,
  },
  liaBtnGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  liaLogoImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },

  // ── FAB + central ────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    bottom: 68,
    alignSelf: 'center',
    zIndex: 30,
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
