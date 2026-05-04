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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chatAPI } from '../../src/api';
import { EGAvatar } from '../../src/components/ui';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
} from '../../src/theme';

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

  const loadChats = useCallback(async () => {
    try {
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
    // Obtener usuario actual
    import('../../src/api').then(({ authAPI }) => {
      authAPI.getMe?.().then((u: any) => setCurrentUserId(u?.id || ''));
    });
  }, []);

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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        {showSearch ? (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClose={() => { setShowSearch(false); setSearchQuery(''); }}
          />
        ) : (
          <>
            <Text style={styles.headerTitle}>Mensajes</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowSearch(true)}
                style={styles.headerBtn}
              >
                <Text style={styles.headerBtnIcon}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/new-chat' as any)}
                style={[styles.headerBtn, styles.headerBtnAccent]}
              >
                <Text style={styles.headerBtnIconWhite}>✏️</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Lista ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'Sin resultados' : 'No tienes chats aún'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Prueba con otro nombre' : 'Busca un contacto para empezar'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              onPress={() => setShowSearch(true)}
              style={styles.emptyBtn}
            >
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
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
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    ...Typography.headerTitle,
    color: Colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
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

  // Estados vacíos
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
