// ══════════════════════════════════════════════════════════════════
// useWebRTC — Stub para Expo Go
// react-native-webrtc requiere build nativo (EAS Build)
// Esta versión permite que la app cargue sin errores en Expo Go
// ══════════════════════════════════════════════════════════════════
import { useRef, useState, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { getToken } from '../api';

// RTCView stub — se reemplaza por el real en build nativo
export const RTCView = View;

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com').replace(/\/$/, '');

async function sigFetch(path: string, method = 'GET', body?: object) {
  const token = await getToken();
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`sigFetch ${path} → ${res.status}`);
  return res.json();
}

export function useWebRTC() {
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callIdRef = useRef<string>('');
  const endedRef = useRef<boolean>(false);

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  const cleanup = useCallback(() => {
    stopPolling();
    endedRef.current = false;
    setCallState('idle');
  }, [stopPolling]);

  const endCall = useCallback(async () => {
    endedRef.current = true;
    if (callIdRef.current) {
      try { await sigFetch(`/call/${callIdRef.current}`, 'DELETE'); } catch {}
    }
    cleanup();
  }, [cleanup]);

  const startCall = useCallback(async (type: 'audio' | 'video', _targetUserId: string) => {
    setCallType(type);
    setCallState('calling');
    // WebRTC real requiere EAS Build con react-native-webrtc
    console.warn('WebRTC no disponible en Expo Go. Usa EAS Build para llamadas reales.');
  }, []);

  const answerCall = useCallback(async (_callId: string, _offer: any, type: 'audio' | 'video') => {
    setCallType(type);
    setCallState('ringing');
    console.warn('WebRTC no disponible en Expo Go. Usa EAS Build para llamadas reales.');
  }, []);

  const toggleMute = useCallback(() => setIsMuted(p => !p), []);
  const toggleCamera = useCallback(() => setIsCamOff(p => !p), []);

  const pollIncoming = useCallback((
    myUserId: string,
    onIncoming: (call: any) => void,
    onCancelled?: () => void,
  ) => {
    if (!myUserId) return () => {};
    let lastCallId: string | null = null;
    const check = async () => {
      try {
        const calls = await sigFetch(`/call/incoming/${myUserId}`);
        if (Array.isArray(calls) && calls.length > 0) {
          const call = calls[0];
          if (call.callId !== lastCallId) { lastCallId = call.callId; onIncoming(call); }
        } else {
          if (lastCallId !== null) { lastCallId = null; onCancelled?.(); }
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { return () => { cleanup(); }; }, [cleanup]);

  return {
    callState, callType, isMuted, isCamOff,
    localStream: null, remoteStream: null,
    startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
  };
}
