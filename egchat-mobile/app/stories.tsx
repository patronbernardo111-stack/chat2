import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, Pressable, TextInput, Image, Animated,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { storiesAPI, getToken } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface StoryMedia {
  type: 'text' | 'image';
  content: string;
  bg: string;
  emoji?: string;
}

interface Story {
  id: string;
  user_id: string;
  userName: string;
  avatar?: string;
  media: StoryMedia[];
  seen: boolean;
  views: number;
  expires_at: string;
  created_at: string;
}

const BG_COLORS = [
  'linear-gradient(135deg,#00c8a0,#00b4e6)',
  '#1a1a2e', '#16213e', '#0f3460',
  '#e94560', '#533483', '#2b2d42',
  '#ef233c', '#8d99ae', '#2b2d42',
];

const EMOJIS = ['😊', '❤️', '🔥', '👏', '😂', '😍', '🎉', '💯', '🙏', '✨'];

// ── StoryCircle ───────────────────────────────────────────────────
const StoryCircle = ({
  story, onPress, isMe = false,
}: {
  story: Story; onPress: () => void; isMe?: boolean;
}) => {
  const hasContent = story.media.length > 0;
  const name = isMe ? 'Mi estado' : story.userName;

  return (
    <TouchableOpacity onPress={onPress} style={styles.storyCircle} activeOpacity={0.8}>
      <View style={[
        styles.storyRing,
        hasContent && !story.seen && styles.storyRingActive,
        story.seen && styles.storyRingSeen,
        !hasContent && styles.storyRingEmpty,
      ]}>
        <EGAvatar src={story.avatar} name={name} size={56} />
        {isMe && !hasContent && (
          <View style={styles.addBadge}>
            <Text style={styles.addBadgeText}>+</Text>
          </View>
        )}
      </View>
      <Text style={styles.storyName} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
  );
};

// ── StoryViewer ───────────────────────────────────────────────────
const StoryViewer = ({
  story, onClose, onNext, onPrev,
}: {
  story: Story; onClose: () => void; onNext: () => void; onPrev: () => void;
}) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const [replyText, setReplyText] = useState('');
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  const slide = story.media[slideIdx];
  const total = story.media.length;

  const startProgress = useCallback(() => {
    progress.setValue(0);
    anim.current?.stop();
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    anim.current.start(({ finished }) => {
      if (finished) {
        if (slideIdx < total - 1) {
          setSlideIdx(i => i + 1);
        } else {
          onNext();
        }
      }
    });
  }, [slideIdx, total]);

  useEffect(() => { startProgress(); return () => anim.current?.stop(); }, [slideIdx]);

  if (!slide) return null;

  const isImage = slide.type === 'image';
  const bgColor = isImage ? '#000' : (slide.bg || Colors.accent);

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[styles.viewer, { backgroundColor: bgColor }]}>
        {/* Imagen o texto */}
        {isImage ? (
          <Image source={{ uri: slide.content }} style={styles.viewerImage} resizeMode="contain" />
        ) : (
          <View style={styles.viewerTextContainer}>
            {slide.emoji && <Text style={styles.viewerEmoji}>{slide.emoji}</Text>}
            <Text style={styles.viewerText}>{slide.content}</Text>
          </View>
        )}

        {/* Barras de progreso */}
        <View style={styles.progressBars}>
          {story.media.map((_, i) => (
            <View key={i} style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: i < slideIdx ? '100%' : i === slideIdx
                      ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                      : '0%',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.viewerHeader}>
          <EGAvatar src={story.avatar} name={story.userName} size={36} />
          <View style={styles.viewerHeaderInfo}>
            <Text style={styles.viewerName}>{story.userName}</Text>
            <Text style={styles.viewerTime}>
              {new Date(story.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Zonas de tap */}
        <View style={styles.tapZones}>
          <TouchableOpacity
            style={styles.tapLeft}
            onPress={() => slideIdx > 0 ? setSlideIdx(i => i - 1) : onPrev()}
          />
          <TouchableOpacity
            style={styles.tapRight}
            onPress={() => slideIdx < total - 1 ? setSlideIdx(i => i + 1) : onNext()}
          />
        </View>

        {/* Reacciones */}
        <View style={styles.viewerFooter}>
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Responder..."
              placeholderTextColor="rgba(255,255,255,0.6)"
            />
            {replyText.trim() && (
              <TouchableOpacity onPress={() => { setReplyText(''); }}>
                <Text style={styles.sendReply}>➤</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.emojiRow}>
            {['❤️', '😂', '😮', '😢', '👏', '🔥'].map(e => (
              <TouchableOpacity key={e} style={styles.emojiBtn}>
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ── CreateStoryModal ──────────────────────────────────────────────
const CreateStoryModal = ({
  visible, onClose, onPublished,
}: {
  visible: boolean; onClose: () => void; onPublished: () => void;
}) => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [bg, setBg] = useState(Colors.accent);
  const [emoji, setEmoji] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setMode('image');
    }
  };

  const publish = async () => {
    if (mode === 'text' && !text.trim()) { Alert.alert('Error', 'Escribe algo'); return; }
    if (mode === 'image' && !imageUri) { Alert.alert('Error', 'Selecciona una imagen'); return; }

    setLoading(true);
    try {
      const media = mode === 'text'
        ? [{ type: 'text' as const, content: text.trim(), bg, emoji: emoji || undefined }]
        : [{ type: 'image' as const, content: imageUri, bg: '#000' }];

      await storiesAPI.publish(media);
      setText(''); setEmoji(''); setImageUri('');
      onPublished();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo publicar el estado');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.createContainer, { backgroundColor: mode === 'text' ? bg : '#000' }]}>
        {/* Header */}
        <View style={styles.createHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.createClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.createTitle}>Nuevo estado</Text>
          <TouchableOpacity onPress={publish} disabled={loading}>
            <Text style={styles.createPublish}>{loading ? '...' : 'Publicar'}</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View style={styles.createPreview}>
          {mode === 'image' && imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.createImagePreview} resizeMode="contain" />
          ) : (
            <View style={styles.createTextPreview}>
              {emoji ? <Text style={styles.createEmojiPreview}>{emoji}</Text> : null}
              <TextInput
                style={styles.createTextInput}
                value={text}
                onChangeText={setText}
                placeholder="Escribe tu estado..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                textAlign="center"
                autoFocus
              />
            </View>
          )}
        </View>

        {/* Controles */}
        <View style={styles.createControls}>
          {/* Modo */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => setMode('text')}
              style={[styles.modeBtn, mode === 'text' && styles.modeBtnActive]}
            >
              <Text style={styles.modeBtnText}>✏️ Texto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              style={[styles.modeBtn, mode === 'image' && styles.modeBtnActive]}
            >
              <Text style={styles.modeBtnText}>🖼️ Imagen</Text>
            </TouchableOpacity>
          </View>

          {/* Colores de fondo (solo texto) */}
          {mode === 'text' && (
            <View style={styles.bgRow}>
              {[Colors.accent, '#1a1a2e', '#e94560', '#533483', '#0f3460', '#ef233c'].map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setBg(c)}
                  style={[styles.bgCircle, { backgroundColor: c }, bg === c && styles.bgCircleActive]}
                />
              ))}
            </View>
          )}

          {/* Emojis */}
          {mode === 'text' && (
            <View style={styles.emojiPickerRow}>
              {EMOJIS.map(e => (
                <TouchableOpacity key={e} onPress={() => setEmoji(emoji === e ? '' : e)}>
                  <Text style={[styles.emojiPickerItem, emoji === e && styles.emojiPickerItemActive]}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function StoriesScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [myStory, setMyStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Story | null>(null);
  const [viewingIdx, setViewingIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  const loadStories = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.id || '');
      }
      const data = await storiesAPI.getAll();
      const all = Array.isArray(data) ? data : [];
      const me = all.find((s: any) => s.user_id === currentUserId);
      const others = all.filter((s: any) => s.user_id !== currentUserId);
      setMyStory(me || null);
      setStories(others);
    } catch { }
    finally { setLoading(false); }
  }, [currentUserId]);

  useEffect(() => { loadStories(); }, []);

  const openStory = (story: Story, idx: number) => {
    setViewing(story);
    setViewingIdx(idx);
    storiesAPI.registerView(story.id).catch(() => {});
  };

  const allStories = myStory ? [myStory, ...stories] : stories;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estados</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Mi estado */}
      <View style={styles.myStorySection}>
        <StoryCircle
          story={myStory || { id: 'me', user_id: currentUserId, userName: 'Mi estado', media: [], seen: false, views: 0, expires_at: '', created_at: '' }}
          onPress={() => myStory?.media.length ? openStory(myStory, 0) : setShowCreate(true)}
          isMe
        />
        <View style={styles.myStoryInfo}>
          <Text style={styles.myStoryTitle}>Mi estado</Text>
          <Text style={styles.myStorySub}>
            {myStory?.media.length ? `${myStory.media.length} diapositiva(s)` : 'Toca para añadir un estado'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.myStoryEdit}>
          <Text style={styles.myStoryEditText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Recientes */}
      {stories.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>RECIENTES</Text>
          <FlatList
            data={stories.filter(s => s.media.length > 0)}
            keyExtractor={s => s.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.storyListItem}
                onPress={() => openStory(item, index)}
                activeOpacity={0.7}
              >
                <View style={[styles.storyRing, !item.seen && styles.storyRingActive, item.seen && styles.storyRingSeen]}>
                  <EGAvatar src={item.avatar} name={item.userName} size={52} />
                </View>
                <View style={styles.storyListInfo}>
                  <Text style={styles.storyListName}>{item.userName}</Text>
                  <Text style={styles.storyListTime}>
                    {new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {item.views > 0 && ` · ${item.views} vistas`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {stories.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👁️</Text>
          <Text style={styles.emptyTitle}>Sin estados recientes</Text>
          <Text style={styles.emptySub}>Los estados de tus contactos aparecerán aquí</Text>
        </View>
      )}

      {/* Viewer */}
      {viewing && (
        <StoryViewer
          story={viewing}
          onClose={() => setViewing(null)}
          onNext={() => {
            const next = allStories[viewingIdx + 1];
            if (next) { setViewing(next); setViewingIdx(i => i + 1); }
            else setViewing(null);
          }}
          onPrev={() => {
            const prev = allStories[viewingIdx - 1];
            if (prev) { setViewing(prev); setViewingIdx(i => i - 1); }
          }}
        />
      )}

      {/* Create */}
      <CreateStoryModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onPublished={loadStories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { ...Typography.headerTitle, flex: 1, textAlign: 'center', color: Colors.textPrimary },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: Colors.white, fontSize: 22, lineHeight: 28 },

  // My story
  myStorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  myStoryInfo: { flex: 1 },
  myStoryTitle: { ...Typography.chatName, color: Colors.textPrimary },
  myStorySub: { ...Typography.timestamp, color: Colors.textTertiary, marginTop: 2 },
  myStoryEdit: { padding: Spacing.sm },
  myStoryEditText: { fontSize: 20 },

  // Story circle
  storyCircle: { alignItems: 'center', width: 72, gap: 4 },
  storyRing: {
    width: 64, height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyRingActive: { borderColor: Colors.accent, borderWidth: 2.5 },
  storyRingSeen: { borderColor: Colors.textTertiary },
  storyRingEmpty: { borderColor: Colors.border, borderStyle: 'dashed' },
  storyName: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', maxWidth: 68 },
  addBadge: {
    position: 'absolute',
    bottom: -2, right: -2,
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgSecondary,
  },
  addBadgeText: { color: Colors.white, fontSize: 14, lineHeight: 18 },

  // Section
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.textTertiary,
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgTertiary,
  },

  // Story list item
  storyListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.md,
  },
  storyListInfo: { flex: 1 },
  storyListName: { ...Typography.chatName, color: Colors.textPrimary },
  storyListTime: { ...Typography.timestamp, color: Colors.textTertiary, marginTop: 2 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.chatHeaderName, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { ...Typography.subtitle, color: Colors.textSecondary, textAlign: 'center' },

  // Viewer
  viewer: { flex: 1 },
  viewerImage: { position: 'absolute', inset: 0, width: SCREEN_W, height: SCREEN_H },
  viewerTextContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  viewerEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  viewerText: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white, textAlign: 'center', lineHeight: 36 },
  progressBars: { position: 'absolute', top: 52, left: Spacing.md, right: Spacing.md, flexDirection: 'row', gap: 4 },
  progressBar: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.white },
  viewerHeader: { position: 'absolute', top: 60, left: Spacing.md, right: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  viewerHeaderInfo: { flex: 1 },
  viewerName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.white },
  viewerTime: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  closeBtn: { padding: Spacing.sm },
  closeBtnText: { color: Colors.white, fontSize: 18 },
  tapZones: { position: 'absolute', inset: 0, flexDirection: 'row' },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },
  viewerFooter: { position: 'absolute', bottom: 40, left: Spacing.md, right: Spacing.md, gap: Spacing.sm },
  replyBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  replyInput: { flex: 1, color: Colors.white, fontSize: FontSize.base, paddingVertical: Spacing.sm + 2 },
  sendReply: { color: Colors.white, fontSize: 18 },
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md },
  emojiBtn: { padding: Spacing.xs },
  emojiText: { fontSize: 24 },

  // Create
  createContainer: { flex: 1 },
  createHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg },
  createClose: { color: Colors.white, fontSize: 20 },
  createTitle: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  createPublish: { color: Colors.white, fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  createPreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  createImagePreview: { width: SCREEN_W, height: SCREEN_H * 0.5, resizeMode: 'contain' },
  createTextPreview: { alignItems: 'center', padding: Spacing.xl },
  createEmojiPreview: { fontSize: 64, marginBottom: Spacing.lg },
  createTextInput: { color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, textAlign: 'center', minWidth: 200 },
  createControls: { padding: Spacing.lg, gap: Spacing.md },
  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  modeBtnActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  modeBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  bgRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
  bgCircle: { width: 32, height: 32, borderRadius: 16 },
  bgCircleActive: { borderWidth: 3, borderColor: Colors.white },
  emojiPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  emojiPickerItem: { fontSize: 24, padding: 4 },
  emojiPickerItemActive: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 8 },
});
