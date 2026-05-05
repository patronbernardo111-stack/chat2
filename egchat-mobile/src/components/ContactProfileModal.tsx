// ContactProfileModal.tsx — Perfil de contacto/grupo para React Native
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, SafeAreaView, Switch, Alert,
} from 'react-native';
import { Avatar } from './Avatar';

interface Msg { id: string; from: 'me' | 'them'; text: string; time: string }

interface Props {
  visible: boolean;
  contact: any;
  onClose: () => void;
  mutedChats?: string[];
  blockedChats?: string[];
  pinnedChats?: string[];
  chatMessages?: Record<string, Msg[]>;
  allGroups?: any[];
  userBalance?: number;
  isFavorite?: boolean;
  onMuteToggle?: (id: string) => void;
  onBlockToggle?: (id: string) => void;
  onPinToggle?: (id: string) => void;
  onClearChat?: (id: string) => void;
  onDeleteContact?: (id: string) => void;
  onSendMoney?: (contact: any) => void;
  onStartCall?: (type: 'audio' | 'video', contact: any) => void;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  isInContacts?: boolean;
  onAddContact?: () => void;
  groupMembers?: any[];
  currentUserId?: string;
  onRemoveGroupMember?: (userId: string) => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

const Row = ({
  icon, label, sub, onPress, danger = false, value, isSwitch, switchValue,
}: {
  icon: string; label: string; sub?: string; onPress?: () => void;
  danger?: boolean; value?: string; isSwitch?: boolean; switchValue?: boolean;
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !isSwitch}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.rowIcon}>{icon}</Text>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {sub && <Text style={styles.rowSub}>{sub}</Text>}
    </View>
    {value && <Text style={styles.rowValue}>{value}</Text>}
    {isSwitch && <Switch value={switchValue} onValueChange={onPress} trackColor={{ true: '#00c8a0' }} />}
    {onPress && !isSwitch && <Text style={styles.rowChevron}>›</Text>}
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

export const ContactProfileModal: React.FC<Props> = ({
  visible, contact: cp, onClose,
  mutedChats = [], blockedChats = [], pinnedChats = [],
  chatMessages = {}, allGroups = [], userBalance = 0, isFavorite,
  onMuteToggle, onBlockToggle, onPinToggle, onClearChat,
  onDeleteContact, onSendMoney, onStartCall, onFavoriteToggle,
  isInContacts = true, onAddContact,
  groupMembers = [], currentUserId,
  onRemoveGroupMember, onLeaveGroup, onDeleteGroup,
}) => {
  const [tab, setTab] = useState<'info' | 'media' | 'grupos'>('info');
  const [starred, setStarred] = useState(!!isFavorite);

  if (!cp) return null;

  const isGroup = !!cp.isGroup || cp.type === 'group';
  const cpId = cp.id?.toString() || cp.title;
  const isMuted = mutedChats.includes(cpId);
  const isBlocked = blockedChats.includes(cpId);
  const isPinned = pinnedChats.includes(cpId);
  const msgs = chatMessages[cpId] || [];
  const mediaCount = msgs.filter((m: any) => m.imageUrl || m.text?.startsWith('📷')).length;

  const sharedGroups = allGroups.filter((g: any) => {
    const members = g.members_list || g.participants || [];
    return members.some((m: any) => m.user_id?.toString() === cpId || m.id?.toString() === cpId);
  });

  const handleStarToggle = () => {
    const newVal = !starred;
    setStarred(newVal);
    onFavoriteToggle?.(cpId, newVal);
  };

  const TABS = isGroup
    ? [['info', 'Información'], ['media', 'Multimedia'], ['grupos', 'Integrantes']]
    : [['info', 'Información'], ['media', 'Multimedia'], ['grupos', 'Grupos']];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isGroup ? 'Info del grupo' : 'Info del contacto'}
          </Text>
          <TouchableOpacity onPress={handleStarToggle} style={styles.headerBtn}>
            <Text style={styles.starIcon}>{starred ? '⭐' : '☆'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Avatar + nombre */}
          <View style={styles.profileSection}>
            <Avatar
              name={cp.title || cp.name || '?'}
              size={90}
              photo={cp.avatarUrl || cp.avatar_url || cp.photo}
              status={cp.status}
              showStatus={!isGroup}
            />
            <Text style={styles.profileName}>{cp.title || cp.name}</Text>
            <Text style={[
              styles.profileStatus,
              cp.status === 'online' && { color: '#22c55e' },
              cp.status === 'away' && { color: '#f59e0b' },
            ]}>
              {cp.status === 'online' ? 'En línea' : cp.status === 'away' ? 'Ausente' : 'Desconectado'}
            </Text>
            <Text style={styles.profilePhone}>{cp.phone || cp.subtitle || ''}</Text>

            {/* Acciones rápidas */}
            <View style={styles.quickActions}>
              {[
                { icon: '📞', label: 'Llamar', action: () => onStartCall?.('audio', cp) },
                { icon: '📹', label: 'Video', action: () => onStartCall?.('video', cp) },
                { icon: '💬', label: 'Mensaje', action: onClose },
                { icon: '💸', label: 'Enviar', action: () => { onClose(); onSendMoney?.(cp); } },
              ].map(a => (
                <TouchableOpacity key={a.label} style={styles.quickAction} onPress={a.action}>
                  <Text style={styles.quickActionIcon}>{a.icon}</Text>
                  <Text style={styles.quickActionLabel}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Botón añadir contacto */}
            {!isGroup && !isInContacts && onAddContact && (
              <TouchableOpacity style={styles.addContactBtn} onPress={onAddContact}>
                <Text style={styles.addContactBtnText}>+ Añadir a mis contactos</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {TABS.map(([id, label]) => (
              <TouchableOpacity
                key={id}
                style={[styles.tab, tab === id && styles.tabActive]}
                onPress={() => setTab(id as any)}
              >
                <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB INFO */}
          {tab === 'info' && (
            <View>
              <View style={styles.section}>
                {isGroup ? (
                  <>
                    <Row icon="👥" label={`${cp.members || groupMembers.length || 0} miembros`} sub="Integrantes del grupo" />
                    <Divider />
                    <Row icon="📝" label={cp.description || cp.subtitle || 'Sin descripción'} sub="Descripción" />
                  </>
                ) : (
                  <>
                    <Row icon="📞" label={cp.phone || '+240 222 *** ***'} sub="Teléfono móvil" />
                    <Divider />
                    <Row icon="📧" label={cp.email || 'No disponible'} sub="Email" />
                    <Divider />
                    <Row icon="📍" label="Malabo, Guinea Ecuatorial" sub="Ubicación" />
                  </>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Configuración del chat</Text>
                <Row
                  icon={isMuted ? '🔕' : '🔔'}
                  label="Silenciar notificaciones"
                  sub={isMuted ? 'Silenciado' : 'Activo'}
                  isSwitch
                  switchValue={isMuted}
                  onPress={() => onMuteToggle?.(cpId)}
                />
                <Divider />
                <Row
                  icon="📌"
                  label="Fijar chat"
                  sub={isPinned ? 'Fijado' : 'No fijado'}
                  isSwitch
                  switchValue={isPinned}
                  onPress={() => onPinToggle?.(cpId)}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Acciones</Text>
                <Row
                  icon="🗑️"
                  label="Vaciar chat"
                  onPress={() => {
                    Alert.alert('Vaciar chat', '¿Eliminar todos los mensajes?', [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Vaciar', style: 'destructive', onPress: () => onClearChat?.(cpId) },
                    ]);
                  }}
                />
                <Divider />
                <Row
                  icon="🚫"
                  label={isBlocked ? 'Desbloquear' : 'Bloquear'}
                  danger={!isBlocked}
                  onPress={() => onBlockToggle?.(cpId)}
                />
                {!isGroup && (
                  <>
                    <Divider />
                    <Row
                      icon="❌"
                      label="Eliminar contacto"
                      danger
                      onPress={() => {
                        Alert.alert('Eliminar contacto', '¿Estás seguro?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => { onDeleteContact?.(cpId); onClose(); } },
                        ]);
                      }}
                    />
                  </>
                )}
                {isGroup && (
                  <>
                    <Divider />
                    <Row
                      icon="🚪"
                      label="Salir del grupo"
                      danger
                      onPress={() => {
                        Alert.alert('Salir del grupo', '¿Salir de este grupo?', [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Salir', style: 'destructive', onPress: () => { onLeaveGroup?.(); onClose(); } },
                        ]);
                      }}
                    />
                  </>
                )}
              </View>
            </View>
          )}

          {/* TAB MEDIA */}
          {tab === 'media' && (
            <View style={styles.section}>
              <Text style={styles.emptyText}>
                {mediaCount > 0 ? `${mediaCount} archivos multimedia` : 'Sin archivos multimedia'}
              </Text>
            </View>
          )}

          {/* TAB GRUPOS / INTEGRANTES */}
          {tab === 'grupos' && (
            <View style={styles.section}>
              {isGroup ? (
                groupMembers.length > 0 ? (
                  groupMembers.map((m: any) => (
                    <View key={m.user_id || m.id} style={styles.memberItem}>
                      <Avatar name={m.full_name || 'Usuario'} size={40} photo={m.avatar_url} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{m.full_name || 'Usuario'}</Text>
                        <Text style={styles.memberRole}>{m.role === 'admin' ? '👑 Admin' : 'Miembro'}</Text>
                      </View>
                      {m.user_id?.toString() !== currentUserId && onRemoveGroupMember && (
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert('Eliminar miembro', `¿Eliminar a ${m.full_name}?`, [
                              { text: 'Cancelar', style: 'cancel' },
                              { text: 'Eliminar', style: 'destructive', onPress: () => onRemoveGroupMember(m.user_id) },
                            ]);
                          }}
                        >
                          <Text style={styles.removeMember}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin integrantes</Text>
                )
              ) : (
                sharedGroups.length > 0 ? (
                  sharedGroups.map((g: any) => (
                    <View key={g.id} style={styles.memberItem}>
                      <Text style={styles.groupIcon}>👥</Text>
                      <Text style={styles.memberName}>{g.title || g.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Sin grupos en común</Text>
                )
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  headerBtn: { padding: 6 },
  headerBtnText: { fontSize: 20, color: '#374151' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  starIcon: { fontSize: 20 },
  profileSection: {
    backgroundColor: '#fff', padding: 24, alignItems: 'center', gap: 6, marginBottom: 8,
  },
  profileName: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 8 },
  profileStatus: { fontSize: 13, color: '#9CA3AF' },
  profilePhone: { fontSize: 13, color: '#9CA3AF' },
  quickActions: { flexDirection: 'row', gap: 24, marginTop: 16 },
  quickAction: { alignItems: 'center', gap: 4 },
  quickActionIcon: { fontSize: 24 },
  quickActionLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  addContactBtn: {
    marginTop: 12, backgroundColor: '#00c8a0', borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  addContactBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5', marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00b4e6' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive: { color: '#00b4e6', fontWeight: '700' },
  section: { backgroundColor: '#fff', marginBottom: 8 },
  sectionLabel: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
    fontSize: 12, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  rowIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, color: '#111827' },
  rowLabelDanger: { color: '#EF4444' },
  rowSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  rowValue: { fontSize: 13, color: '#9CA3AF' },
  rowChevron: { fontSize: 18, color: '#D1D5DB' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 52 },
  memberItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  memberRole: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  removeMember: { fontSize: 16, color: '#EF4444', padding: 4 },
  groupIcon: { fontSize: 24 },
  emptyText: { padding: 24, textAlign: 'center', color: '#9CA3AF', fontSize: 14 },
});

export default ContactProfileModal;
