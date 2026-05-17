// ══════════════════════════════════════════════════════════════════
// EGCHAT — Estados / Stories
// Visor tipo Instagram: barra de progreso, swipe, auto-avance
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, Pressable, ActivityIndicator, Image, Dimensions,
  Animated, PanResponder, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { storiesAPI, authAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import {
  Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow,
} from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const { width: W, height: H } = Dimensions.get('window');
const STORY_DURATION = 5000; // ms por historia

// ── Tipos ─────────────────────────────────────────────────────────
interface StoryItem {
  id: string;
  media_url: string;
  type: 'image' | 'video';
  caption?: string;
  created_at: string;
  user?: { id: string; full_name: string; avatar_url?: string };
}

interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar?: string;
  stories: StoryItem[];
  seen: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────
const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h >= 1) return `hace ${h}h`;
  if (m >= 1) return `hace ${m}m`;
  return 'ahora';
};

// ── Barra de progreso de una historia ────────────────────────────
const ProgressBar = ({
  total, current, progress,
}: { total: number; current: number; progress: Animated.Value }) => (
  <View style={pv.container}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={pv.track}>
        {i < current ? (
          <View style={[pv.fill, { width: '100%' }]} />
        ) : i === current ? (
          <Animated.View
            style={[pv.fill, {
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]}
          />
        ) : null}
      </View>
    ))}
  </View>
);

const pv = StyleSheet.create({
  container: { flexDirection: 'row', gap: 3, paddingHorizontal: 8, paddingTop: 8 },
  track: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2, overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
});

// ══════════════════════════════════════════════════════════════════
// VISOR DE HISTORIA — pantalla completa
// ══════════════════════════════════════════════════════════════════
const StoryViewer = ({
  groups, startGroupIndex, onClose,
}: {
  groups: StoryGroup[];
  startGroupIndex: number;
  onClose: () => void;
}) => {
  const [groupIdx, setGroupIdx] = useState(startGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const paused = useRef(false);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const startProgress = useCallback(() => {
    progress.setValue(0);
    timerRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    timerRef.current.start(({ finished }) => {
      if (finished && !paused.current) goNext();
    });
  }, [groupIdx, storyIdx]);

  useEffect(() => {
    startProgress();
    return () => { timerRef.current?.stop(); };
  }, [groupIdx, storyIdx]);

  const goNext = useCallback(() => {
    timerRef.current?.stop();
    const group = groups[groupIdx];
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [groupIdx, storyIdx, groups]);

  const goPrev = useCallback(() => {
    timerRef.current?.stop();
    if (storyIdx > 0) {
      setStoryIdx(i => i - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(0);
    }
  }, [groupIdx, storyIdx]);

  if (!group || !story) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={sv.container}>
        {/* Imagen / video */}
        <Image
          source={{ uri: story.media_url }}
          style={sv.media}
          resizeMode="cover"
        />

        {/* Gradiente superior */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={sv.topGradient}
        />

        {/* Gradiente inferior */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)']}
          style={sv.bottomGradient}
        />

        {/* Barras de progreso */}
        <View style={sv.progressWrap}>
          <ProgressBar
            total={group.stories.length}
            current={storyIdx}
            progress={progress}
          />
        </View>

        {/* Header — avatar + nombre + tiempo + cerrar */}
        <View style={sv.header}>
          <EGAvatar src={group.userAvatar} name={group.userName} size={38} />
          <View style={sv.headerInfo}>
            <Text style={sv.headerName}>{group.userName}</Text>
            <Text style={sv.headerTime}>{timeAgo(story.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sv.closeBtn} activeOpacity={0.7}>
            <Text style={sv.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {story.caption ? (
          <View style={sv.captionWrap}>
            <Text style={sv.caption}>{story.caption}</Text>
          </View>
        ) : null}

        {/* Zonas táctiles: izquierda = anterior, derecha = siguiente */}
        <View style={sv.touchZones}>
          <TouchableOpacity style={sv.touchLeft} onPress={goPrev} activeOpacity={1} />
          <TouchableOpacity style={sv.touchRight} onPress={goNext} activeOpacity={1} />
        </View>
      </View>
    </Modal>
  );
};

const sv = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  media: { ...StyleSheet.absoluteFillObject },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, zIndex: 1 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, zIndex: 1 },
  progressWrap: { position: 'absolute', top: 48, left: 0, right: 0, zIndex: 2 },
  header: {
    position: 'absolute', top: 64, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 2,
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  headerTime: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },
  captionWrap: {
    position: 'absolute', bottom: 60, left: 16, right: 16, zIndex: 2,
  },
  caption: {
    fontSize: 15, color: '#fff', fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  touchZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', zIndex: 3 },
  touchLeft: { flex: 1 },
  touchRight: { flex: 2 },
});

// ══════════════════════════════════════════════════════════════════
// PANTALLA PRINCIPAL — Lista de estados
// ══════════════════════════════════════════════════════════════════
export default function StoriesScreen() {
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  const loadStories = useCallback(async () => {
    try {
      const [data, me] = await Promise.allSettled([
        storiesAPI.getAll(),
        authAPI.me(),
      ]);

      const userId = data.status === 'fulfilled' ? '' : '';
      const meId = me.status === 'fulfilled' ? me.value?.id || '' : '';
      setCurrentUserId(meId);

      if (data.status === 'fulfilled' && Array.isArray(data.value)) {
        const raw: StoryItem[] = data.value;

        // Agrupar por usuario
        const map = new Map<string, StoryGroup>();
        raw.forEach(s => {
          const uid = s.user?.id || 'unknown';
          if (!map.has(uid)) {
            map.set(uid, {
              userId: uid,
              userName: s.user?.full_name || 'Usuario',
              userAvatar: s.user?.avatar_url,
              stories: [],
              seen: false,
            });
          }
          map.get(uid)!.stories.push(s);
        });

        const allGroups = Array.from(map.values());
        const mine = allGroups.find(g => g.userId === meId);
        const others = allGroups.filter(g => g.userId !== meId);

        setMyStories(mine?.stories || []);
        setGroups(others);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStories(); }, []);

  const addStory = async () => {
    Alert.alert('Añadir estado', '¿Cómo quieres añadir tu estado?', [
      {
        text: '📷 Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.85 });
          if (!result.canceled && result.assets[0]) uploadStory(result.assets[0].uri);
        },
      },
      {
        text: '🖼️ Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, quality: 0.85,
          });
          if (!result.canceled && result.assets[0]) uploadStory(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const uploadStory = async (uri: string) => {
    setUploading(true);
    try {
      await storiesAPI.create({ media_url: uri, type: 'image' });
      await loadStories();
    } catch { Alert.alert('Error', 'No se pudo publicar el estado'); }
    finally { setUploading(false); }
  };

  const deleteStory = (storyId: string) => {
    Alert.alert('Eliminar estado', '¿Eliminar este estado?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try { await storiesAPI.delete(storyId); await loadStories(); } catch {}
        },
      },
    ]);
  };

  // Construir lista completa para el visor (mi estado primero)
  const allGroupsForViewer: StoryGroup[] = [
    ...(myStories.length > 0 ? [{
      userId: currentUserId,
      userName: 'Mi estado',
      userAvatar: undefined,
      stories: myStories,
      seen: false,
    }] : []),
    ...groups,
  ];

  return (
    <SafeAreaView style={[st.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#00C8A0', '#00B4E6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={st.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.7}>
          <Text style={st.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>Estados</Text>
        <TouchableOpacity onPress={addStory} style={st.addBtn} disabled={uploading} activeOpacity={0.8}>
          {uploading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={st.addBtnText}>+</Text>}
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator size="large" color={Colors.brand} />
        </View>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* ── Mi estado ── */}
              <View style={[st.section, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
                <Text style={[st.sectionLabel, { color: C.textTertiary }]}>MI ESTADO</Text>
                <TouchableOpacity
                  style={st.myStoryRow}
                  onPress={myStories.length > 0
                    ? () => setViewingGroup(0)
                    : addStory}
                  activeOpacity={0.75}
                >
                  <View style={[st.myStoryRing, myStories.length > 0 && st.myStoryRingActive]}>
                    <View style={st.myStoryAvatar}>
                      <Text style={st.myStoryAvatarText}>👤</Text>
                      <View style={st.myStoryAddBadge}>
                        {uploading
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={st.myStoryAddIcon}>{myStories.length > 0 ? '✓' : '+'}</Text>}
                      </View>
                    </View>
                  </View>
                  <View style={st.myStoryInfo}>
                    <Text style={[st.myStoryName, { color: C.textPrimary }]}>Mi estado</Text>
                    <Text style={[st.myStorySub, { color: C.textSecondary }]}>
                      {myStories.length > 0
                        ? `${myStories.length} ${myStories.length === 1 ? 'foto' : 'fotos'} · ${timeAgo(myStories[0].created_at)}`
                        : 'Toca para añadir un estado'}
                    </Text>
                  </View>
                  {myStories.length > 0 && (
                    <TouchableOpacity
                      onPress={() => deleteStory(myStories[myStories.length - 1].id)}
                      style={st.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={st.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* ── Estados recientes ── */}
              {groups.length > 0 && (
                <View style={[st.section, { backgroundColor: C.bgSecondary }]}>
                  <Text style={[st.sectionLabel, { color: C.textTertiary }]}>RECIENTES</Text>
                  {groups.map((group, i) => (
                    <TouchableOpacity
                      key={group.userId}
                      style={[
                        st.storyRow,
                        i < groups.length - 1 && [st.storyRowBorder, { borderBottomColor: C.borderLight }],
                      ]}
                      onPress={() => setViewingGroup(myStories.length > 0 ? i + 1 : i)}
                      activeOpacity={0.75}
                    >
                      <View style={[st.storyRing, !group.seen && st.storyRingUnseen]}>
                        <EGAvatar src={group.userAvatar} name={group.userName} size={52} />
                      </View>
                      <View style={st.storyInfo}>
                        <Text style={[st.storyName, { color: C.textPrimary }]}>{group.userName}</Text>
                        <Text style={[st.storySub, { color: C.textSecondary }]}>
                          {group.stories.length} {group.stories.length === 1 ? 'foto' : 'fotos'}
                          {' · '}{timeAgo(group.stories[0].created_at)}
                        </Text>
                      </View>
                      <Text style={[st.storyArrow, { color: C.border }]}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Empty state */}
              {groups.length === 0 && myStories.length === 0 && (
                <View style={st.empty}>
                  <Text style={st.emptyIcon}>📸</Text>
                  <Text style={[st.emptyTitle, { color: C.textPrimary }]}>Sin estados aún</Text>
                  <Text style={[st.emptySub, { color: C.textSecondary }]}>
                    Comparte una foto con tus contactos
                  </Text>
                  <TouchableOpacity style={st.emptyBtn} onPress={addStory} activeOpacity={0.8}>
                    <Text style={st.emptyBtnText}>Añadir estado</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          }
        />
      )}

      {/* Visor de historia */}
      {viewingGroup !== null && allGroupsForViewer.length > 0 && (
        <StoryViewer
          groups={allGroupsForViewer}
          startGroupIndex={viewingGroup}
          onClose={() => setViewingGroup(null)}
        />
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12, gap: 8,
  },
  backBtn: { padding: 6 },
  backIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, color: '#fff', lineHeight: 26 },

  section: {
    backgroundColor: Colors.bgSecondary,
    marginBottom: 8,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: Colors.textTertiary,
    letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 8,
  },

  // Mi estado
  myStoryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  myStoryRing: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    padding: 2,
  },
  myStoryRingActive: { borderColor: Colors.brand },
  myStoryAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  myStoryAvatarText: { fontSize: 26 },
  myStoryAddBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bgSecondary,
  },
  myStoryAddIcon: { fontSize: 12, color: '#fff', fontWeight: '900', lineHeight: 14 },
  myStoryInfo: { flex: 1 },
  myStoryName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  myStorySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18 },

  // Otros estados
  storyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  storyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  storyRing: {
    borderWidth: 2.5, borderColor: Colors.border,
    borderRadius: 30, padding: 2,
  },
  storyRingUnseen: { borderColor: Colors.brand },
  storyInfo: { flex: 1 },
  storyName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  storySub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  storyArrow: { fontSize: 22, color: Colors.border },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn: {
    backgroundColor: Colors.brand, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 28,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
