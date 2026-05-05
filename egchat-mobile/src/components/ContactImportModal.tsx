// ContactImportModal.tsx — Modal de importación de contactos para React Native
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, FlatList,
  Modal, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Avatar } from './Avatar';

interface AppUser {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  isInContacts?: boolean;
}

interface ContactImportModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentUserId: string;
  apiBaseUrl?: string;
}

type Step = 'welcome' | 'app-users';

export const ContactImportModal: React.FC<ContactImportModalProps> = ({
  visible, onClose, onComplete, currentUserId, apiBaseUrl = '',
}) => {
  const [step, setStep] = useState<Step>('welcome');
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) loadAppUsers();
  }, [visible]);

  const loadAppUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/users/search?q=`);
      const users = await res.json();

      const contactsRes = await fetch(`${apiBaseUrl}/api/contacts`);
      const contacts = await contactsRes.json();
      const existingIds = new Set((contacts || []).map((c: any) => c.contact_user_id?.toString()));

      const filtered = (users || [])
        .filter((u: any) => u.id?.toString() !== currentUserId)
        .map((u: any) => ({
          id: u.id?.toString() || '',
          full_name: u.full_name || 'Usuario',
          phone: u.phone || '',
          avatar_url: u.avatar_url || '',
          isInContacts: existingIds.has(u.id?.toString()),
        }));

      setAppUsers(filtered);
    } catch {
      setAppUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (id: string) => {
    const next = new Set(selectedUsers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedUsers(next);
  };

  const handleAddSelected = async () => {
    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedUsers).map(userId =>
          fetch(`${apiBaseUrl}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contact_user_id: userId }),
          })
        )
      );
      onComplete();
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = appUsers
    .filter(u => !u.isInContacts)
    .filter(u =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>

        {/* Welcome */}
        {step === 'welcome' && (
          <View style={styles.welcomeWrap}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>¡Bienvenido a EGChat!</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.welcomeContent}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>👥</Text>
              </View>
              <Text style={styles.welcomeTitle}>Agrega tus contactos</Text>
              <Text style={styles.welcomeSub}>
                Encuentra a tus amigos y familiares que ya están en EGChat.
              </Text>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => setStep('app-users')}
                disabled={loading}
              >
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Cargando...' : 'Buscar usuarios en EGChat'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Omitir por ahora</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Users */}
        {step === 'app-users' && (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setStep('welcome')}>
                <Text style={styles.backText}>← Atrás</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Usuarios en EGChat</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#00c8a0" />
                <Text style={styles.loadingText}>Cargando usuarios...</Text>
              </View>
            ) : (
              <FlatList
                data={availableUsers}
                keyExtractor={item => item.id}
                style={{ flex: 1 }}
                renderItem={({ item }) => {
                  const isSelected = selectedUsers.has(item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.userItem, isSelected && styles.userItemSelected]}
                      onPress={() => toggleUser(item.id)}
                    >
                      <Avatar name={item.full_name} size={48} photo={item.avatar_url} />
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
              <Text style={styles.selectedCount}>
                {selectedUsers.size} {selectedUsers.size === 1 ? 'contacto seleccionado' : 'contactos seleccionados'}
              </Text>
              <TouchableOpacity
                style={[styles.btnPrimary, selectedUsers.size === 0 && styles.btnDisabled]}
                onPress={handleAddSelected}
                disabled={selectedUsers.size === 0 || loading}
              >
                <Text style={styles.btnPrimaryText}>
                  {loading ? 'Agregando...' : `Agregar ${selectedUsers.size > 0 ? selectedUsers.size : ''} contacto${selectedUsers.size !== 1 ? 's' : ''}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={onClose}>
                <Text style={styles.btnSecondaryText}>Omitir por ahora</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  welcomeWrap: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  closeText: { fontSize: 18, color: '#9CA3AF', padding: 4 },
  backText: { fontSize: 14, color: '#00c8a0', fontWeight: '600' },
  welcomeContent: { flex: 1, alignItems: 'center', padding: 32, gap: 16 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#00c8a0', alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 36 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#111827', textAlign: 'center' },
  welcomeSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  searchWrap: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchInput: {
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  userItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  userItemSelected: { backgroundColor: '#f0fdf4' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userPhone: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  check: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: '#D1D5DB',
    alignItems: 'center', justifyContent: 'center',
  },
  checkSelected: { backgroundColor: '#00c8a0', borderColor: '#00c8a0' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  selectedCount: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  btnPrimary: {
    backgroundColor: '#00c8a0', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#D1D5DB' },
  btnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnSecondary: { padding: 12, alignItems: 'center' },
  btnSecondaryText: { fontSize: 14, color: '#9CA3AF' },
});

export default ContactImportModal;
