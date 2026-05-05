// AddContactModal.tsx — Modal para agregar contactos en React Native
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  Modal, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Avatar } from './Avatar';

interface AddContactModalProps {
  visible: boolean;
  onClose: () => void;
  onAddContact: (phone: string, name?: string) => void;
  existingContacts?: any[];
  currentUserId?: string;
  apiBaseUrl?: string;
}

type Tab = 'number' | 'qr' | 'repertorio';

export const AddContactModal: React.FC<AddContactModalProps> = ({
  visible, onClose, onAddContact, existingContacts = [], currentUserId = '', apiBaseUrl = '',
}) => {
  const [tab, setTab] = useState<Tab>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingUsers, setAddingUsers] = useState(false);

  useEffect(() => {
    if (visible && tab === 'repertorio' && appUsers.length === 0) {
      loadAppUsers();
    }
  }, [visible, tab]);

  const loadAppUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch(`${apiBaseUrl}/api/users/search?q=`);
      const users = await res.json();
      const existingIds = new Set(existingContacts.map((c: any) => c.contact_user_id?.toString()));
      const filtered = (users || [])
        .filter((u: any) => u.id?.toString() !== currentUserId && !existingIds.has(u.id?.toString()))
        .map((u: any) => ({
          id: u.id?.toString() || '',
          full_name: u.full_name || 'Usuario',
          phone: u.phone || '',
          avatar_url: u.avatar_url || '',
        }));
      setAppUsers(filtered);
    } catch {
      setAppUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUser = (id: string) => {
    const next = new Set(selectedUsers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedUsers(next);
  };

  const handleAddByPhone = () => {
    if (phoneNumber.trim().length >= 6) {
      const formatted = phoneNumber.startsWith('+') ? phoneNumber : '+240' + phoneNumber.replace(/\D/g, '');
      onAddContact(formatted, contactName.trim() || undefined);
      onClose();
    }
  };

  const handleAddFromRepertorio = async () => {
    if (selectedUsers.size === 0) return;
    try {
      setAddingUsers(true);
      await Promise.all(
        Array.from(selectedUsers).map(userId =>
          fetch(`${apiBaseUrl}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_user_id: userId }),
          })
        )
      );
      onClose();
    } catch {
      // handle error
    } finally {
      setAddingUsers(false);
    }
  };

  const filteredUsers = appUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: 'number', label: '📞 Teléfono' },
    { id: 'qr', label: '📷 QR' },
    { id: 'repertorio', label: '👥 Repertorio' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Añadir Contacto</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab: Teléfono */}
        {tab === 'number' && (
          <View style={styles.content}>
            <Text style={styles.label}>Nombre del contacto</Text>
            <TextInput
              style={styles.input}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Nombre del contacto"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Número de teléfono</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+240</Text>
              </View>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Número de teléfono"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, phoneNumber.trim().length < 6 && styles.btnDisabled]}
              onPress={handleAddByPhone}
              disabled={phoneNumber.trim().length < 6}
            >
              <Text style={styles.btnPrimaryText}>Añadir contacto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab: QR */}
        {tab === 'qr' && (
          <View style={[styles.content, styles.center]}>
            <Text style={styles.qrIcon}>📷</Text>
            <Text style={styles.qrTitle}>Escanear código QR</Text>
            <Text style={styles.qrSub}>Usa el escáner QR de la app para agregar un contacto</Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={onClose}>
              <Text style={styles.btnPrimaryText}>Abrir escáner QR</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab: Repertorio */}
        {tab === 'repertorio' && (
          <View style={styles.contentFlex}>
            <TextInput
              style={[styles.input, styles.searchInput]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar por nombre o teléfono..."
              placeholderTextColor="#9CA3AF"
            />

            {loadingUsers ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Cargando usuarios...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={item => item.id}
                style={{ flex: 1 }}
                renderItem={({ item }) => {
                  const isSelected = selectedUsers.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.userItem, isSelected && styles.userItemSelected]}
                      onPress={() => toggleUser(item.id)}
                    >
                      <Avatar name={item.full_name} size={44} photo={item.avatar_url} />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.full_name}</Text>
                        <Text style={styles.userPhone}>{item.phone}</Text>
                      </View>
                      <View style={[styles.check, isSelected && styles.checkSelected]}>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios disponibles'}
                    </Text>
                  </View>
                }
              />
            )}

            <View style={styles.footer}>
              {selectedUsers.size > 0 && (
                <Text style={styles.selectedCount}>
                  {selectedUsers.size} {selectedUsers.size === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.btnPrimary, selectedUsers.size === 0 && styles.btnDisabled]}
                onPress={handleAddFromRepertorio}
                disabled={selectedUsers.size === 0 || addingUsers}
              >
                <Text style={styles.btnPrimaryText}>
                  {addingUsers ? 'Agregando...' : `Añadir${selectedUsers.size > 0 ? ` (${selectedUsers.size})` : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 18, color: '#6B7280' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#22c55e' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#22c55e' },
  content: { padding: 16, gap: 8 },
  contentFlex: { flex: 1, padding: 16, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  input: {
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { marginBottom: 8 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  prefix: {
    backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  prefixText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  btnPrimary: {
    backgroundColor: '#22c55e', borderRadius: 12, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  qrIcon: { fontSize: 60 },
  qrTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  qrSub: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  userItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  userItemSelected: { backgroundColor: '#f0fdf4' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  userPhone: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  check: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  footer: { paddingTop: 12, gap: 8 },
  selectedCount: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
});

export default AddContactModal;
