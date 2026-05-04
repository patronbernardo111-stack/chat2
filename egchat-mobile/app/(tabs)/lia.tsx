import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { liaAPI } from '../../src/api';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

const SUGGESTIONS = [
  '¿Cuál es mi saldo?',
  'Noticias de hoy',
  'Pedir un taxi',
  'Enviar dinero',
  'Centros de salud',
  'Clima en Malabo',
];

const QUICK_CHIPS = [
  { icon: '💳', text: 'Saldo' },
  { icon: '📰', text: 'Noticias' },
  { icon: '🚕', text: 'Taxi' },
  { icon: '↗️', text: 'Enviar' },
  { icon: '🏥', text: 'Salud' },
  { icon: '🛒', text: 'Compras' },
  { icon: '☀️', text: 'Clima' },
];

const formatTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
};

// ── Burbuja de mensaje ────────────────────────────────────────────
const MessageBubble = React.memo(({ msg }: { msg: Msg }) => {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>🤖</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, isUser && styles.userTime]}>{msg.time}</Text>
      </View>
    </View>
  );
});

// ── Typing indicator ──────────────────────────────────────────────
const TypingDots = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    dots.forEach((dot, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={styles.typingWrapper}>
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarText}>🤖</Text>
      </View>
      <View style={styles.aiBubble}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function LiaScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Hola! Soy Lia-25, tu asistente inteligente de EGCHAT. ¿En qué puedo ayudarte hoy?',
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const listRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(1)).current;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToEnd(); }, [messages.length]);

  const send = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    const time = formatTime();
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', content: msg, time };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Animación botón enviar
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await liaAPI.chat(msg, history);
      const aiMsg: Msg = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.reply, time };
      setMessages(prev => [...prev, aiMsg]);
      setShowChips(true);

      // Leer en voz alta
      if (res.reply.length < 200) {
        setSpeaking(true);
        Speech.speak(res.reply, {
          language: 'es-ES',
          rate: 1.0,
          onDone: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, no puedo conectarme ahora. Inténtalo de nuevo.',
        time,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const stopSpeaking = () => {
    Speech.stop();
    setSpeaking(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>🤖</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>Lia-25</Text>
          <Text style={styles.headerStatus}>
            {loading ? '● Escribiendo...' : '● Asistente inteligente'}
          </Text>
        </View>
        {speaking && (
          <TouchableOpacity onPress={stopSpeaking} style={styles.speakBtn}>
            <Text style={styles.speakBtnText}>🔊 Parar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Mensajes ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={loading ? <TypingDots /> : null}
        />

        {/* Sugerencias — solo al inicio */}
        {messages.length <= 1 && !loading && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)} activeOpacity={0.7}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chips rápidos — después de la primera respuesta */}
        {showChips && messages.length > 1 && (
          <View style={styles.quickChipsRow}>
            {QUICK_CHIPS.map(c => (
              <TouchableOpacity
                key={c.text}
                style={styles.quickChip}
                onPress={() => send(c.text)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickChipIcon}>{c.icon}</Text>
                <Text style={styles.quickChipText}>{c.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Input ── */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Pregunta a Lia-25..."
              placeholderTextColor={Colors.textTertiary}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              multiline
              maxLength={500}
            />
          </View>
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => send()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerAvatar: { position: 'relative' },
  headerAvatarText: { fontSize: 32 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.bgSecondary,
  },
  headerInfo: { flex: 1 },
  headerName: { ...Typography.chatHeaderName, color: Colors.textPrimary },
  headerStatus: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.medium },
  speakBtn: {
    backgroundColor: Colors.accentLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  speakBtnText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },

  // Messages
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.lg },

  bubbleWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiAvatarText: { fontSize: 16 },

  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  userBubble: {
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.bgSecondary,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.sm,
  },
  bubbleText: { fontSize: FontSize.base, lineHeight: 22 },
  userText: { color: Colors.white },
  aiText: { color: Colors.textPrimary },
  bubbleTime: { fontSize: FontSize.xs, color: 'rgba(0,0,0,0.3)', marginTop: 4, textAlign: 'right' },
  userTime: { color: 'rgba(255,255,255,0.6)' },

  // Typing
  typingWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  typingDots: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textTertiary },

  // Suggestions
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  // Quick chips (post-respuesta)
  quickChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 20,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickChipIcon: { fontSize: 12 },
  quickChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 22,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: { fontSize: FontSize.base, color: Colors.textPrimary, maxHeight: 100, padding: 0 },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendIcon: { color: Colors.white, fontSize: 16 },
});
