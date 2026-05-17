import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, {
  Path, Circle, Line, Polyline, Polygon, Rect, G,
} from 'react-native-svg';
import { walletAPI, authAPI } from '../../src/api';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Iconos SVG ────────────────────────────────────────────────────
const Icon = ({ name, size = 22, color = '#374151' }: { name: string; size?: number; color?: string }) => {
  const s = size;
  switch (name) {
    case 'eye':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></Svg>;
    case 'eye-off':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth={2} strokeLinecap="round"/></Svg>;
    case 'upload':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"><Polyline points="16 17 12 21 8 17"/><Line x1="12" y1="12" x2="12" y2="21" stroke={color} strokeWidth={2.2} strokeLinecap="round"/><Path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></Svg>;
    case 'send':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"><Line x1="22" y1="2" x2="11" y2="13" stroke={color} strokeWidth={2.2} strokeLinecap="round"/><Polygon points="22 2 15 22 11 13 2 9 22 2" stroke={color} strokeWidth={2.2} strokeLinecap="round"/></Svg>;
    case 'id-card':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Rect x="2" y="5" width="20" height="14" rx="2"/><Circle cx="8" cy="12" r="2"/><Path d="M14 9h4M14 12h4M14 15h2"/></Svg>;
    case 'news':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><Path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></Svg>;
    case 'chat':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>;
    case 'wallet':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Rect x="2" y="5" width="20" height="14" rx="2"/><Path d="M16 12h2"/><Path d="M2 10h20"/></Svg>;
    case 'services':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Circle cx="12" cy="12" r="3"/><Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></Svg>;
    case 'settings':
      return <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round"><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
    default:
      return null;
  }
};

// ── Widget: Tarjeta de saldo ──────────────────────────────────────
const BalanceCard = ({ balance, loading, visible, onToggle, onRecargar, onEnviar }: {
  balance: number; loading: boolean; visible: boolean;
  onToggle: () => void; onRecargar: () => void; onEnviar: () => void;
}) => (
  <LinearGradient
    colors={['#1A3A6B', '#0E5F8A', '#0A7A8A']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.balanceCard}
  >
    <Text style={styles.balanceLabel}>SALDO DISPONIBLE</Text>
    <TouchableOpacity onPress={onToggle} style={styles.balanceRow} activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : visible ? (
        <Text style={styles.balanceAmount}>
          {balance.toLocaleString('es-ES')} <Text style={styles.balanceCurrency}>XAF</Text>
        </Text>
      ) : (
        <Text style={styles.balanceHidden}>● ● ● ●</Text>
      )}
      <View style={{ marginLeft: 8 }}>
        <Icon name={visible ? 'eye-off' : 'eye'} size={14} color="rgba(255,255,255,0.5)" />
      </View>
    </TouchableOpacity>

    <View style={styles.balanceBtns}>
      <TouchableOpacity onPress={onRecargar} style={styles.balanceBtn} activeOpacity={0.85}>
        <View style={styles.balanceBtnIcon}>
          <Icon name="upload" size={12} color="#92400E" />
        </View>
        <Text style={styles.balanceBtnText}>RECARGAR</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onEnviar} style={styles.balanceBtn} activeOpacity={0.85}>
        <View style={styles.balanceBtnIcon}>
          <Icon name="send" size={12} color="#065F46" />
        </View>
        <Text style={styles.balanceBtnText}>ENVIAR</Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

// ── Widget: Tarjeta pequeña ───────────────────────────────────────
const SmallCard = ({ icon, title, subtitle, color, onPress }: {
  icon: string; title: string; subtitle: string; color: string; onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.smallCard} activeOpacity={0.75}>
    <View style={styles.smallCardHeader}>
      <Icon name={icon} size={14} color={color} />
      <Text style={styles.smallCardTitle}>{title}</Text>
    </View>
    <Text style={styles.smallCardSub}>{subtitle}</Text>
  </TouchableOpacity>
);

// ── Widget: App icon ──────────────────────────────────────────────
const AppIcon = ({ label, emoji, onPress }: {
  label: string; emoji: string; onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.appIcon} activeOpacity={0.75}>
    <View style={styles.appIconBox}>
      <Text style={styles.appIconEmoji}>{emoji}</Text>
    </View>
    <Text style={styles.appIconLabel} numberOfLines={1}>{label}</Text>
  </TouchableOpacity>
);

// ── Pantalla Home ─────────────────────────────────────────────────
export default function HomeScreen() {
  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [userName, setUserName] = useState('');
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    // Cargar saldo
    walletAPI.getBalance()
      .then(d => setBalance(d?.balance ?? 0))
      .catch(() => setBalance(0))
      .finally(() => setBalanceLoading(false));

    // Cargar nombre de usuario
    authAPI.me()
      .then(u => setUserName(u?.full_name?.split(' ')[0] || ''))
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      {/* ── Header con gradiente ── */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerEG}>EG</Text>
          <Text style={styles.headerChat}>CHAT</Text>
        </View>
        {userName ? (
          <Text style={styles.headerGreeting}>Hola, {userName} 👋</Text>
        ) : null}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Widget saldo ── */}
        <BalanceCard
          balance={balance}
          loading={balanceLoading}
          visible={balanceVisible}
          onToggle={() => setBalanceVisible(v => !v)}
          onRecargar={() => router.push('/(tabs)/monedero' as any)}
          onEnviar={() => router.push('/(tabs)/monedero' as any)}
        />

        {/* ── Tarjetas pequeñas ── */}
        <View style={styles.smallCards}>
          <SmallCard
            icon="id-card"
            title="ID Digital"
            subtitle="Verificado ✓"
            color="#6B5BD6"
            onPress={() => Alert.alert('ID Digital', 'Próximamente')}
          />
          <SmallCard
            icon="news"
            title="Noticias"
            subtitle="8 nuevas"
            color="#EF4444"
            onPress={() => Alert.alert('Noticias', 'Próximamente')}
          />
        </View>

        {/* ── Accesos rápidos — Apps ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>APPS</Text>
          <View style={styles.appsGrid}>
            <AppIcon label="Estados"  emoji="📸" onPress={() => router.push('/stories' as any)} />
            <AppIcon label="Juegos"   emoji="🎮" onPress={() => router.push('/apuestas' as any)} />
            <AppIcon label="Cemac"    emoji="🌍" onPress={() => router.push('/cemac' as any)} />
            <AppIcon label="MiTaxi"   emoji="🚕" onPress={() => router.push('/mitaxi' as any)} />
          </View>
        </View>

        {/* ── Accesos rápidos — Secciones ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>ACCESOS RÁPIDOS</Text>
          <View style={styles.quickGrid}>
            {[
              { label: 'Mensajes',  icon: 'chat',     color: '#00B4E6', route: '/(tabs)/index'     },
              { label: 'Cartera',   icon: 'wallet',   color: '#00C8A0', route: '/(tabs)/monedero'  },
              { label: 'Servicios', icon: 'services', color: '#8B5CF6', route: '/(tabs)/servicios' },
              { label: 'Ajustes',   icon: 'settings', color: '#6B7280', route: '/(tabs)/ajustes'   },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={[styles.quickCard, { borderColor: item.color + '30' }]}
                activeOpacity={0.75}
              >
                <Icon name={item.icon} size={22} color={item.color} />
                <Text style={[styles.quickLabel, { color: C.textPrimary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Últimas noticias ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>ÚLTIMAS NOTICIAS</Text>
          {[
            'Nuevas inversiones en Malabo',
            'Actualización del sistema bancario',
            'Festival cultural de Bata',
          ].map((noticia, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.newsItem, { backgroundColor: C.bgSecondary, borderColor: C.borderLight }]}
              activeOpacity={0.7}
            >
              <View style={styles.newsDot} />
              <Text style={[styles.newsText, { color: C.textPrimary }]}>{noticia}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  headerEG:   { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerChat: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

  // Scroll
  scroll: { padding: 16, gap: 12 },

  // Balance card
  balanceCard: {
    borderRadius: 20,
    padding: 18,
    ...Shadow.lg,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 32,
  },
  balanceCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  balanceHidden: {
    fontSize: 22,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)',
  },
  balanceBtns: { flexDirection: 'row', gap: 8 },
  balanceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    ...Shadow.sm,
  },
  balanceBtnIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  balanceBtnText: { fontSize: 12, fontWeight: '700', color: '#1A2B4A' },

  // Small cards
  smallCards: { flexDirection: 'row', gap: 10 },
  smallCard: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  smallCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  smallCardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  smallCardSub:   { fontSize: 12, color: Colors.textSecondary },

  // Section
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Apps grid
  appsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  appIcon: { alignItems: 'center', gap: 6, width: 72 },
  appIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    ...Shadow.md,
  },
  appIconEmoji: { fontSize: 30 },
  appIconLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Quick access grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '47%',
    backgroundColor: 'rgba(243,244,246,0.85)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'flex-start',
    gap: 8,
    ...Shadow.sm,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  // News
  newsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  newsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    flexShrink: 0,
  },
  newsText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
  },
});
