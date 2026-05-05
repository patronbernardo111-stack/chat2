import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { chatAPI, contactsAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../src/theme';
import { useThemeContext } from '../src/theme/ThemeContext';
import { DarkColors } from '../src/theme/darkMode';

export default function NewChatScreen() {
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  useEffect(() => {
    contactsAPI.getAll().then(data => setContacts(data || [])).catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await chatAPI.searchUsers(q.trim());
      setResults(data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const startChat = useCallback(async (user: any) => {
    setCreating(user.id);
    try {
      const chat = await chatAPI.createPrivate(user.id);
      router.replace(`/chat/${chat.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear el chat');
    } finally { setCreating(null); }
  }, []);

  const displayList = query.trim().length >= 2 ? results : contacts;

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => startChat(item)}
      disabled={creating === item.id}
      activeOpacity={0.7}
    >
      <EGAvatar src={item.avatar_url} name={item.full_name || item.name || '?'} size={46} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name || item.name || 'Usuario'}</Text>
        <Text style={styles.phone}>{item.phone || ''}</Text>
      </View>
      {creating === item.id
        ? <ActivityIndicator size="small" color={Colors.accent} />
        : <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bgPrimary }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: C.bgSecondary, borderBottomColor: C.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backIcon, { color: C.textPrimary }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: C.textPrimary }]}>Nuevo chat</Text>
      </View>
      <View style={[styles.searchBar, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          value={query}
          onChangeText={search}
          placeholder="Buscar por nombre o teléfono..."
          placeholderTextColor={C.textTertiary}
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color={Colors.accent} />}
      </View>

      {query.trim().length < 2 && contacts.length > 0 && (
        <Text style={[styles.sectionLabel, { color: C.textTertiary }]}>MIS CONTACTOS</Text>
      )}
      {query.trim().length >= 2 && results.length === 0 && !loading && (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: C.textSecondary }]}>Sin resultados para "{query}"</Text>
        </View>
      )}
      <FlatList
        data={displayList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, { backgroundColor: C.bgSecondary }]} onPress={() => startChat(item)} disabled={creating === item.id} activeOpacity={0.7}>
            <EGAvatar src={item.avatar_url} name={item.full_name || item.name || '?'} size={46} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: C.textPrimary }]}>{item.full_name || item.name || 'Usuario'}</Text>
              <Text style={[styles.phone, { color: C.textTertiary }]}>{item.phone || ''}</Text>
            </View>
            {creating === item.id ? <ActivityIndicator size="small" color={Colors.accent} /> : <Text style={[styles.arrow, { color: C.border }]}>›</Text>}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: C.borderLight }]} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { ...Typography.headerTitle, color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.md },
  sectionLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.bold,
    color: Colors.textTertiary, letterSpacing: 0.5,
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingBottom: Spacing.sm,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    gap: Spacing.listItemGap,
  },
  info: { flex: 1 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  phone: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  arrow: { fontSize: 22, color: Colors.border },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.listItemPaddingH + 46 + Spacing.listItemGap },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
});
