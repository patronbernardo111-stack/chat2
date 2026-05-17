import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Modal, Pressable, Alert, Dimensions, ScrollView, Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { chatAPI, authAPI } from '../../src/api';
import { haptics } from '../../src/hooks/useHaptics';
import { subscribeToChat } from '../../src/supabase';
import { EGAvatar } from '../../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import Svg, { Path, Circle, Line, Polyline, Polygon, Rect } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;

// ── Tipos ─────────────────────────────────────────────────────────
interface Message {
  id: string;
  text?: string;
  type: string;
  sender_id: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  reply_to?: string;
  file_url?: string;
  created_at: string;
  sender?: { id: string; full_name: string; avatar_url?: string };
}

// ── Helpers ───────────────────────────────────────────────────────
const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getDateLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
};

// ── StatusTicks ───────────────────────────────────────────────────
const StatusTicks = ({ status }: { status: Message['status'] }) => {
  const color = status === 'read' ? '#53bdeb' : Colors.textTertiary;
  if (status === 'pending') return <Text style={{ color, fontSize: 11 }}>○</Text>;
  if (status === 'sent') return <Text style={{ color, fontSize: 11 }}>✓</Text>;
  if (status === 'failed') return <Text style={{ color: Colors.error, fontSize: 11 }}>❌</Text>;
  return <Text style={{ color, fontSize: 11 }}>✓✓</Text>;
};

// ── TypingIndicator ───────────────────────────────────────────────
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { transform: [{ translateY: dot }] }]} />
        ))}
      </View>
    </View>
  );
};

// ── ChatDrawer ────────────────────────────────────────────────────

interface DrawerItem {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
  section?: 'main' | 'config' | 'actions' | 'danger';
}

const ChatDrawer = ({
  visible,
  onClose,
  chatName,
  chatAvatar,
  chatInitials,
  isGroup,
  isOnline,
  items,
  isDark = false,
}: {
  visible: boolean;
  onClose: () => void;
  chatName: string;
  chatAvatar?: string;
  chatInitials?: string;
  isGroup?: boolean;
  isOnline?: boolean;
  items: DrawerItem[];
  isDark?: boolean;
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const sections: Array<DrawerItem['section']> = ['main', 'config', 'actions', 'danger'];
  const grouped = sections.map(s => items.filter(i => i.section === s)).filter(g => g.length > 0);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={drawerStyles.root}>
        {/* Overlay */}
        <Animated.View style={[drawerStyles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Panel */}
        <Animated.View style={[drawerStyles.panel, isDark && { backgroundColor: '#1a1a1a' }, { transform: [{ translateX: slideAnim }] }]}>

          {/* Header con gradiente simulado */}
          <View style={drawerStyles.drawerHeader}>
            {/* Avatar */}
            <View style={drawerStyles.drawerAvatar}>
              {chatAvatar ? (
                <Image source={{ uri: chatAvatar }} style={drawerStyles.drawerAvatarImg} />
              ) : (
                <Text style={drawerStyles.drawerAvatarText}>
                  {chatInitials || chatName?.slice(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            {/* Info */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={drawerStyles.drawerHeaderName} numberOfLines={1}>{chatName}</Text>
              <Text style={drawerStyles.drawerHeaderSub}>
                {isGroup ? '👥 Grupo' : isOnline ? '● En línea' : '○ Desconectado'}
              </Text>
            </View>
            {/* Botón cerrar */}
            <TouchableOpacity onPress={onClose} style={drawerStyles.drawerCloseBtn} activeOpacity={0.7}>
              <Svg width={16} height={16} viewBox="0 0 24 24" stroke="#fff" strokeWidth={2.5}>
                <Line x1="18" y1="6" x2="6" y2="18" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
                <Line x1="6" y1="6" x2="18" y2="18" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Opciones */}
          <ScrollView style={drawerStyles.scroll} showsVerticalScrollIndicator={false} bounces={false}>
            {grouped.map((group, gi) => (
              <View key={gi} style={[drawerStyles.section, isDark && { borderBottomColor: '#2a2a2a' }]}>
                {group.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      drawerStyles.item,
                      isDark && { borderBottomColor: '#2a2a2a' },
                      i === group.length - 1 && drawerStyles.itemLast,
                    ]}
                    onPress={() => { onClose(); setTimeout(item.onPress, 180); }}
                    activeOpacity={0.6}
                  >
                    <View style={drawerStyles.iconWrap}>{item.icon}</View>
                    <Text style={[
                      drawerStyles.label,
                      isDark && { color: '#e8e8e8' },
                      item.color ? { color: item.color } : null,
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const drawerStyles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  // Header gradiente azul
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    backgroundColor: '#00b4e6',
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  drawerAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  drawerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  drawerHeaderName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  drawerHeaderSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 1,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 10,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 20,
    alignItems: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
});

// ── ContextMenu ───────────────────────────────────────────────────
const ContextMenu = ({
  visible, message, isOwn, onClose, onCopy, onReply, onDelete, onDeleteForMe,
}: {
  visible: boolean; message: Message | null; isOwn: boolean;
  onClose: () => void; onCopy: () => void; onReply: () => void;
  onDelete: () => void; onDeleteForMe: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.contextOverlay} onPress={onClose}>
      <View style={styles.contextMenu}>
        <TouchableOpacity style={styles.contextItem} onPress={onCopy}>
          <Text style={styles.contextItemText}>📋 Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contextItem} onPress={onReply}>
          <Text style={styles.contextItemText}>↩️ Responder</Text>
        </TouchableOpacity>
        {isOwn && (
          <TouchableOpacity style={styles.contextItem} onPress={onDelete}>
            <Text style={[styles.contextItemText, { color: Colors.errorText }]}>🗑️ Eliminar para todos</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.contextItem, { borderBottomWidth: 0 }]} onPress={onDeleteForMe}>
          <Text style={[styles.contextItemText, { color: Colors.errorText }]}>✕ Eliminar para mí</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
);

// ── ReplyPreview ──────────────────────────────────────────────────
const ReplyPreview = ({ text, onCancel }: { text: string; onCancel: () => void }) => (
  <View style={styles.replyPreview}>
    <View style={styles.replyBar} />
    <Text style={styles.replyText} numberOfLines={1}>{text}</Text>
    <TouchableOpacity onPress={onCancel} style={styles.replyCancel}>
      <Text style={styles.replyCancelText}>✕</Text>
    </TouchableOpacity>
  </View>
);

// ── SenderName (grupos) ───────────────────────────────────────────
const SenderName = ({ name }: { name: string }) => (
  <Text style={styles.senderName}>{name}</Text>
);

// ── MessageBubble ─────────────────────────────────────────────────
const MessageBubble = React.memo(({
  message, isOwn, isGroup, onLongPress,
}: {
  message: Message; isOwn: boolean; isGroup: boolean;
  onLongPress: (msg: Message) => void;
}) => {
  const time = formatTime(message.created_at);

  return (
    <TouchableOpacity onLongPress={() => onLongPress(message)} activeOpacity={0.8} delayLongPress={400}>
      <View style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.theirWrapper]}>
        {!isOwn && isGroup && (
          <View style={styles.groupAvatarCol}>
            <EGAvatar src={message.sender?.avatar_url} name={message.sender?.full_name || '?'} size={28} />
          </View>
        )}
        <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.theirBubble]}>
          {!isOwn && isGroup && message.sender?.full_name && (
            <SenderName name={message.sender.full_name} />
          )}
          {message.type === 'text' && (
            <Text style={styles.bubbleText}>{message.text}</Text>
          )}
          {message.type === 'image' && (
            <Text style={styles.bubbleText}>📷 Imagen</Text>
          )}
          {message.type === 'audio' && (
            <Text style={styles.bubbleText}>🎵 Audio</Text>
          )}
          {message.type === 'file' && (
            <Text style={styles.bubbleText}>📄 {message.file_url?.split('/').pop() || 'Archivo'}</Text>
          )}
          <View style={styles.bubbleMeta}>
            <Text style={styles.bubbleTime}>{time}</Text>
            {isOwn && <StatusTicks status={message.status} />}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── DateSeparator ─────────────────────────────────────────────────
const DateSeparator = ({ label }: { label: string }) => (
  <View style={styles.dateSeparator}>
    <Text style={styles.dateSeparatorText}>{label}</Text>
  </View>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function ChatScreen() {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contextMsg, setContextMsg] = useState<Message | null>(null);
  const [contextVisible, setContextVisible] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  // Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      try {
        // Obtener usuario actual via API (no decodificar JWT en RN)
        const me = await authAPI.me();
        setCurrentUserId(me?.id || '');

        // Cargar chat y mensajes en paralelo
        const [chats, msgs] = await Promise.all([
          chatAPI.getChats(),
          chatAPI.getMessages(chatId, 1, 50),
        ]);

        const current = chats.find((c: any) => c.id === chatId);
        if (current) setChat(current);

        const msgList = msgs || [];
        setMessages(msgList);
        setHasMore(msgList.length === 50);

        // Marcar como leídos
        if (msgList.length > 0) {
          chatAPI.markAsRead(chatId, msgList[msgList.length - 1].id).catch(() => {});
        }
      } catch (e) {
        console.error('Error cargando chat:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [chatId]);

  // Supabase Realtime
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    const unsubscribe = subscribeToChat(chatId, (newMsg: any) => {
      if (newMsg.sender_id !== currentUserId) {
        setMessages(prev => [...prev, newMsg]);
        chatAPI.markAsRead(chatId, newMsg.id).catch(() => {});
        setIsTyping(false);
      }
    });
    return unsubscribe;
  }, [chatId, currentUserId]);

  // Scroll al fondo cuando llegan mensajes nuevos
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // Cargar más mensajes (scroll hacia arriba)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const older = await chatAPI.getMessages(chatId, nextPage, 50);
      if (older && older.length > 0) {
        setMessages(prev => [...older, ...prev]);
        setPage(nextPage);
        setHasMore(older.length === 50);
      } else {
        setHasMore(false);
      }
    } catch {}
    finally { setLoadingMore(false); }
  }, [chatId, page, hasMore, loadingMore]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setText('');
    setReplyTo(null);
    setSending(true);
    haptics.light(); // feedback táctil al enviar

    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();

    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      text: trimmed,
      type: 'text',
      sender_id: currentUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
      reply_to: replyTo?.id,
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const real = await chatAPI.sendMessage(chatId, {
        text: trimmed,
        type: 'text',
        reply_to: replyTo?.id,
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...real, status: 'sent' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    } finally {
      setSending(false);
    }
  }, [text, sending, chatId, currentUserId, replyTo]);

  const handleLongPress = useCallback((msg: Message) => {
    setContextMsg(msg);
    setContextVisible(true);
  }, []);

  const handleCopy = useCallback(async () => {
    if (contextMsg?.text) await Clipboard.setStringAsync(contextMsg.text);
    setContextVisible(false);
  }, [contextMsg]);

  const handleReply = useCallback(() => {
    if (contextMsg) setReplyTo(contextMsg);
    setContextVisible(false);
  }, [contextMsg]);

  const handleDelete = useCallback(() => {
    setContextVisible(false);
    Alert.alert('Eliminar mensaje', '¿Eliminar para todos?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          if (!contextMsg) return;
          try {
            await chatAPI.deleteMessage(contextMsg.id);
            setMessages(prev => prev.filter(m => m.id !== contextMsg.id));
          } catch {}
        },
      },
    ]);
  }, [contextMsg]);

  const handleDeleteForMe = useCallback(() => {
    setContextVisible(false);
    if (!contextMsg) return;
    chatAPI.deleteMessageForMe(contextMsg.id).catch(() => {});
    setMessages(prev => prev.filter(m => m.id !== contextMsg.id));
  }, [contextMsg]);

  // Emitir "escribiendo..." al servidor con debounce
  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (val.trim()) {
      chatAPI.sendTyping?.(chatId).catch(() => {});
      typingTimer.current = setTimeout(() => {
        chatAPI.stopTyping?.(chatId).catch(() => {});
      }, 2000);
    }
  }, [chatId]);

  const isGroup = chat?.type === 'group';
  const otherParticipant = chat?.participants?.find((p: any) => p.user_id !== currentUserId);
  const chatName = chat
    ? isGroup ? (chat.name || 'Grupo') : (otherParticipant?.full_name || 'Usuario')
    : '...';
  const chatAvatar = isGroup ? chat?.avatar_url : otherParticipant?.avatar_url;
  const chatSubtitle = isGroup
    ? `${chat?.participants?.length || 0} miembros`
    : 'En línea';

  // ── Items del drawer ──────────────────────────────────────────
  const IC = '#374151'; // color base
  const drawerItems: DrawerItem[] = [
    // ── Sección principal ──
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/><Circle cx="12" cy="7" r="4"/></Svg>,
      label: 'Ver perfil',
      color: IC,
      onPress: () => Alert.alert('Ver perfil', 'Próximamente'),
    },
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Circle cx="11" cy="11" r="8"/><Path d="M21 21l-4.35-4.35" strokeLinecap="round"/></Svg>,
      label: 'Buscar en el chat',
      color: IC,
      onPress: () => Alert.alert('Buscar', 'Próximamente'),
    },
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>,
      label: 'Mensajes destacados',
      color: IC,
      onPress: () => Alert.alert('Destacados', 'Próximamente'),
    },
    {
      section: 'main',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/><Line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/><Circle cx="12" cy="12" r="10"/></Svg>,
      label: 'Fijar chat',
      color: IC,
      onPress: () => Alert.alert('Fijar chat', 'Próximamente'),
    },
    // ── Sección configuración ──
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round"/><Path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round"/></Svg>,
      label: 'Silenciar',
      color: IC,
      onPress: () => Alert.alert('Silenciar', 'Próximamente'),
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Rect x="3" y="3" width="18" height="18" rx="2"/><Line x1="3" y1="9" x2="21" y2="9" strokeLinecap="round"/><Line x1="9" y1="21" x2="9" y2="9" strokeLinecap="round"/></Svg>,
      label: 'Fondo de pantalla',
      color: IC,
      onPress: () => Alert.alert('Fondo de pantalla', 'Próximamente'),
    },
    {
      section: 'config',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#00c8a0" strokeWidth={1.8}><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round"/></Svg>,
      label: 'Cifrado E2E',
      color: '#00c8a0',
      onPress: () => Alert.alert('🔒 Cifrado E2E', 'Este chat está cifrado de extremo a extremo.'),
    },
    // ── Sección acciones ──
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round"/><Polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>,
      label: 'Enviar dinero',
      color: IC,
      onPress: () => router.push('/(tabs)/monedero' as any),
    },
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/><Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round"/><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round"/></Svg>,
      label: 'Compartir contacto',
      color: IC,
      onPress: () => Alert.alert('Compartir contacto', 'Próximamente'),
    },
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round"/></Svg>,
      label: 'Crear grupo con este contacto',
      color: IC,
      onPress: () => Alert.alert('Crear grupo', 'Próximamente'),
    },
    {
      section: 'actions',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth={1.8}><Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round"/><Polyline points="7 10 12 15 17 10"/><Line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/></Svg>,
      label: 'Exportar chat',
      color: IC,
      onPress: () => Alert.alert('Exportar chat', 'Próximamente'),
    },
    // ── Sección peligrosa ──
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={1.8}><Polyline points="3 6 5 6 21 6"/><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round"/><Path d="M10 11v6" strokeLinecap="round"/><Path d="M14 11v6" strokeLinecap="round"/></Svg>,
      label: 'Vaciar chat',
      color: '#F59E0B',
      onPress: () =>
        Alert.alert('Vaciar chat', '¿Eliminar todos los mensajes?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Vaciar', style: 'destructive', onPress: () => setMessages([]) },
        ]),
    },
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.8}><Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinecap="round"/><Line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/><Line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/></Svg>,
      label: 'Reportar',
      color: '#EF4444',
      onPress: () => Alert.alert('Reportar', `"${chatName}" reportado.`),
    },
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.8}><Circle cx="12" cy="12" r="10"/><Line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeLinecap="round"/></Svg>,
      label: 'Bloquear',
      color: '#EF4444',
      onPress: () =>
        Alert.alert('Bloquear', `¿Bloquear a ${chatName}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Bloquear', style: 'destructive', onPress: () => router.back() },
        ]),
    },
    {
      section: 'danger',
      icon: <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={1.8}><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round"/><Circle cx="9" cy="7" r="4"/><Line x1="23" y1="11" x2="17" y2="11" strokeLinecap="round"/></Svg>,
      label: 'Eliminar contacto',
      color: '#EF4444',
      onPress: () =>
        Alert.alert('Eliminar contacto', `¿Eliminar a ${chatName}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => router.back() },
        ]),
    },
  ];

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === currentUserId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || getDateLabel(item.created_at) !== getDateLabel(prevMsg.created_at);

    return (
      <>
        {showDate && <DateSeparator label={getDateLabel(item.created_at)} />}
        <MessageBubble
          message={item}
          isOwn={isOwn}
          isGroup={isGroup}
          onLongPress={handleLongPress}
        />
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgTertiary }]} edges={['top']}>
      {/* ── Header con gradiente ── */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <Line x1="19" y1="12" x2="5" y2="12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"/>
            <Polyline points="12 19 5 12 12 5" stroke="#fff" strokeWidth={2.5} strokeLinecap="round"/>
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
          <EGAvatar src={chatAvatar} name={chatName} size={38} />
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? '● Escribiendo...' : `● ${chatSubtitle}`}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {/* Llamada de voz */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push({ pathname: '/call/[callId]', params: { callId: `call_${Date.now()}`, targetName: chatName, targetAvatar: chatAvatar || '', callType: 'audio', role: 'caller', targetUserId: otherParticipant?.user_id || '' } } as any)}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
              <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </Svg>
          </TouchableOpacity>
          {/* Videollamada */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push({ pathname: '/call/[callId]', params: { callId: `call_${Date.now()}`, targetName: chatName, targetAvatar: chatAvatar || '', callType: 'video', role: 'caller', targetUserId: otherParticipant?.user_id || '' } } as any)}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round">
              <Polygon points="23 7 16 12 23 17 23 7"/>
              <Rect x="1" y="5" width="15" height="14" rx="2"/>
            </Svg>
          </TouchableOpacity>
          {/* Menú tres puntos */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => setDrawerVisible(true)}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
              <Circle cx="12" cy="5" r="1" fill="#fff"/>
              <Circle cx="12" cy="12" r="1" fill="#fff"/>
              <Circle cx="12" cy="19" r="1" fill="#fff"/>
            </Svg>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Mensajes + Input ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Fondo beige estilo WhatsApp */}
        <View style={styles.chatBg}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={loadingMore ? <ActivityIndicator size="small" color={Colors.accent} style={{ marginVertical: 8 }} /> : null}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatText}>Empieza la conversación</Text>
              </View>
            }
          />

          {/* LIA-25 flotante */}
          <TouchableOpacity
            style={styles.liaFloat}
            onPress={() => router.push('/(tabs)/lia' as any)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#e91e8c', '#9c27b0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.liaFloatGrad}
            >
              <Text style={styles.liaFloatIcon}>🧠</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Reply preview */}
        {replyTo && <ReplyPreview text={replyTo.text || 'Mensaje'} onCancel={() => setReplyTo(null)} />}

        {/* Panel adjuntos — se muestra encima del input */}
        {showAttach && (
          <View style={[styles.attachPanel, { backgroundColor: C.bgSecondary }]}>
            {[
              { icon: '🖼️', label: 'Foto',          color: '#e3f2fd', onPress: () => { setShowAttach(false); Alert.alert('Foto', 'Próximamente'); } },
              { icon: '🎥', label: 'Video',         color: '#fff8e1', onPress: () => { setShowAttach(false); Alert.alert('Video', 'Próximamente'); } },
              { icon: '📎', label: 'Archivo',       color: '#e0f7fa', onPress: () => { setShowAttach(false); Alert.alert('Archivo', 'Próximamente'); } },
              { icon: '👤', label: 'Contacto',      color: '#fce4ec', onPress: () => { setShowAttach(false); Alert.alert('Contacto', 'Próximamente'); } },
              { icon: '📍', label: 'Ubicación',     color: '#fce4ec', onPress: () => { setShowAttach(false); Alert.alert('Ubicación', 'Próximamente'); } },
              { icon: '💸', label: 'Enviar dinero', color: '#e8f5e9', onPress: () => { setShowAttach(false); router.push('/(tabs)/monedero' as any); } },
            ].map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.attachItem}
                onPress={item.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.attachIconBox, { backgroundColor: item.color }]}>
                  <Text style={styles.attachEmoji}>{item.icon}</Text>
                </View>
                <Text style={[styles.attachLabel, { color: C.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
          {/* Botón + adjuntos */}
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => setShowAttach(v => !v)}
            activeOpacity={0.8}
          >
            <Text style={[styles.attachBtnIcon, showAttach && { color: Colors.accent }]}>+</Text>
          </TouchableOpacity>

          {/* Campo de texto */}
          <View style={[styles.inputWrapper, { backgroundColor: C.bgTertiary }]}>
            <TextInput
              style={[styles.input, { color: C.textPrimary }]}
              value={text}
              onChangeText={handleTextChange}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={C.textTertiary}
              multiline
              maxLength={4000}
            />
          </View>

          {/* Emoji */}
          <TouchableOpacity style={styles.emojiBtn} activeOpacity={0.8}>
            <Text style={styles.emojiBtnIcon}>🙂</Text>
          </TouchableOpacity>

          {/* Enviar o micrófono */}
          {text.trim() ? (
            <Animated.View style={{ transform: [{ scale: sendScale }] }}>
              <TouchableOpacity
                onPress={sendMessage}
                disabled={sending}
                style={styles.sendBtn}
                activeOpacity={0.8}
              >
                {sending
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Line x1="22" y1="2" x2="11" y2="13"/>
                      <Polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff" stroke="#fff"/>
                    </Svg>
                }
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity style={styles.micBtn} activeOpacity={0.8}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.textSecondary} strokeWidth={1.8} strokeLinecap="round">
                <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <Path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <Line x1="12" y1="19" x2="12" y2="23"/>
                <Line x1="8" y1="23" x2="16" y2="23"/>
              </Svg>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <ContextMenu visible={contextVisible} message={contextMsg} isOwn={contextMsg?.sender_id === currentUserId} onClose={() => setContextVisible(false)} onCopy={handleCopy} onReply={handleReply} onDelete={handleDelete} onDeleteForMe={handleDeleteForMe} />
      <ChatDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        chatName={chatName}
        chatAvatar={chatAvatar}
        chatInitials={chatName?.slice(0, 2).toUpperCase()}
        isGroup={isGroup}
        isOnline={chatSubtitle === 'En línea'}
        items={drawerItems}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgTertiary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.white, lineHeight: 32 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerText: { flex: 1 },
  headerName: { ...Typography.chatHeaderName, color: '#ffffff' },
  headerStatus: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: Spacing.sm },
  headerBtnIcon: { fontSize: 18, color: Colors.white },

  // Chat background — beige estilo WhatsApp
  chatBg: {
    flex: 1,
    backgroundColor: '#e5ddd5',
    position: 'relative',
  },

  // Messages
  messagesList: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm, gap: 2 },

  // Bubble
  bubbleWrapper: { marginVertical: 1, flexDirection: 'row', alignItems: 'flex-end' },
  ownWrapper: { justifyContent: 'flex-end' },
  theirWrapper: { justifyContent: 'flex-start' },
  groupAvatarCol: { marginRight: 6, marginBottom: 2 },
  bubble: {
    maxWidth: '75%',
    paddingVertical: Spacing.bubblePaddingV,
    paddingHorizontal: Spacing.bubblePaddingH,
  },
  ownBubble: {
    backgroundColor: '#d9fdd3',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    ...Shadow.bubble,
  },
  theirBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    ...Shadow.bubble,
  },
  senderName: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
    marginBottom: 2,
  },
  bubbleText: { ...Typography.messageText, color: Colors.textPrimary },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  bubbleTime: { ...Typography.timestamp, color: Colors.textTertiary },

  // Date separator
  dateSeparator: { alignItems: 'center', marginVertical: Spacing.sm },
  dateSeparatorText: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },

  // Typing indicator
  typingContainer: { alignItems: 'flex-start', paddingHorizontal: Spacing.sm + 2, marginVertical: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    ...Shadow.bubble,
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textTertiary },

  // Context menu
  contextOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  contextMenu: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    width: 260,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  contextItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  contextItemText: { fontSize: FontSize.md, color: Colors.textPrimary },

  // Reply preview
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  replyBar: { width: 3, height: 36, backgroundColor: Colors.accent, borderRadius: 2 },
  replyText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  replyCancel: { padding: Spacing.xs },
  replyCancelText: { fontSize: 16, color: Colors.textTertiary },

  // Empty state
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyChatIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyChatText: { ...Typography.subtitle, color: Colors.textSecondary },

  // LIA-25 flotante en el chat
  liaFloat: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    zIndex: 10,
    ...Shadow.md,
  },
  liaFloatGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liaFloatIcon: { fontSize: 20 },

  // Panel adjuntos — grid 2 columnas
  attachPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.xl,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    justifyContent: 'flex-start',
  },
  attachItem: {
    width: '22%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  attachIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachEmoji: { fontSize: 28 },
  attachLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  // Botón + adjuntos
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  attachBtnIcon: {
    fontSize: 26,
    color: Colors.textSecondary,
    lineHeight: 30,
    fontWeight: '300',
  },
  // Campo texto
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: { fontSize: FontSize.md, color: Colors.textPrimary, maxHeight: 120, padding: 0 },
  // Emoji
  emojiBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emojiBtnIcon: { fontSize: 22 },
  // Micrófono
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Enviar
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnIcon: { color: Colors.white, fontSize: 16 },
});
