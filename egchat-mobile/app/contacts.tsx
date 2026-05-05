import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { contactsAPI, chatAPI } from '../src/api';
import { EGAvatar } from '../src/components/ui';
import { Colors, Typography, Spacing, BorderRadius, FontSize, FontWeight } from '../src/theme';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addPhone, setAddPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await contactsAPI.getAll();
      setContacts(data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const addContact = useCallback(async () => {
    const phone = addPhone.trim();
    if (!phone) return;
    setAdding(true);
    try {
      await contactsAPI.add(undefined, phone);
      setAddPhone('');
      load();
      Alert.alert('✅', 'Contacto añadido');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo añadir el contacto');
    } finally { setAdding(false); }
  }, [addPhone]);

  const removeContact = useCallback((id: string, name: string) => {
    Alert.alert('Eliminar contacto', `¿Eliminar a ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await contactsAPI.remove(id).catch(() => {});
          setContacts(prev => prev.filter(c => c.id !== id));
        },
      },
    ]);
  }, []);

  const openChat = useCallback(async (userId: string) => {
    try {
      const chat = await chatAPI.createPrivate(userId);
      router.replace(`/chat/${chat.id}` as any);
    } catch {}
  }, []);

  const filtered = query
    ? contacts.filter(c =>
        (c.full_name || c.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (c.phone || '').includes(query)
      )
    : contacts;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Contactos</Text>
        <Text style={styles.count}>{contacts.length}</Text>
      </View>

      {/* Añadir contacto */}
      <View style={styles.addBar}>
        <TextInput
          style={styles.addInput}
          value={addPhone}
          onChangeText={setAddPhone}
          placeholder="Añadir por teléfono..."
          placeholderTextColor={Colors.textTertiary}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={[styles.addBtn, !addPhone.trim() && styles.addBtnDisabled]}
          onPress={addContact}
          disabled={!addPhone.trim() || adding}
        >
          {adding
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={styles.addBtnText}>+</Text>}
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar contacto..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>{query ? 'Sin resultados' : 'No tienes contactos aún'}</Text>
          <Text style={styles.emptySub}>Añade un contacto por su número de teléfono</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => openChat(item.contact_user_id || item.id)}
              onLongPress={() => removeContact(item.id, item.full_name || item.name || 'Contacto')}
              activeOpacity={0.7}
            >
              <EGAvatar src={item.avatar_url} name={item.full_name || item.name || '?'} size={46} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.full_name || item.name || 'Usuario'}</Text>
                <Text style={styles.phone}>{item.phone || ''}</Text>
              </View>
              <TouchableOpacity onPress={() => openChat(item.contact_user_id || item.id)} style={styles.chatBtn}>
                <Text style={styles.chatBtnIcon}>💬</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  count: {
    fontSize: FontSize.sm, color: Colors.white,
    backgroundColor: Colors.accent,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
    fontWeight: FontWeight.bold,
  },
  addBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.md, gap: Spacing.sm,
  },
  addInput: {
    flex: 1, backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base, color: Colors.textPrimary,
  },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.border },
  addBtnText: { fontSize: 24, color: Colors.white, lineHeight: 28 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.sm + 2 },
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
  chatBtn: { padding: Spacing.sm },
  chatBtnIcon: { fontSize: 20 },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.listItemPaddingH + 46 + Spacing.listItemGap },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
});
