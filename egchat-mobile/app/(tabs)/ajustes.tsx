import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Image, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { authAPI, userAPI, getToken } from '../../src/api';
import { EGButton, EGInput, EGCard, EGAvatar } from '../../src/components/ui';
import {
  Colors, Typography, Spacing, BorderRadius,
  FontSize, FontWeight, Shadow,
} from '../../src/theme';

interface User {
  id: string;
  phone: string;
  full_name: string;
  avatar_url?: string;
  app_version?: string;
}

// ── SettingsItem ──────────────────────────────────────────────────
const SettingsItem = ({
  icon, label, sub, onPress, danger = false,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.settingsItem}
    activeOpacity={0.7}
  >
    <Text style={styles.settingsIcon}>{icon}</Text>
    <View style={styles.settingsInfo}>
      <Text style={[styles.settingsLabel, danger && { color: Colors.errorText }]}>{label}</Text>
      {sub && <Text style={styles.settingsSub}>{sub}</Text>}
    </View>
    <Text style={styles.settingsArrow}>›</Text>
  </TouchableOpacity>
);

// ── Pantalla principal ────────────────────────────────────────────
export default function AjustesScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [nameError, setNameError] = useState('');

  // Cargar perfil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await authAPI.me();
        setUser(data);
        setEditedName(data.full_name || '');
      } catch {
        // Fallback: leer del token
        const token = await getToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ id: payload.id, phone: payload.phone, full_name: '' });
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  // Cambiar foto
  const pickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para cambiar la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      // Crear FormData con la imagen
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      // Subir via API
      const token = await getToken();
      const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com';
      const res = await fetch(`${BASE}/api/user/avatar`, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const { avatar_url } = await res.json();
        // Actualizar perfil con la nueva URL
        await authAPI.updateProfile({ avatar_url });
        setUser(prev => prev ? { ...prev, avatar_url } : prev);
        Alert.alert('✅', 'Foto actualizada correctamente');
      } else {
        // Si el endpoint no existe, guardar localmente
        setUser(prev => prev ? { ...prev, avatar_url: asset.uri } : prev);
      }
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la foto. Intenta de nuevo.');
    } finally {
      setUploadingPhoto(false);
    }
  }, []);

  // Guardar nombre
  const saveName = useCallback(async () => {
    const trimmed = editedName.trim();
    if (trimmed.length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      await authAPI.updateProfile({ full_name: trimmed });
      setUser(prev => prev ? { ...prev, full_name: trimmed } : prev);
      setEditing(false);
      Alert.alert('✅', 'Nombre actualizado correctamente');
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el nombre.');
    } finally {
      setSaving(false);
    }
  }, [editedName]);

  // Logout
  const logout = useCallback(() => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await authAPI.logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const initials = user?.full_name
    ?.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('') || 'EG';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ajustes</Text>
        </View>

        {/* ── Perfil Card ── */}
        <EGCard style={styles.profileCard}>
          {/* Avatar con botón de cámara */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} disabled={uploadingPhoto}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                {uploadingPhoto
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={styles.cameraIcon}>📷</Text>
                }
              </View>
            </TouchableOpacity>
          </View>

          {/* Nombre y teléfono */}
          {!editing ? (
            <>
              <Text style={styles.userName}>{user?.full_name || 'Sin nombre'}</Text>
              <Text style={styles.userPhone}>{user?.phone || ''}</Text>

              <View style={styles.profileActions}>
                <EGButton
                  title="Editar perfil"
                  onPress={() => { setEditing(true); setEditedName(user?.full_name || ''); }}
                  style={styles.editBtn}
                />
              </View>
            </>
          ) : (
            /* ── Formulario edición ── */
            <View style={styles.editForm}>
              <EGInput
                label="Nombre completo"
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Tu nombre"
                autoCapitalize="words"
                error={nameError}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <View style={styles.editActions}>
                <EGButton
                  title={saving ? 'Guardando...' : 'Guardar'}
                  onPress={saveName}
                  loading={saving}
                  style={{ flex: 1 }}
                />
                <EGButton
                  title="Cancelar"
                  onPress={() => { setEditing(false); setNameError(''); }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </EGCard>

        {/* ── Opciones ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUENTA</Text>
          <EGCard style={styles.optionsCard}>
            <SettingsItem icon="🔔" label="Notificaciones" sub="Gestionar alertas" />
            <View style={styles.divider} />
            <SettingsItem icon="🔒" label="Privacidad y Seguridad" sub="Configurar privacidad" />
            <View style={styles.divider} />
            <SettingsItem icon="🌐" label="Idioma" sub="Español" />
          </EGCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN</Text>
          <EGCard style={styles.optionsCard}>
            <SettingsItem icon="ℹ️" label="Acerca de EGCHAT" sub="Versión 1.0.0" />
            <View style={styles.divider} />
            <SettingsItem icon="📋" label="Términos y condiciones" />
            <View style={styles.divider} />
            <SettingsItem icon="🛡️" label="Política de privacidad" />
          </EGCard>
        </View>

        {/* ── Cerrar sesión ── */}
        <View style={styles.section}>
          <EGCard style={styles.optionsCard}>
            <TouchableOpacity onPress={logout} style={styles.logoutItem} activeOpacity={0.7}>
              <Text style={styles.logoutText}>🚪 Cerrar sesión</Text>
            </TouchableOpacity>
          </EGCard>
        </View>

        <Text style={styles.version}>EGCHAT v1.0.0 · Guinea Ecuatorial</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgPrimary },

  // Header
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: { ...Typography.headerTitle, color: Colors.textPrimary },

  // Profile card
  profileCard: {
    margin: Spacing.screenPadding,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatarContainer: { marginBottom: Spacing.md },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  avatarFallback: {
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  cameraIcon: { fontSize: 14 },
  userName: {
    ...Typography.headerTitle,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  userPhone: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  profileActions: { width: '100%' },
  editBtn: { marginTop: 0 },

  // Edit form
  editForm: { width: '100%', marginTop: Spacing.sm },
  editActions: { flexDirection: 'row', gap: Spacing.sm },

  // Sections
  section: { paddingHorizontal: Spacing.screenPadding, marginBottom: Spacing.sm },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  optionsCard: { padding: 0, overflow: 'hidden' },

  // Settings item
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    gap: Spacing.md,
  },
  settingsIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingsInfo: { flex: 1 },
  settingsLabel: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  settingsSub: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  settingsArrow: { fontSize: 20, color: Colors.border },

  // Divider
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.listItemPaddingH + 28 + Spacing.md },

  // Logout
  logoutItem: {
    paddingVertical: Spacing.listItemPaddingV,
    paddingHorizontal: Spacing.listItemPaddingH,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.errorText,
  },

  // Version
  version: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    marginVertical: Spacing.xl,
  },
});
