import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { contactsAPI, chatAPI } from '../src/api';
import { EGAvatar, EGButton, EGInput } from '../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../src/theme';

interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  nickname?: string;
  name?: string;
  phone?: string;
  is_blocked: boolean;
  is_favorite: boolean;
  users?: { id: string; full_name: string; phone: string; avatar_url?: string };
}

// ── ContactItem ───────────────────────────────────────────────────
const ContactItem = React.memo(({
  contact, onPress, onLongPress,
}: {
  contact: Contact;
  onPress: () => void;
  onLongPress: () => void;
}) => {
  const name = contact.nickname || contact.users?.full_name || contact.name || 'Contacto';
  const phone = contact.users?.phone || contact.phone || '';
  const avatar = contact.users?.avatar_url;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.contactItem}
      activeOpacity={0.7}
    >
      <EGAvatar src={avatar} name={name} size={48} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>{name}</Text>
        <Text style={styles.contactPhone}>{phone}</Text>
      </View>
      {contact.is_favorite && <Text style={styles.favStar}>⭐</Text>}
      <TouchableOpacity onPress={onPress} style={styles.chatBtn}>
        <Text style={styles.chatBtnIcon}>💬</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ── AddContactModal ───────────────────────────────────────────────
const AddContactModal = ({
  visible, onClose, onAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onAdded: () => void;
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const add = async () => {
    if (!phone.trim()) { Alert.alert('Error', 'Introduce el número de teléfono'); return; }
    setLoading(true);
    try {
      await contactsAPI.add(undefined, phone.trim(), name.trim() || undefined);
      Alert.alert('✅', 'Contacto añadido correctamente');
      setPhone(''); setName('');
      onAdded();
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo añadir el contacto');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Añadir contacto</Text>
          <EGInput
            label="Número de teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+240 222 XXX XXX"
          />
          <EGInput
            label="Nombre (opcional)"
            value={name}
            onChangeText={setName}
            placeholder="Nombre del contacto"
            autoCapitalize="words"
          />
          <EGButton title={loading ? 'Añadiendo...' : 'Añadir contacto'} onPress={add} loading={loading} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Pantalla principal ────────────────────────────────────────────
export default function ContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showActions, setShowActions] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const data = await contactsAPI.getAll();
      setContacts(data || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadContacts(); }, []);

  const onRefresh = () => { setRefreshing(true); loadContacts(); };

  const openChat = async (contact: Contact) => {
    try {
      const userId = contact.contact_user_id || contact.users?.id;
      if (!userId) return;
      const chat = await chatAPI.createPrivate(userId);
      router.push(`/chat/${chat.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo abrir el chat');
    }
  };

  const handleLongPress = (contact: Contact) => {
    setSelectedContact(contact);
    setShowActions(true);
  };

  const blockContact = async () => {
    if (!selectedContact) return;
    setShowActions(false);
    try {
      await contactsAPI.block(selectedContact.id);
      loadContacts();
      Alert.alert('✅', 'Contacto bloqueado');
    } catch { }
  };

  const removeContact = async () => {
    if (!selectedContact) return;
    setShowActions(false);
    Alert.alert('Eliminar contacto', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await contactsAPI.remove(selectedContact.id);
            loadContacts();
          } catch { }
        },
      },
    ]);
  };

  const filtered = search
    ? contacts.filter(c => {
        const name = c.nickname || c.users?.full_name || c.name || '';
        const phone = c.users?.phone || c.phone || '';
        return name.toLowerCase().includes(search.toLowerCase()) ||
               phone.includes(search);
      })
    : contacts;

  // Agrupar por letra
  const grouped = filtered.reduce((acc, c) => {
    const name = c.nickname || c.users?.full_name || c.name || '?';
    const letter = name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(c);
    return acc;
  }, {} as Record<string, Contact[]>);

  const sections = Object.keys(grouped).sort().map(letter => ({
    letter,
    data: grouped[letter],
  }));

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
        <Text style={styles.headerTitle}>Contactos</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar contactos..."
          placeholderTextColor={Colors.textTertiary}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista */}
      {contacts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Sin contactos aún</Text>
          <Text style={styles.emptySub}>Añade contactos para chatear</Text>
          <EGButton title="Añadir contacto" onPress={() => setShowAdd(true)} style={styles.emptyBtn} />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={item => item.letter}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
          renderItem={({ item: section }) => (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLetter}>{section.letter}</Text>
              </View>
              {section.data.map(contact => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  onPress={() => openChat(contact)}
                  onLongPress={() => handleLongPress(contact)}
                />
              ))}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal añadir */}
      <AddContactModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={loadContacts}
      />

      {/* Modal acciones */}
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable style={styles.actionsOverlay} onPress={() => setShowActions(false)}>
          <View style={styles.actionsMenu}>
            <Text style={styles.actionsName}>
              {selectedContact?.nickname || selectedContact?.users?.full_name || 'Contacto'}
            </Text>
            <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActions(false); if (selectedContact) openChat(selectedContact); }}>
              <Text style={styles.actionText}>💬 Enviar mensaje</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={blockContact}>
              <Text style={styles.actionText}>🚫 Bloquear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]} onPress={removeContact}>
              <Text style={[styles.actionText, { color: Colors.errorText }]}>🗑️ Eliminar contacto</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  addBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: Colors.white, fontSize: 22, fontWeight: FontWeight.regular, lineHeight: 28 },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary, paddingVertical: Spacing.sm + 2 },
  clearSearch: { fontSize: FontSize.base, color: Colors.textTertiary, padding: Spacing.xs },

  // Section header
  sectionHeader: {
    paddingHorizontal: Spacing.listItemPaddingH,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.bgTertiary,
  },
  sectionLetter: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },

  // Contact item
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.listItemGap,
  },
  contactInfo: { flex: 1 },
  contactName: { ...Typography.chatName, color: Colors.textPrimary },
  contactPhone: { ...Typography.timestamp, color: Colors.textTertiary, marginTop: 2 },
  favStar: { fontSize: 14 },
  chatBtn: { padding: Spacing.sm },
  chatBtnIcon: { fontSize: 20 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.screenPadding },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.chatHeaderName, color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptySub: { ...Typography.subtitle, color: Colors.textSecondary, marginBottom: Spacing.xl },
  emptyBtn: { width: 200 },

  // Modal añadir
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.bgSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  handle: { width: 36, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  sheetTitle: { ...Typography.headerTitle, color: Colors.textPrimary, marginBottom: Spacing.xl, textAlign: 'center' },

  // Actions modal
  actionsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  actionsMenu: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    width: 280,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  actionsName: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionItem: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionText: { fontSize: FontSize.md, color: Colors.textPrimary },
});
