import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { authAPI, userAPI } from '../../src/api';
import { runPushDiagnostic } from '../../src/pushDiagnostic';

export default function AjustesScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    userAPI.getProfile().then(setUser).catch(() => {});
  }, []);

  const logout = async () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: async () => { await authAPI.logout(); router.replace('/(auth)/login'); } }
    ]);
  };

  const ITEMS = [
    { icon: '👤', label: 'Mi Perfil', sub: user?.full_name || 'Cargando...', action: () => {} },
    { icon: '🔔', label: 'Notificaciones', sub: 'Gestionar alertas', action: () => {} },
    { icon: '🔒', label: 'Privacidad', sub: 'Configurar privacidad', action: () => {} },
    { icon: '🎨', label: 'Apariencia', sub: 'Tema y colores', action: () => {} },
    { icon: '🌐', label: 'Idioma', sub: 'Español', action: () => {} },
    { icon: '❓', label: 'Ayuda', sub: 'Centro de ayuda', action: () => {} },
    { icon: '📋', label: 'Términos', sub: 'Términos y condiciones', action: () => {} },
    { icon: '🛠️', label: 'Diagnóstico Push', sub: 'Verificar notificaciones', action: () => runPushDiagnostic() },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.slice(0, 2).toUpperCase() || 'EG'}</Text>
          </View>
          <Text style={styles.name}>{user?.full_name || 'Usuario EGCHAT'}</Text>
          <Text style={styles.phone}>{user?.phone || ''}</Text>
        </View>

        {/* Opciones */}
        <View style={styles.section}>
          {ITEMS.map((item, i) => (
            <TouchableOpacity key={item.label} style={[styles.item, i < ITEMS.length - 1 && styles.itemBorder]} onPress={item.action}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemSub}>{item.sub}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>EGCHAT v1.0.0 · Guinea Ecuatorial</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  profileCard: { alignItems: 'center', padding: 28, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F2F5' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF9', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#00c8a0' },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#00c8a0' },
  name: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  phone: { fontSize: 13, color: '#9CA3AF' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F2F5' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemIcon: { fontSize: 20, width: 32, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  arrow: { fontSize: 20, color: '#D1D5DB' },
  logoutBtn: { margin: 16, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginBottom: 24 },
});
