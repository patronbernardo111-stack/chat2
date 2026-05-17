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
