import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { EGAvatar } from '../../src/components/ui';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

export default function CallScreen() {
  const { callId, targetName, targetAvatar, callType, role } = useLocalSearchParams<{
    callId: string; targetName: string; targetAvatar: string;
    callType: 'audio' | 'video'; role: 'caller' | 'callee';
  }>();

  const [status, setStatus] = useState<'ringing' | 'connected' | 'ended'>(
    role === 'caller' ? 'ringing' : 'ringing'
  );
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulso animado mientras suena
  useEffect(() => {
    if (status === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      // Simular conexión a los 3s si es caller
      if (role === 'caller') {
        const t = setTimeout(() => setStatus('connected'), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [status]);

  // Contador de duración
  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const hangUp = () => {
    setStatus('ended');
    setTimeout(() => router.back(), 800);
  };

  const accept = () => setStatus('connected');

  return (
    <SafeAreaView style={styles.container}>
      {/* Avatar y nombre */}
      <View style={styles.top}>
        <Animated.View style={{ transform: [{ scale: status === 'ringing' ? pulseAnim : 1 }] }}>
          <EGAvatar src={targetAvatar} name={targetName || 'Usuario'} size={100} />
        </Animated.View>
        <Text style={styles.name}>{targetName || 'Usuario'}</Text>
        <Text style={styles.status}>
          {status === 'ringing'
            ? role === 'caller' ? 'Llamando...' : `Llamada entrante (${callType === 'video' ? '📹 Video' : '📞 Audio'})`
            : status === 'connected' ? formatDuration(duration)
            : 'Llamada finalizada'}
        </Text>
        {callType === 'video' && status === 'connected' && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>📹 Vídeo no disponible en esta versión</Text>
          </View>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {status === 'connected' && (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.controlBtn, muted && styles.controlBtnActive]}
              onPress={() => setMuted(m => !m)}
            >
              <Text style={styles.controlIcon}>{muted ? '🔇' : '🎤'}</Text>
              <Text style={styles.controlLabel}>{muted ? 'Activar' : 'Silenciar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlBtn, speaker && styles.controlBtnActive]}
              onPress={() => setSpeaker(s => !s)}
            >
              <Text style={styles.controlIcon}>🔊</Text>
              <Text style={styles.controlLabel}>{speaker ? 'Auricular' : 'Altavoz'}</Text>
            </TouchableOpacity>
            {callType === 'audio' && (
              <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Teclado', 'Marcación DTMF')}>
                <Text style={styles.controlIcon}>⌨️</Text>
                <Text style={styles.controlLabel}>Teclado</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Callee: aceptar / rechazar */}
        {status === 'ringing' && role === 'callee' && (
          <View style={styles.incomingRow}>
            <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={accept}>
              <Text style={styles.callBtnIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.callBtn, styles.hangBtn]} onPress={hangUp}>
              <Text style={styles.callBtnIcon}>📵</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Colgar */}
        {(status === 'connected' || (status === 'ringing' && role === 'caller')) && (
          <TouchableOpacity style={[styles.callBtn, styles.hangBtn, { alignSelf: 'center' }]} onPress={hangUp}>
            <Text style={styles.callBtnIcon}>📵</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1923',
    justifyContent: 'space-between',
    paddingVertical: Spacing['3xl'],
  },
  top: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['3xl'] },
  name: { fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white, marginTop: Spacing.md },
  status: { fontSize: FontSize.base, color: 'rgba(255,255,255,0.6)' },
  videoPlaceholder: {
    marginTop: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  videoText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.sm, textAlign: 'center' },
  controls: { paddingHorizontal: Spacing.xl, gap: Spacing.xl },
  controlRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl },
  controlBtn: {
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    width: 72, height: 72,
    justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: Colors.accent },
  controlIcon: { fontSize: 26 },
  controlLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  incomingRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing['3xl'] },
  callBtn: {
    width: 72, height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  hangBtn: { backgroundColor: '#ef4444' },
  callBtnIcon: { fontSize: 28 },
});
