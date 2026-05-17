import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/theme';

const KEY = 'egchat_privacy_settings';
const DEFAULT = {
  ultimaConexion: true,
  fotoPerfil: true,
  estadoEnLinea: true,
  confirmacionLectura: true,
  biometria: false,
};

export default function PrivacidadScreen() {
  const [settings, setSettings] = useState(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(v => {
      if (v) setSettings({ ...DEFAULT, ...JSON.parse(v) });
    });
  }, []);

  const toggle = async (key: keyof typeof DEFAULT) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  const Row = ({ label, sub, k }: { label: string; sub?: string; k: keyof typeof DEFAULT }) => (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      <Switch
        value={settings[k]}
        onValueChange={() => toggle(k)}
        trackColor={{ false: Colors.border, true: Colors.accent }}
        thumbColor={Colors.white}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacidad y Seguridad</Text>
      </View>
      <ScrollView>
        <Text style={styles.section}>VISIBILIDAD</Text>
        <View style={styles.card}>
          <Row label="Última conexión" sub="Mostrar cuándo estuviste activo" k="ultimaConexion" />
          <View style={styles.divider} />
          <Row label="Foto de perfil" sub="Visible para todos los contactos" k="fotoPerfil" />
          <View style={styles.divider} />
          <Row label="Estado en línea" sub="Mostrar cuando estás conectado" k="estadoEnLinea" />
        </View>

        <Text style={styles.section}>MENSAJES</Text>
        <View style={styles.card}>
          <Row label="Confirmación de lectura" sub="Mostrar doble check azul" k="confirmacionLectura" />
        </View>

        <Text style={styles.section}>SEGURIDAD</Text>
        <View style={styles.card}>
          <Row label="Bloqueo biométrico" sub="Usar huella o Face ID para abrir la app" k="biometria" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.sm },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  section: {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
    color: Colors.textTertiary, marginTop: Spacing.lg,
    marginBottom: Spacing.sm, marginHorizontal: Spacing.screenPadding,
  },
  card: {
    backgroundColor: Colors.bgSecondary, borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.screenPadding, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rowSub: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.md },
});
