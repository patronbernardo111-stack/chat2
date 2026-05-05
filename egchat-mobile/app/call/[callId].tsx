// ══════════════════════════════════════════════════════════════════
// Pantalla de llamada — WebRTC real con react-native-webrtc
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { EGAvatar } from '../../src/components/ui';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';
import { useWebRTC, RTCView } from '../../src/hooks/useWebRTC';

export default function CallScreen() {
  const {
    callId, targetName, targetAvatar, callType, role,
    targetUserId, offer: offerParam,
  } = useLocalSearchParams<{
    callId: string;
    targetName: string;
    targetAvatar: string;
    callType: 'audio' | 'video';
    role: 'caller' | 'callee';
    targetUserId?: string;
    offer?: string;           // JSON string del offer (solo callee)
  }>();

  const {
    callState, isMuted, isCamOff,
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera,
  } = useWebRTC();

  const [duration, setDuration] = useState(0);
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initiated = useRef(false);

  // Iniciar o responder llamada al montar
  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    if (role === 'caller' && targetUserId) {
      startCall(callType as 'audio' | 'video', targetUserId).catch(err => {
        Alert.alert('Error', err.message || 'No se pudo iniciar la llamada');
        router.back();
      });
    } else if (role === 'callee' && offerParam) {
      try {
        const offer = JSON.parse(offerParam);
        answerCall(callId, offer, callType as 'audio' | 'video').catch(err => {
          Alert.alert('Error', err.message || 'No se pudo responder la llamada');
          router.back();
        });
      } catch {
        Alert.alert('Error', 'Datos de llamada inválidos');
        router.back();
      }
    }
  }, []);

  // Pulso animado mientras suena
  useEffect(() => {
    if (callState === 'calling' || callState === 'ringing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [callState]);

  // Contador de duración
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Cuando termina la llamada, volver atrás
  useEffect(() => {
    if (callState === 'ended') {
      setTimeout(() => router.back(), 800);
    }
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const hangUp = useCallback(async () => {
    await endCall();
    router.back();
  }, [endCall]);

  const accept = useCallback(() => {
    // El callee ya inició answerCall en el useEffect, solo cambia UI
    // La conexión WebRTC se establece sola
  }, []);

  const statusLabel = () => {
    if (callState === 'calling') return 'Llamando...';
    if (callState === 'ringing') {
      return role === 'callee'
        ? `Llamada entrante (${callType === 'video' ? '📹 Video' : '📞 Audio'})`
        : 'Conectando...';
    }
    if (callState === 'connected') return formatDuration(duration);
    if (callState === 'ended') return 'Llamada finalizada';
    return '...';
  };

  const isRinging = callState === 'calling' || callState === 'ringing';
  const isConnected = callState === 'connected';

  return (
    <SafeAreaView style={styles.container}>
      {/* Video remoto (fondo completo) */}
      {callType === 'video' && remoteStream && (
        <RTCView
          streamURL={(remoteStream as any).toURL?.() || ''}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror={false}
        />
      )}

      {/* Video local (esquina) */}
      {callType === 'video' && localStream && isConnected && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={(localStream as any).toURL?.() || ''}
            style={styles.localVideo}
            objectFit="cover"
            mirror
          />
        </View>
      )}

      {/* Overlay oscuro para llamadas de audio o cuando no hay video remoto */}
      {(callType === 'audio' || !remoteStream) && (
        <View style={styles.audioOverlay} />
      )}

      {/* Avatar y nombre */}
      <View style={styles.top}>
        <Animated.View style={{ transform: [{ scale: isRinging ? pulseAnim : 1 }] }}>
          <EGAvatar src={targetAvatar} name={targetName || 'Usuario'} size={100} />
        </Animated.View>
        <Text style={styles.name}>{targetName || 'Usuario'}</Text>
        <Text style={styles.status}>{statusLabel()}</Text>

        {callType === 'video' && !remoteStream && isConnected && (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>📹 Esperando video...</Text>
          </View>
        )}
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        {isConnected && (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
              onPress={toggleMute}
            >
              <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
              <Text style={styles.controlLabel}>{isMuted ? 'Activar' : 'Silenciar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, isCamOff && styles.controlBtnActive]}
              onPress={callType === 'video' ? toggleCamera : undefined}
              disabled={callType === 'audio'}
            >
              <Text style={styles.controlIcon}>{callType === 'video' ? (isCamOff ? '📷' : '📹') : '🔊'}</Text>
              <Text style={styles.controlLabel}>{callType === 'video' ? (isCamOff ? 'Cámara' : 'Apagar') : 'Altavoz'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Callee: aceptar / rechazar */}
        {callState === 'ringing' && role === 'callee' && (
          <View style={styles.incomingRow}>
            <View style={styles.incomingBtnWrap}>
              <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={accept}>
                <Text style={styles.callBtnIcon}>📞</Text>
              </TouchableOpacity>
              <Text style={styles.incomingLabel}>Aceptar</Text>
            </View>
            <View style={styles.incomingBtnWrap}>
              <TouchableOpacity style={[styles.callBtn, styles.hangBtn]} onPress={hangUp}>
                <Text style={styles.callBtnIcon}>📵</Text>
              </TouchableOpacity>
              <Text style={styles.incomingLabel}>Rechazar</Text>
            </View>
          </View>
        )}

        {/* Colgar */}
        {(isConnected || (isRinging && role === 'caller')) && (
          <TouchableOpacity
            style={[styles.callBtn, styles.hangBtn, { alignSelf: 'center' }]}
            onPress={hangUp}
          >
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
  audioOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f1923',
  },
  top: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing['3xl'],
    zIndex: 1,
  },
  name: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginTop: Spacing.md,
  },
  status: {
    fontSize: FontSize.base,
    color: 'rgba(255,255,255,0.6)',
  },
  videoPlaceholder: {
    marginTop: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  videoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    zIndex: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: { flex: 1 },
  controls: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xl,
    zIndex: 1,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  controlBtn: {
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    width: 72,
    height: 72,
    justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: Colors.accent },
  controlIcon: { fontSize: 26 },
  controlLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  incomingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['3xl'],
  },
  incomingBtnWrap: { alignItems: 'center', gap: Spacing.xs },
  incomingLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm },
  callBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtn: { backgroundColor: '#22c55e' },
  hangBtn: { backgroundColor: '#ef4444' },
  callBtnIcon: { fontSize: 28 },
});
