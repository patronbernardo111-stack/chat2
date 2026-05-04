import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { chatAPI, getToken } from '../../src/api';
import { subscribeToChat } from '../../src/supabase';
import { EGAvatar } from '../../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';

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

const getLastMsgText = (msg?: Message) => {
  if (!msg) return '';
  if (msg.type === 'text') return msg.text || '';
  if (msg.type === 'image') return '📷 Foto';
  if (msg.type === 'file') return '📄 Archivo';
  return 'Mensaje';
};

// ── StatusTicks ───────────────────────────────────────────────────
const StatusTicks = ({ status }: { status: Message['status'] }) => {
  const color = status === 'read' ? '#53bdeb' : Colors.textTertiary;
  if (status === 'pending') return <Text style={{ color, fontSize: 11 }}>○</Text>;
  if (status === 'sent') return <Text style={{ color, fontSize: 11 }}>✓</Text>;
  if (status === 'failed') return <Text style={{ color: Colors.error, fontSize: 11 }}>❌</Text>;
  return <Text style={{ color, fontSize: 11 }}>✓✓</Text>;
};

// ── MessageBubble ─────────────────────────────────────────────────
const MessageBubble = React.memo(({ message, isOwn }: { message: Message; isOwn: boolean }) => {
  const time = formatTime(message.created_at);

  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.theirWrapper]}>
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.theirBubble]}>
        {message.type === 'text' && (
          <Text style={styles.bubbleText}>{message.text}</Text>
        )}
        {message.type === 'image' && (
          <Text style={styles.bubbleText}>📷 Imagen</Text>
        )}
        {message.type === 'file' && (
          <Text style={styles.bubbleText}>📄 Archivo</Text>
        )}
        <View style={styles.bubbleMeta}>
          <Text style={styles.bubbleTime}>{time}</Text>
          {isOwn && <StatusTicks status={message.status} />}
        </View>
      </View>
    </View>
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
  const flatListRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;

  // Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      try {
        // Obtener usuario actual del token
        const token = await getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUserId(payload.id || '');
        }

        // Cargar chats para encontrar el actual
        const chats = await chatAPI.getChats();
        const current = chats.find((c: any) => c.id === chatId);
        if (current) setChat(current);

        // Cargar mensajes
        const msgs = await chatAPI.getMessages(chatId);
        setMessages(msgs || []);
      } catch (e) {
        console.error('Error cargando chat:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [chatId]);

  // Supabase Realtime — mensajes nuevos
  useEffect(() => {
    if (!chatId || !currentUserId) return;
    const unsubscribe = subscribeToChat(chatId, (newMsg: any) => {
      if (newMsg.sender_id !== currentUserId) {
        setMessages(prev => [...prev, newMsg]);
        // Marcar como leído
        chatAPI.markAsRead(chatId, newMsg.id).catch(() => {});
      }
    });
    return unsubscribe;
  }, [chatId, currentUserId]);

  // Scroll al fondo cuando llegan mensajes
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // Marcar como leídos al abrir
  useEffect(() => {
    if (messages.length > 0 && chatId) {
      const last = messages[messages.length - 1];
      chatAPI.markAsRead(chatId, last.id).catch(() => {});
    }
  }, [chatId, messages.length]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setText('');
    setSending(true);

    // Animación del botón enviar
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();

    // Mensaje optimista
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      text: trimmed,
      type: 'text',
      sender_id: currentUserId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const real = await chatAPI.sendMessage(chatId, { text: trimmed, type: 'text' });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...real, status: 'sent' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
    } finally {
      setSending(false);
    }
  }, [text, sending, chatId, currentUserId]);

  // Nombre del chat
  const chatName = chat
    ? chat.type === 'private'
      ? chat.participants?.find((p: any) => p.user_id !== currentUserId)?.full_name || 'Usuario'
      : chat.name || 'Grupo'
    : '...';

  const chatAvatar = chat?.type === 'private'
    ? chat.participants?.find((p: any) => p.user_id !== currentUserId)?.avatar_url
    : chat?.avatar_url;

  // Renderizar lista con separadores de fecha
  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.sender_id === currentUserId;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMsg || getDateLabel(item.created_at) !== getDateLabel(prevMsg.created_at);

    return (
      <>
        {showDate && <DateSeparator label={getDateLabel(item.created_at)} />}
        <MessageBubble message={item} isOwn={isOwn} />
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
          <EGAvatar src={chatAvatar} name={chatName} size={40} />
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
            <Text style={styles.headerStatus}>
              {chat?.type === 'group'
                ? `${chat.participants?.length || 0} miembros`
                : 'En línea'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Mensajes ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>💬</Text>
              <Text style={styles.emptyChatText}>Empieza la conversación</Text>
            </View>
          }
        />

        {/* ── Input ── */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.inputAction}>
            <Text style={styles.inputActionIcon}>＋</Text>
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={4000}
              returnKeyType="default"
            />
          </View>

          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!text.trim() || sending}
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              activeOpacity={0.8}
            >
              <Text style={styles.sendBtnIcon}>➤</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
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
  messagesList: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    gap: 2,
  },

  // Bubble
  bubbleWrapper: { marginVertical: 1 },
  ownWrapper: { alignItems: 'flex-end' },
  theirWrapper: { alignItems: 'flex-start' },
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
  bubbleText: {
    ...Typography.messageText,
    color: Colors.textPrimary,
  },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  bubbleTime: { ...Typography.timestamp, color: Colors.textTertiary },

  // Date separator
  dateSeparator: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
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

  // Empty state
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
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
  inputAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputActionIcon: { fontSize: 22, color: Colors.textSecondary, lineHeight: 26 },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 120,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendBtnIcon: { color: Colors.white, fontSize: 16 },
});
