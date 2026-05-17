import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/theme';

const KEY = 'egchat_notif_settings';

const DEFAULT = {
  mensajes: true,
  llamadas: true,
  grupos: true,
  sonido: true,
  vibracion: true,
  preview: true,
};

export default function NotificacionesScreen() {
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
        <Text style={styles.title}>Notificaciones</Text>
      </View>
      <ScrollView>
        <Text style={styles.section}>ALERTAS</Text>
        <View style={styles.card}>
          <Row label="Mensajes" sub="Nuevos mensajes recibidos" k="mensajes" />
          <View style={styles.divider} />
          <Row label="Llamadas" sub="Llamadas entrantes" k="llamadas" />
          <View style={styles.divider} />
          <Row label="Grupos" sub="Actividad en grupos" k="grupos" />
        </View>

        <Text style={styles.section}>SONIDO Y VIBRACIÓN</Text>
        <View style={styles.card}>
          <Row label="Sonido" sub="Reproducir tono al recibir" k="sonido" />
          <View style={styles.divider} />
          <Row label="Vibración" sub="Vibrar al recibir notificación" k="vibracion" />
        </View>

        <Text style={styles.section}>PRIVACIDAD</Text>
        <View style={styles.card}>
          <Row label="Vista previa" sub="Mostrar texto en la notificación" k="preview" />
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
