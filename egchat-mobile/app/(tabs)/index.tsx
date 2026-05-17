import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chatAPI, storiesAPI, getToken } from '../../src/api';
import { EGAvatar, OfflineBanner } from '../../src/components/ui';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── StoryBubble ───────────────────────────────────────────────────
const StoryBubble = ({ story, onPress }: { story: any; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={stylesStory.bubble} activeOpacity={0.8}>
    <View style={[stylesStory.ring, story.media?.length > 0 && stylesStory.ringActive]}>
      <EGAvatar src={story.avatar} name={story.userName || 'Estado'} size={48} />
    </View>
    <Text style={stylesStory.name} numberOfLines={1}>{story.userName || 'Mi estado'}</Text>
  </TouchableOpacity>
);

const stylesStory = StyleSheet.create({
  bubble: { alignItems: 'center', width: 64, gap: 4 },
  ring: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  ringActive: { borderColor: Colors.accent, borderWidth: 2.5 },
  name: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', maxWidth: 60 },
});

interface Chat {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar_url?: string;
  participants: Array<{
    user_id: string;
    full_name?: string;
    avatar_url?: string;
  }>;
  last_message?: {
    text?: string;
    type: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
  updated_at: string;
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Ayer';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const getLastMessageText = (msg?: Chat['last_message']) => {
  if (!msg) return '';
  if (msg.type === 'text') return msg.text || '';
  if (msg.type === 'image') return '📷 Foto';
  if (msg.type === 'video') return '🎥 Video';
  if (msg.type === 'audio') return '🎵 Audio';
  if (msg.type === 'file') return '📄 Archivo';
  return 'Mensaje';
};

// ── ChatItem ──────────────────────────────────────────────────────────────────
const ChatItem = React.memo(({ chat, currentUserId, onPress }: {
  chat: Chat;
  currentUserId: string;
  onPress: () => void;
}) => {
  const other = chat.participants.find(p => p.user_id !== currentUserId);
  const chatName = chat.type === 'private'
    ? other?.full_name || 'Usuario'
    : chat.name || 'Grupo';
  const avatarSrc = chat.type === 'private' ? other?.avatar_url : chat.avatar_url;
  const lastMsg = getLastMessageText(chat.last_message);
  const time = formatTime(chat.updated_at);
  const hasUnread = chat.unread_count > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.chatItem}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <EGAvatar src={avatarSrc} name={chatName} size={48} />

      {/* Info */}
      <View style={styles.chatInfo}>
        {/* Fila 1: nombre + hora */}
        <View style={styles.chatRow}>
          <Text style={styles.chatName} numberOfLines={1}>{chatName}</Text>
          <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>
            {time}
          </Text>
        </View>

        {/* Fila 2: último mensaje + badge */}
        <View style={styles.chatRow}>
          <Text style={styles.chatMsg} numberOfLines={1}>{lastMsg}</Text>
          {hasUnread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {chat.unread_count > 99 ? '99+' : chat.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── SearchBar ─────────────────────────────────────────────────────────────────
const SearchBar = ({ value, onChangeText, onClose }: {
  value: string;
  onChangeText: (t: string) => void;
  onClose: () => void;
}) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      value={value}
      onChangeText={onChangeText}
      placeholder="Buscar usuarios..."
      placeholderTextColor={Colors.textTertiary}
      autoFocus
    />
    <TouchableOpacity onPress={onClose} style={styles.searchClose}>
      <Text style={styles.searchCloseText}>✕</Text>
    </TouchableOpacity>
  </View>
);

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function MensajesScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [stories, setStories] = useState<any[]>([]);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadChats = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return; // Sin sesión, el layout redirigirá al login
      const data = await chatAPI.getChats();
      setChats(data || []);
    } catch (e) {
      console.error('Error cargando chats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
    // Obtener usuario actual del token
    import('../../src/api').then(({ getToken }) => {
      getToken().then((token: string | null) => {
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setCurrentUserId(payload.id || '');
          } catch {}
        }
      });
    });
    // Cargar stories
    storiesAPI.getAll().then((data: any) => {
      if (Array.isArray(data)) setStories(data.filter((s: any) => s.media?.length > 0).slice(0, 8));
    }).catch(() => {});
  }, []);

  // Supabase Realtime — actualizar lista cuando llegan mensajes nuevos
  useEffect(() => {
    if (!currentUserId) return;
    const { subscribeToUserChats } = require('../../src/supabase');
    const unsubscribe = subscribeToUserChats(currentUserId, () => {
      loadChats();
    });
    return unsubscribe;
  }, [currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const filteredChats = searchQuery
    ? chats.filter(c => {
        const other = c.participants.find(p => p.user_id !== currentUserId);
        const name = c.type === 'private' ? other?.full_name : c.name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : chats;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <OfflineBanner />
      {/* ── Header con gradiente idéntico a la web ── */}
      {showSearch ? (
        <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          <View style={[styles.searchContainer, { backgroundColor: C.bgInput }]}>
            <TextInput
              style={[styles.searchInput, { color: C.textPrimary }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar usuarios..."
              placeholderTextColor={C.textTertiary}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }} style={styles.searchClose}>
              <Text style={[styles.searchCloseText, { color: C.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <LinearGradient
          colors={['#00C8A0', '#00B4E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Logo + título */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitleGradient}>EG</Text>
            <Text style={styles.headerTitleGradient2}>CHAT</Text>
          </View>
          {/* Acciones */}
          <View style={styles.headerActions}>
            {/* Contactos */}
            <TouchableOpacity onPress={() => router.push('/contacts' as any)} style={styles.headerBtnGradient}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <Circle cx="9" cy="7" r="4"/>
                <Path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <Path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </Svg>
            </TouchableOpacity>
            {/* Buscar */}
            <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.headerBtnGradient}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
                <Circle cx="11" cy="11" r="8"/>
                <Path d="M21 21l-4.35-4.35"/>
              </Svg>
            </TouchableOpacity>
            {/* Nuevo chat */}
            <TouchableOpacity onPress={() => router.push('/new-chat' as any)} style={styles.headerBtnGradient}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      {/* ── Stories ── */}
      {stories.length > 0 && (
        <View style={[styles.storiesContainer, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
            <StoryBubble story={{ userName: 'Mi estado', media: [] }} onPress={() => router.push('/stories' as any)} />
            {stories.map((s: any) => (
              <StoryBubble key={s.id} story={s} onPress={() => router.push('/stories' as any)} />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>
            {searchQuery ? 'Sin resultados' : 'No tienes chats aún'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: C.textSecondary }]}>
            {searchQuery ? 'Prueba con otro nombre' : 'Busca un contacto para empezar'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Buscar usuarios</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatItem
              chat={item}
              currentUserId={currentUserId}
              onPress={() => router.push(`/chat/${item.id}` as any)}
            />
          )}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: C.borderLight }]} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} colors={[Colors.accent]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingVertical: Spacing.md,
    // gradiente aplicado via LinearGradient
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 1,
  },
  headerTitleGradient: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerTitleGradient2: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerTitle: {
    ...Typography.headerTitle,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  headerBtnGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnAccent: {
    backgroundColor: Colors.accent,
  },
  headerBtnIcon: {
    fontSize: 16,
  },
  headerBtnIconWhite: {
    fontSize: 16,
  },

  // Search
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
  },
  searchClose: {
    padding: Spacing.xs,
  },
  searchCloseText: {
    fontSize: FontSize.base,
    color: Colors.textTertiary,
  },

  // Chat item — igual que .eg-list-item del web
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.listItemGap,
  },
  chatInfo: {
    flex: 1,
    gap: 3,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // .wa-name
  chatName: {
    ...Typography.chatName,
    flex: 1,
    marginRight: Spacing.sm,
  },
  // .wa-time
  chatTime: {
    ...Typography.timestamp,
    color: Colors.textTertiary,
  },
  chatTimeUnread: {
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },
  // .wa-subtitle
  chatMsg: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },

  // Badge — igual que .eg-badge del web
  badge: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.badge,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    ...Typography.badge,
    color: Colors.white,
  },

  // Separador — igual que border-bottom del web
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.listItemPaddingH + 48 + Spacing.listItemGap, // alineado tras el avatar
  },

  storiesContainer: {
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  storiesScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.chatHeaderName,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyBtnText: {
    color: Colors.white,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
  },
});
