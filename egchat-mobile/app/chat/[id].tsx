import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Modal, Pressable, Alert, Dimensions, ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.72;
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { chatAPI, authAPI } from '../../src/api';
import { subscribeToChat } from '../../src/supabase';
import { EGAvatar } from '../../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

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
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  danger?: boolean;
}

const ChatDrawer = ({
  visible,
  onClose,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  items: DrawerItem[];
}) => {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible && slideAnim.__getValue() >= DRAWER_WIDTH) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={drawerStyles.root}>
        {/* Overlay oscuro */}
        <Animated.View style={[drawerStyles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Panel deslizante */}
        <Animated.View
          style={[
            drawerStyles.panel,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Cabecera del drawer */}
          <View style={drawerStyles.header}>
            <View style={drawerStyles.headerBar} />
          </View>

          {/* Lista de opciones */}
          <ScrollView
            style={drawerStyles.scroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  drawerStyles.item,
                  index === items.length - 1 && drawerStyles.itemLast,
                ]}
                onPress={() => {
                  onClose();
                  setTimeout(item.onPress, 200);
                }}
                activeOpacity={0.65}
              >
                <View style={drawerStyles.iconWrap}>
                  <Text style={drawerStyles.icon}>{item.icon}</Text>
                </View>
                <Text
                  style={[
                    drawerStyles.label,
                    item.danger && drawerStyles.labelDanger,
                    item.color ? { color: item.color } : null,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  headerBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  scroll: {
    flex: 1,
    marginTop: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
    gap: 14,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  icon: {
    fontSize: 17,
  },
  label: {
    fontSize: 14.5,
    color: '#1a1a1a',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  labelDanger: {
    color: '#e53935',
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
    // Cancelar typing timer
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setText('');
    setReplyTo(null);
    setSending(true);

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
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
          <EGAvatar src={chatAvatar} name={chatName} size={40} />
          <View style={styles.headerText}>
            <Text style={[styles.headerName, { color: C.textPrimary }]} numberOfLines={1}>{chatName}</Text>
            <Text style={styles.headerStatus}>{chatSubtitle}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push({ pathname: '/call/[callId]', params: { callId: `call_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, targetName: chatName, targetAvatar: chatAvatar || '', callType: 'audio', role: 'caller', targetUserId: otherParticipant?.user_id || '' } } as any)}>
            <Text style={styles.headerBtnIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push({ pathname: '/call/[callId]', params: { callId: `call_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, targetName: chatName, targetAvatar: chatAvatar || '', callType: 'video', role: 'caller', targetUserId: otherParticipant?.user_id || '' } } as any)}>
            <Text style={styles.headerBtnIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}><Text style={styles.headerBtnIcon}>⋮</Text></TouchableOpacity>
        </View>
      </View>

      {/* ── Mensajes ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
              <Text style={[styles.emptyChatText, { color: C.textSecondary }]}>Empieza la conversación</Text>
            </View>
          }
        />
        {replyTo && <ReplyPreview text={replyTo.text || 'Mensaje'} onCancel={() => setReplyTo(null)} />}
        {/* ── Input ── */}
        <View style={[styles.inputBar, { backgroundColor: C.bgSecondary, borderTopColor: C.borderLight }]}>
          <View style={[styles.inputWrapper, { backgroundColor: C.bgTertiary }]}>
            <TextInput
              style={[styles.input, { color: C.textPrimary }]}
              value={text}
              onChangeText={handleTextChange}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={C.textTertiary}
              multiline
              maxLength={4000}
              onSubmitEditing={Platform.OS === 'ios' ? undefined : sendMessage}
            />
          </View>
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity onPress={sendMessage} disabled={!text.trim() || sending} style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]} activeOpacity={0.8}>
              {sending ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.sendBtnIcon}>➤</Text>}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      <ContextMenu visible={contextVisible} message={contextMsg} isOwn={contextMsg?.sender_id === currentUserId} onClose={() => setContextVisible(false)} onCopy={handleCopy} onReply={handleReply} onDelete={handleDelete} onDeleteForMe={handleDeleteForMe} />
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
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerText: { flex: 1 },
  headerName: { ...Typography.chatHeaderName, color: Colors.textPrimary },
  headerStatus: { ...Typography.onlineStatus, color: Colors.accent },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: { padding: Spacing.sm },
  headerBtnIcon: { fontSize: 18 },

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
    backgroundColor: Colors.bubbleOwn,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.bubbleOther,
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
    backgroundColor: Colors.bubbleOther,
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

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: Spacing.chatInputBarPadding + 2,
    paddingVertical: Spacing.chatInputBarPadding,
    gap: Spacing.chatInputBarGap,
  },
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
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendBtnIcon: { color: Colors.white, fontSize: 16 },
});
