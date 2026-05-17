// ══════════════════════════════════════════════════════════════════
// EGCHAT — Mensajería (fiel a la versión web)
// Header: logo + temp + bell + menu
// Barra búsqueda + botón +
// Secciones: Contactos Favoritos, Grupos Favoritos
// Filtros: Individual | Grupos | Dinero
// Lista de chats con avatar, nombre, último msg, hora, badge
// FAB refresh + LIA-25 flotante
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl,
  ScrollView, Image, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Rect, Polyline } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chatAPI, storiesAPI, getToken } from '../../src/api';
import { EGAvatar, OfflineBanner } from '../../src/components/ui';
import { NotificationsPanel, HamburgerMenu, WeatherModal, AppNotification } from '../../src/components/HeaderPanels';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Tipos ─────────────────────────────────────────────────────────
interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: Array<{ user_id: string; full_name?: string; avatar_url?: string }>;
  last_message?: { text?: string; type: string; created_at: string; sender_id: string };
  unread_count: number;
  updated_at: string;
}

type FilterType = 'individual' | 'grupos' | 'dinero';

// ── Helpers ───────────────────────────────────────────────────────
const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const getLastMessageText = (msg?: Chat['last_message']) => {
  if (!msg) return 'Sin mensajes';
  if (msg.type === 'text') return msg.text || '';
  if (msg.type === 'image') return '📷 Foto';
  if (msg.type === 'video') return '🎥 Video';
  if (msg.type === 'audio') return '🎵 Audio';
  if (msg.type === 'file') return '📄 Archivo';
  return 'Mensaje';
};

// ── Iconos SVG ────────────────────────────────────────────────────
const IconBell = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <Path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </Svg>
);
const IconMenu = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
    <Line x1="3" y1="6" x2="21" y2="6"/>
    <Line x1="3" y1="12" x2="21" y2="12"/>
    <Line x1="3" y1="18" x2="21" y2="18"/>
  </Svg>
);
const IconSearch = ({ color = Colors.textTertiary }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx="11" cy="11" r="8"/>
    <Path d="M21 21l-4.35-4.35"/>
  </Svg>
);
const IconRefresh = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 4 23 10 17 10"/>
    <Path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </Svg>
);

// ── ChatItem ──────────────────────────────────────────────────────
const ChatItem = React.memo(({ chat, currentUserId, onPress }: {
  chat: Chat; currentUserId: string; onPress: () => void;
}) => {
  const other = chat.participants.find(p => p.user_id !== currentUserId);
  const chatName = chat.type === 'private'
    ? (other?.full_name || 'Usuario')
    : (chat.name || 'Grupo');
  const avatarSrc = chat.type === 'private' ? other?.avatar_url : chat.avatar_url;
  const lastMsg = getLastMessageText(chat.last_message);
  const time = formatTime(chat.updated_at);
  const hasUnread = chat.unread_count > 0;

  return (
    <TouchableOpacity onPress={onPress} style={st.chatItem} activeOpacity={0.7}>
      <EGAvatar src={avatarSrc} name={chatName} size={50} />
      <View style={st.chatInfo}>
        <View style={st.chatRow}>
          <Text style={st.chatName} numberOfLines={1}>{chatName}</Text>
          {time ? <Text style={[st.chatTime, hasUnread && st.chatTimeUnread]}>{time}</Text> : null}
        </View>
        <View style={st.chatRow}>
          <Text style={st.chatMsg} numberOfLines={1}>{lastMsg}</Text>
          {hasUnread && (
            <View style={st.badge}>
              <Text style={st.badgeText}>{chat.unread_count > 99 ? '99+' : chat.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── FavoriteEmpty ─────────────────────────────────────────────────
const FavoriteSection = ({
  title, empty, C,
}: { title: string; empty: string; C: typeof Colors }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <View style={st.favSection}>
      <TouchableOpacity
        style={st.favHeader}
        onPress={() => setCollapsed(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={[st.favTitle, { color: C.textTertiary }]}>{title}</Text>
        <Text style={[st.favToggle, { color: C.textTertiary }]}>{collapsed ? '+' : '−'}</Text>
      </TouchableOpacity>
      {!collapsed && (
        <Text style={[st.favEmpty, { color: C.textTertiary }]}>{empty}</Text>
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function MensajeriaScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [filter, setFilter] = useState<FilterType>('individual');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  // ── Carga ───────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await chatAPI.getChats();
      setChats(data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadChats();
    // Obtener userId del token
    getToken().then((token: string | null) => {
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.id || '');
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const { subscribeToUserChats } = require('../../src/supabase');
    const unsub = subscribeToUserChats(currentUserId, loadChats);
    return unsub;
  }, [currentUserId]);

  const onRefresh = () => { setRefreshing(true); loadChats(); };

  // ── Filtrado ────────────────────────────────────────────────────
  const filtered = chats.filter(c => {
    // Filtro de búsqueda
    if (searchQuery) {
      const other = c.participants.find(p => p.user_id !== currentUserId);
      const name = c.type === 'private' ? other?.full_name : c.name;
      if (!name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    // Filtro de tab
    if (filter === 'individual') return c.type === 'private';
    if (filter === 'grupos') return c.type === 'group';
    if (filter === 'dinero') {
      const txt = c.last_message?.text || '';
      return txt.includes('XAF') || txt.includes('💸') || txt.includes('Transferencia');
    }
    return true;
  });

  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <OfflineBanner />

      {/* ══════════════════════════════════════════════════════════
          HEADER — Logo + Temp + Bell + Menu (igual que Home)
      ══════════════════════════════════════════════════════════ */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={st.header}
      >
        {/* Logo */}
        <View style={st.headerLogo}>
          <View style={st.logoWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={st.logoImg}
              resizeMode="cover"
            />
          </View>
          <Text style={st.logoText}>EG</Text>
          <Text style={st.logoText}>CHAT</Text>
        </View>

        {/* Acciones */}
        <View style={st.headerRight}>
          <TouchableOpacity style={st.headerPill} activeOpacity={0.8} onPress={() => setShowWeather(true)}>
            <Text style={st.headerPillText}>☁️ 27° Malabo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => {
              setShowNotifications(true);
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}
          >
            <IconBell />
            {notifications.some(n => !n.read) && <View style={st.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={st.headerIconBtn}
            activeOpacity={0.8}
            onPress={() => setShowMenu(true)}
          >
            <IconMenu />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ══════════════════════════════════════════════════════════
          BARRA BÚSQUEDA + BOTÓN +
      ══════════════════════════════════════════════════════════ */}
      <View style={[st.searchBar, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <View style={[st.searchInput, { backgroundColor: C.bgTertiary, borderColor: C.border }]}>
          <IconSearch color={C.textTertiary} />
          <TextInput
            style={[st.searchText, { color: C.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar..."
            placeholderTextColor={C.textTertiary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={st.searchClear}>
              <Text style={{ color: C.textTertiary, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Botón + nuevo chat */}
        <TouchableOpacity
          style={st.newChatBtn}
          onPress={() => router.push('/new-chat' as any)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#00C8A0', '#00B4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.newChatBtnGrad}
          >
            <Text style={st.newChatBtnIcon}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} colors={[Colors.brand]} />
        }
        stickyHeaderIndices={[2]} // los filtros se quedan fijos al hacer scroll
      >
        {/* ══════════════════════════════════════════════════════
            CONTACTOS FAVORITOS
        ══════════════════════════════════════════════════════ */}
        <FavoriteSection
          title="CONTACTOS FAVORITOS"
          empty="No tienes contactos favoritos aún"
          C={C}
        />

        {/* ══════════════════════════════════════════════════════
            GRUPOS FAVORITOS
        ══════════════════════════════════════════════════════ */}
        <FavoriteSection
          title="GRUPOS FAVORITOS"
          empty="No tienes grupos favoritos aún"
          C={C}
        />

        {/* ══════════════════════════════════════════════════════
            FILTROS — Individual | Grupos | Dinero (sticky)
        ══════════════════════════════════════════════════════ */}
        <View style={[st.filtersWrap, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filtersRow}>
            {([
              { id: 'individual', label: 'Individual', icon: '👤' },
              { id: 'grupos',     label: 'Grupos',     icon: '👥' },
              { id: 'dinero',     label: 'Dinero',     icon: '💵' },
            ] as { id: FilterType; label: string; icon: string }[]).map(f => (
              <TouchableOpacity
                key={f.id}
                style={[st.filterChip, filter === f.id && st.filterChipActive]}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.75}
              >
                <Text style={[st.filterText, filter === f.id && st.filterTextActive]}>
                  {f.icon} {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════
            LISTA DE CHATS
        ══════════════════════════════════════════════════════ */}
        {loading ? (
          <View style={st.center}>
            <ActivityIndicator size="large" color={Colors.brand} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={st.center}>
            <Text style={st.emptyIcon}>💬</Text>
            <Text style={[st.emptyTitle, { color: C.textPrimary }]}>
              {searchQuery ? 'Sin resultados' : 'No tienes chats aún'}
            </Text>
            <Text style={[st.emptySub, { color: C.textSecondary }]}>
              {searchQuery ? 'Prueba con otro nombre' : 'Toca + para empezar una conversación'}
            </Text>
          </View>
        ) : (
          <View>
            {filtered.map((item, i) => (
              <View key={item.id}>
                <ChatItem
                  chat={item}
                  currentUserId={currentUserId}
                  onPress={() => router.push(`/chat/${item.id}` as any)}
                />
                {i < filtered.length - 1 && (
                  <View style={[st.separator, { backgroundColor: C.borderLight }]} />
                )}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </View>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════
          FAB REFRESH — botón circular verde abajo derecha
      ══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={st.fabRefresh}
        onPress={onRefresh}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#00C8A0', '#00B4E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.fabGradient}
        >
          <IconRefresh />
        </LinearGradient>
      </TouchableOpacity>

      {/* ══════════════════════════════════════════════════════════
          LIA-25 — asistente flotante (igual que Home)
      ══════════════════════════════════════════════════════════ */}
      <TouchableOpacity
        style={st.liaBtn}
        onPress={() => router.push('/(tabs)/lia' as any)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#e91e8c', '#9c27b0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.liaBtnGrad}
        >
          <Text style={st.liaIcon}>🧠</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ══════════════════════════════════════════════════════════
          PANELES DEL HEADER
      ══════════════════════════════════════════════════════════ */}
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
      />
      <WeatherModal
        visible={showWeather}
        onClose={() => setShowWeather(false)}
        temp="27°"
        city="Malabo"
        condition="cloudy"
      />

    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS
// ══════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoWrap: {
    width: 34, height: 34, borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoImg: { width: 34, height: 34, borderRadius: 17 },
  logoText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerPill: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: 6,
  },
  headerPillText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute', top: 7, right: 7,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF4444',
    borderWidth: 1.5, borderColor: Colors.brand,
  },

  // ── Barra búsqueda ───────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    padding: 0,
  },
  searchClear: { padding: 2 },
  newChatBtn: {
    width: 44, height: 44, borderRadius: 10,
    ...Shadow.sm,
  },
  newChatBtnGrad: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  newChatBtnIcon: {
    fontSize: 26, color: '#fff', fontWeight: '300', lineHeight: 30,
  },

  // ── Secciones favoritos ──────────────────────────────────────────
  favSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  favHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  favTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
    letterSpacing: 0.8,
  },
  favToggle: {
    fontSize: 18,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  favEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    paddingVertical: Spacing.sm,
  },

  // ── Filtros ──────────────────────────────────────────────────────
  filtersWrap: {
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.sm,
  },
  filtersRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.brand,
    borderColor: Colors.brand,
  },
  filterText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },

  // ── Chat item ────────────────────────────────────────────────────
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.listItemGap,
  },
  chatInfo: { flex: 1, gap: 3 },
  chatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatName: { ...Typography.chatName, flex: 1, marginRight: Spacing.sm },
  chatTime: { ...Typography.timestamp, color: Colors.textTertiary },
  chatTimeUnread: { color: Colors.accent, fontWeight: FontWeight.semibold },
  chatMsg: { ...Typography.subtitle, color: Colors.textSecondary, flex: 1, marginRight: Spacing.sm },
  badge: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.badge,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText: { ...Typography.badge, color: Colors.white },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.listItemPaddingH + 50 + Spacing.listItemGap,
  },

  // ── Empty state ──────────────────────────────────────────────────
  center: { alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding, paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  // ── FAB Refresh ──────────────────────────────────────────────────
  fabRefresh: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    zIndex: 20,
    ...Shadow.lg,
  },
  fabGradient: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── LIA-25 flotante ──────────────────────────────────────────────
  liaBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    zIndex: 20,
    ...Shadow.lg,
  },
  liaBtnGrad: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  liaIcon: { fontSize: 22 },
});
