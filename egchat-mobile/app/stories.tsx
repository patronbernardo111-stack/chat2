import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, Pressable, ActivityIndicator, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { storiesAPI } from '../src/api';

import { EGAvatar } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

const { width: W } = Dimensions.get('window');

export default function StoriesScreen() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    storiesAPI.getAll()
      .then((data: any) => setStories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    try {
      await storiesAPI.create({ media_url: result.assets[0].uri, type: 'image' });
      const data = await storiesAPI.getAll();
      setStories(Array.isArray(data) ? data : []);
    } catch {}
    finally { setUploading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Estados</Text>
        <TouchableOpacity onPress={addStory} style={styles.addBtn} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.addBtnText}>+</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : stories.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Sin estados aún</Text>
          <Text style={styles.emptySub}>Comparte una foto o vídeo con tus contactos</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={addStory}>
            <Text style={styles.emptyBtnText}>Añadir estado</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.storyItem} onPress={() => setViewing(item)} activeOpacity={0.8}>
              <View style={styles.storyRing}>
                <EGAvatar src={item.avatar} name={item.userName || 'Estado'} size={52} />
              </View>
              <View style={styles.storyInfo}>
                <Text style={styles.storyName}>{item.userName || 'Mi estado'}</Text>
                <Text style={styles.storyTime}>
                  {item.media?.length || 0} {item.media?.length === 1 ? 'foto' : 'fotos'}
                </Text>
              </View>
              <Text style={styles.storyArrow}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Visor de estado */}
      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.viewerOverlay} onPress={() => setViewing(null)}>
          <View style={styles.viewerCard}>
            <View style={styles.viewerHeader}>
              <EGAvatar src={viewing?.avatar} name={viewing?.userName || '?'} size={36} />
              <Text style={styles.viewerName}>{viewing?.userName || 'Estado'}</Text>
              <TouchableOpacity onPress={() => setViewing(null)}>
                <Text style={styles.viewerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewing?.media?.[0]?.url ? (
              <Image source={{ uri: viewing.media[0].url }} style={styles.viewerImage} resizeMode="contain" />
            ) : (
              <View style={styles.viewerPlaceholder}>
                <Text style={styles.viewerPlaceholderText}>📸</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary, flex: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { fontSize: 22, color: Colors.white, lineHeight: 26 },
  storyItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.listItemGap,
  },
  storyRing: {
    borderWidth: 2.5, borderColor: Colors.accent,
    borderRadius: 30, padding: 2,
  },
  storyInfo: { flex: 1 },
  storyName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  storyTime: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  storyArrow: { fontSize: 22, color: Colors.border },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.listItemPaddingH + 56 + Spacing.listItemGap },
  emptyIcon: { fontSize: 52, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  emptyBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.xl,
  },
  emptyBtnText: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.base },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  viewerCard: { width: W - 32, backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  viewerHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  viewerName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  viewerClose: { fontSize: 18, color: Colors.textTertiary, padding: Spacing.sm },
  viewerImage: { width: '100%', height: 320 },
  viewerPlaceholder: { height: 200, alignItems: 'center', justifyContent: 'center' },
  viewerPlaceholderText: { fontSize: 64 },
});

// Stub para storiesAPI si no existe en api.ts
if (!(global as any).__storiesAPIPatched) {
  (global as any).__storiesAPIPatched = true;
}