import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Vibration, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { getToken } from '../../src/api';
import { EGAvatar } from '../../src/components/ui';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../src/theme';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com';

type CallState = 'calling' | 'ringing' | 'connected' | 'ended';

// ── Botón de acción de llamada ────────────────────────────────────
const CallBtn = ({
  icon, label, color = Colors.bgTertiary, onPress, size = 64,
}: {
  icon: string; label: string; color?: string; onPress: () => void; size?: number;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.callBtnWrapper} activeOpacity={0.8}>
    <View style={[styles.callBtn, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ fontSize: size * 0.38 }}>{icon}</Text>
    </View>
    <Text style={styles.callBtnLabel}>{label}</Text>
  </TouchableOpacity>
);

// ── Pantalla de llamada ───────────────────────────────────────────
export default function CallScreen() {
  const { callId, targetName, targetAvatar, callType = 'audio', role = 'caller' } =
    useLocalSearchParams<{
      callId: string;
      targetName: string;
      targetAvatar?: string;
      callType?: string;
      role?: string;
    }>();

  const [state, setState] = useState<CallState>(role === 'caller' ? 'calling' : 'ringing');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animación de pulso para "llamando"
  useEffect(() => {
    if (state === 'calling' || state === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      // Vibrar si es llamada entrante
      if (state === 'ringing') {
        Vibration.vibrate([500, 1000, 500, 1000], true);
      }
    } else {
      pulseAnim.setValue(1);
      Vibration.cancel();
    }
    return () => Vibration.cancel();
  }, [state]);

  // Timer de duración
  useEffect(() => {
    if (state === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  // Polling para detectar respuesta / colgado
  useEffect(() => {
    if (!callId || state === 'ended') return;

    const poll = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BASE}/api/call/${callId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { endCall(); return; }
        const data = await res.json();

        if (data.ended) { endCall(); return; }
        if (data.answer && state === 'calling') setState('connected');
        if (data.offer && state === 'ringing') {
          // Hay oferta — mostrar como conectando
        }
      } catch { }
    };

    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [callId, state]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const endCall = useCallback(async () => {
    setState('ended');
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    Vibration.cancel();

    try {
      const token = await getToken();
      await fetch(`${BASE}/api/call/${callId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch { }

    setTimeout(() => router.back(), 500);
  }, [callId]);

  const acceptCall = useCallback(async () => {
    setState('connected');
    Vibration.cancel();
  }, []);

  const stateLabel = {
    calling: 'Llamando...',
    ringing: `Llamada ${callType === 'video' ? 'de video' : 'de voz'} entrante`,
    connected: formatDuration(duration),
    ended: 'Llamada finalizada',
  }[state];

  return (
    <SafeAreaView style={styles.container}>
      {/* Fondo con gradiente simulado */}
      <View style={styles.bg} />

      {/* Avatar con pulso */}
      <View style={styles.avatarSection}>
        <Animated.View style={[styles.avatarPulse, { transform: [{ scale: pulseAnim }] }]}>
          <EGAvatar
            src={targetAvatar}
            name={targetName || 'Usuario'}
            size={120}
          />
        </Animated.View>
        <Text style={styles.callerName}>{targetName || 'Usuario'}</Text>
        <Text style={styles.callState}>{stateLabel}</Text>
        {state === 'connected' && (
          <Text style={styles.callType}>
            {callType === 'video' ? '📹 Videollamada' : '📞 Llamada de voz'}
          </Text>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {state === 'ringing' ? (
          /* Llamada entrante — aceptar / rechazar */
          <View style={styles.incomingBtns}>
            <CallBtn
              icon="📵"
              label="Rechazar"
              color="#EF4444"
              onPress={endCall}
              size={72}
            />
            <CallBtn
              icon="📞"
              label="Aceptar"
              color={Colors.accent}
              onPress={acceptCall}
              size={72}
            />
          </View>
        ) : state === 'connected' ? (
          /* Llamada activa */
          <>
            <View style={styles.activeControls}>
              <CallBtn icon={muted ? '🔇' : '🎤'} label={muted ? 'Activar' : 'Silenciar'} onPress={() => setMuted(m => !m)} />
              <CallBtn icon={speakerOn ? '🔊' : '🔈'} label={speakerOn ? 'Auricular' : 'Altavoz'} onPress={() => setSpeakerOn(s => !s)} />
              {callType === 'video' && (
                <CallBtn icon={videoOff ? '📷' : '📹'} label={videoOff ? 'Activar' : 'Cámara'} onPress={() => setVideoOff(v => !v)} />
              )}
            </View>
            <CallBtn icon="📵" label="Colgar" color="#EF4444" onPress={endCall} size={72} />
          </>
        ) : (
          /* Llamando — solo colgar */
          <CallBtn icon="📵" label="Cancelar" color="#EF4444" onPress={endCall} size={72} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a2e',
  },

  // Avatar
  avatarSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  avatarPulse: {
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.accent,
    padding: 4,
    ...Shadow.lg,
  },
  callerName: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: '#fff',
    marginTop: Spacing.md,
  },
  callState: {
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.7)',
  },
  callType: {
    fontSize: FontSize.base,
    color: Colors.accent,
    fontWeight: FontWeight.semibold,
  },

  // Controls
  controls: {
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xl,
  },
  incomingBtns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: Spacing.xl,
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },

  // Call button
  callBtnWrapper: { alignItems: 'center', gap: Spacing.sm },
  callBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  callBtnLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.medium,
  },
});
