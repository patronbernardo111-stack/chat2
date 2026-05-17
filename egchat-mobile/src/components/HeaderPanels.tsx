// ══════════════════════════════════════════════════════════════════
// EGCHAT — HeaderPanels
// Panel de Notificaciones + Menú hamburguesa + Modal Clima
// Fiel a la versión web
// ══════════════════════════════════════════════════════════════════
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Alert, Image,
} from 'react-native';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon } from 'react-native-svg';
import { router } from 'expo-router';
import { authAPI } from '../api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '../theme';

// ── Tipos ─────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'message' | 'payment' | 'system' | 'security' | 'taxi' | 'bet';
  title: string;
  body: string;
  time: string;
  read: boolean;
  chatId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────
const colorForType = (type: AppNotification['type']) => {
  if (type === 'message')  return '#00b4e6';
  if (type === 'payment')  return '#00c8a0';
  if (type === 'taxi')     return '#f59e0b';
  if (type === 'security') return '#ef4444';
  if (type === 'bet')      return '#a855f7';
  return '#6b7280';
};

const IconForType = ({ type }: { type: AppNotification['type'] }) => {
  const c = colorForType(type);
  if (type === 'message') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </Svg>
  );
  if (type === 'payment') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Rect x="2" y="5" width="20" height="14" rx="2"/>
      <Line x1="2" y1="10" x2="22" y2="10"/>
    </Svg>
  );
  if (type === 'taxi') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Rect x="1" y="3" width="15" height="13" rx="2"/>
      <Path d="M16 8h4l3 3v5h-7V8z"/>
      <Circle cx="5.5" cy="18.5" r="2.5"/>
      <Circle cx="18.5" cy="18.5" r="2.5"/>
    </Svg>
  );
  if (type === 'security') return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </Svg>
  );
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round">
      <Circle cx="12" cy="12" r="10"/>
      <Line x1="12" y1="8" x2="12" y2="12"/>
      <Line x1="12" y1="16" x2="12.01" y2="16"/>
    </Svg>
  );
};

// ══════════════════════════════════════════════════════════════════
// PANEL NOTIFICACIONES
// ══════════════════════════════════════════════════════════════════
export const NotificationsPanel = ({
  visible,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
  onNotifPress,
}: {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onNotifPress: (n: AppNotification) => void;
}) => {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={np.overlay} onPress={onClose}>
        <Pressable style={np.panel} onPress={() => {}}>
          {/* Header */}
          <View style={np.header}>
            <View style={np.headerLeft}>
              <Text style={np.title}>Notificaciones</Text>
              {unread > 0 && (
                <View style={np.unreadBadge}>
                  <Text style={np.unreadText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
            <View style={np.headerRight}>
              {notifications.length > 0 && (
                <TouchableOpacity onPress={onMarkAllRead} activeOpacity={0.7}>
                  <Text style={np.markAll}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={np.closeBtn} activeOpacity={0.7}>
                <Text style={np.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lista */}
          <ScrollView style={np.list} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={np.empty}>
                <Text style={np.emptyIcon}>🔔</Text>
                <Text style={np.emptyTitle}>Sin notificaciones</Text>
                <Text style={np.emptySub}>Los mensajes, pagos y más aparecerán aquí</Text>
              </View>
            ) : notifications.map((n, i) => (
              <TouchableOpacity
                key={n.id}
                style={[np.item, !n.read && np.itemUnread, i === notifications.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => onNotifPress(n)}
                activeOpacity={0.7}
              >
                {/* Icono tipo */}
                <View style={[np.iconWrap, { backgroundColor: colorForType(n.type) + '18', borderColor: colorForType(n.type) + '30' }]}>
                  <IconForType type={n.type} />
                </View>
                {/* Texto */}
                <View style={np.itemText}>
                  <Text style={[np.itemTitle, !n.read && np.itemTitleUnread]} numberOfLines={1}>{n.title}</Text>
                  <Text style={np.itemBody} numberOfLines={1}>{n.body}</Text>
                </View>
                {/* Hora + dot */}
                <View style={np.itemMeta}>
                  <Text style={np.itemTime}>{n.time}</Text>
                  {!n.read && <View style={[np.dot, { backgroundColor: colorForType(n.type) }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          {notifications.length > 0 && (
            <View style={np.footer}>
              <TouchableOpacity onPress={onClearAll} activeOpacity={0.7}>
                <Text style={np.clearAll}>Limpiar todo</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const np = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 8,
  },
  panel: {
    width: 320,
    maxHeight: 480,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  unreadText: { fontSize: 11, fontWeight: FontWeight.bold, color: '#fff' },
  markAll: { fontSize: 11, fontWeight: FontWeight.semibold, color: Colors.brand },
  closeBtn: { padding: 2 },
  closeText: { fontSize: 16, color: Colors.textTertiary },
  list: { maxHeight: 360 },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemUnread: { backgroundColor: 'rgba(0,180,230,0.04)' },
  iconWrap: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, flexShrink: 0,
  },
  itemText: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, marginBottom: 2 },
  itemTitleUnread: { fontWeight: FontWeight.bold },
  itemBody: { fontSize: FontSize.xs, color: Colors.textSecondary },
  itemMeta: { alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  itemTime: { fontSize: 10, color: Colors.textTertiary },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  footer: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  clearAll: { fontSize: FontSize.sm, color: Colors.textTertiary },
});

// ══════════════════════════════════════════════════════════════════
// MENÚ HAMBURGUESA
// ══════════════════════════════════════════════════════════════════
export const HamburgerMenu = ({
  visible,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user?: { full_name?: string; avatar_url?: string; phone?: string } | null;
}) => {
  const initials = user?.full_name
    ?.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || 'EG';

  const items = [
    { id: 'perfil',         icon: '👤', label: 'Mi Perfil',           sub: 'Ver y editar tu perfil',    color: Colors.textPrimary },
    { id: 'nuevo-contacto', icon: '➕', label: 'Nuevo contacto',       sub: 'Añadir a tu lista',         color: Colors.textPrimary },
    { id: 'crear-grupo',    icon: '👥', label: 'Crear grupo',          sub: 'Nuevo grupo de chat',       color: Colors.textPrimary },
    { id: 'contactos',      icon: '📋', label: 'Mis contactos',        sub: 'Ver todos tus contactos',   color: Colors.textPrimary },
    { id: 'mensajes-arch',  icon: '📦', label: 'Mensajes archivados',  sub: 'Chats archivados',          color: Colors.textPrimary },
    { id: 'notificaciones', icon: '🔔', label: 'Notificaciones',       sub: 'Gestionar alertas',         color: Colors.textPrimary },
    { id: 'privacidad',     icon: '🔒', label: 'Privacidad',           sub: 'Configurar privacidad',     color: Colors.textPrimary },
    { id: 'ajustes',        icon: '⚙️', label: 'Ajustes',              sub: 'Configuración de la app',   color: Colors.textPrimary },
    { id: 'ayuda',          icon: '❓', label: 'Ayuda y soporte',      sub: 'Centro de ayuda',           color: Colors.textPrimary },
    { id: 'salir',          icon: '🚪', label: 'Cerrar sesión',        sub: 'Salir de tu cuenta',        color: '#EF4444' },
  ];

  const handlePress = (id: string) => {
    onClose();
    setTimeout(() => {
      switch (id) {
        case 'perfil':
          router.push('/(tabs)/ajustes' as any);
          break;
        case 'nuevo-contacto':
          router.push('/contacts' as any);
          break;
        case 'crear-grupo':
          router.push('/new-chat' as any);
          break;
        case 'contactos':
          router.push('/contacts' as any);
          break;
        case 'mensajes-arch':
          router.push('/(tabs)/mensajeria' as any);
          break;
        case 'notificaciones':
          router.push('/(tabs)/ajustes' as any);
          break;
        case 'privacidad':
          router.push('/(tabs)/ajustes' as any);
          break;
        case 'ajustes':
          router.push('/(tabs)/ajustes' as any);
          break;
        case 'ayuda':
          router.push('/(tabs)/ajustes' as any);
          break;
        case 'salir':
          Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Cerrar sesión',
              style: 'destructive',
              onPress: async () => {
                await authAPI.logout();
                router.replace('/(auth)/login' as any);
              },
            },
          ]);
          break;
      }
    }, 180);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={hm.overlay} onPress={onClose}>
        <Pressable style={hm.panel} onPress={() => {}}>
          {/* Header usuario */}
          <View style={hm.userHeader}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={hm.avatar} />
            ) : (
              <View style={hm.avatarFallback}>
                <Text style={hm.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={hm.userInfo}>
              <Text style={hm.userName} numberOfLines={1}>{user?.full_name || 'Usuario'}</Text>
              <Text style={hm.userStatus}>● En línea</Text>
            </View>
          </View>

          {/* Items */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
            {items.map((item, i) => (
              <TouchableOpacity
                key={item.id}
                style={[hm.item, i === items.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => handlePress(item.id)}
                activeOpacity={0.7}
              >
                <Text style={hm.itemIcon}>{item.icon}</Text>
                <View style={hm.itemText}>
                  <Text style={[hm.itemLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={hm.itemSub}>{item.sub}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const hm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 8,
  },
  panel: {
    width: 240,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.bgSecondary,
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: FontWeight.bold, color: '#fff' },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  userStatus: { fontSize: 10, color: Colors.brand, fontWeight: FontWeight.semibold, marginTop: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  itemIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  itemText: { flex: 1 },
  itemLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textPrimary, lineHeight: 18 },
  itemSub: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },
});

// ══════════════════════════════════════════════════════════════════
// MODAL CLIMA
// ══════════════════════════════════════════════════════════════════
export const WeatherModal = ({
  visible,
  onClose,
  temp,
  city,
  condition,
}: {
  visible: boolean;
  onClose: () => void;
  temp: string;
  city: string;
  condition: 'sunny' | 'cloudy' | 'rain';
}) => {
  const conditionLabel = condition === 'sunny' ? '☀️ Soleado' : condition === 'cloudy' ? '☁️ Nublado' : '🌧️ Lluvia';
  const conditionColor = condition === 'sunny' ? '#f59e0b' : condition === 'cloudy' ? '#6b7280' : '#3b82f6';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={wm.overlay} onPress={onClose}>
        <Pressable style={wm.panel} onPress={() => {}}>
          {/* Header */}
          <View style={wm.header}>
            <Text style={wm.headerTitle}>🌍 Clima en {city}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={wm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Temperatura principal */}
          <View style={wm.main}>
            <Text style={wm.tempBig}>{temp}</Text>
            <Text style={[wm.condition, { color: conditionColor }]}>{conditionLabel}</Text>
            <Text style={wm.city}>{city}, Guinea Ecuatorial</Text>
          </View>

          {/* Detalles */}
          <View style={wm.details}>
            {[
              { label: 'Humedad',    value: '78%',    icon: '💧' },
              { label: 'Viento',     value: '12 km/h', icon: '💨' },
              { label: 'Sensación',  value: `${parseInt(temp) + 2}°`, icon: '🌡️' },
              { label: 'UV',         value: 'Alto',   icon: '☀️' },
            ].map(d => (
              <View key={d.label} style={wm.detailItem}>
                <Text style={wm.detailIcon}>{d.icon}</Text>
                <Text style={wm.detailValue}>{d.value}</Text>
                <Text style={wm.detailLabel}>{d.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={wm.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={wm.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const wm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingLeft: 8,
  },
  panel: {
    width: 280,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  closeText: { fontSize: 16, color: Colors.textTertiary },
  main: { alignItems: 'center', paddingVertical: 24 },
  tempBig: { fontSize: 56, fontWeight: '800', color: Colors.textPrimary, lineHeight: 64 },
  condition: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, marginTop: 4 },
  city: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 6 },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 16,
  },
  detailItem: { alignItems: 'center', gap: 4 },
  detailIcon: { fontSize: 20 },
  detailValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  detailLabel: { fontSize: 10, color: Colors.textTertiary },
  closeBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.brand,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.base },
});
