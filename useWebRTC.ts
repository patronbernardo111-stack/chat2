// ─── useWebRTC — señalización via HTTP polling (v2 - robusto) ────────────────
import { useRef, useState, useCallback, useEffect } from 'react';
import { authAPI } from './api';

const BASE = (() => {
  const url = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (!url || url.startsWith('/')) return 'https://egchat-api.onrender.com/api';
  return url.endsWith('/api') ? url : url.replace(/\/$/, '') + '/api';
})();

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  // TURN servers - múltiples para mayor fiabilidad
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // TURN adicional de Metered
  {
    urls: 'turn:a.relay.metered.ca:80',
    username: 'e8dd65f0a7c3e0a7e8dd65f0',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:a.relay.metered.ca:443',
    username: 'e8dd65f0a7c3e0a7e8dd65f0',
    credential: 'openrelayproject',
  },
];

async function sigFetch(path: string, method = 'GET', body?: object) {
  const token = authAPI.getToken();
  const url = `${BASE}${path}${token ? (path.includes('?') ? '&' : '?') + '_t=' + encodeURIComponent(token) : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Signal error ${res.status}`);
  return res.json();
}

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export function useWebRTC() {
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callIdRef = useRef<string>('');
  const roleRef = useRef<'caller' | 'callee'>('caller');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iceSentRef = useRef<Set<string>>(new Set());

  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    stopPolling();
    if (pc.current) {
      pc.current.ontrack = null;
      pc.current.onicecandidate = null;
      pc.current.onconnectionstatechange = null;
      pc.current.close();
      pc.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    iceSentRef.current.clear();
    setRemoteStream(null);
    setLocalStream(null);
    setCallState('idle');
  }, [stopPolling]);

  // Crear PeerConnection con handlers correctos
  const createPC = useCallback(() => {
    const p = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      // Ancho de banda adaptable — el navegador ajusta según la red
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

  // Recibir stream remoto
    p.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      setRemoteStream(stream);
      // Reproducir audio remoto automáticamente
      if (e.track.kind === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(err => console.warn('Audio playback failed:', err));
      }
    };

    // Monitorear estado de conexión
    p.onconnectionstatechange = () => {
      if (p.connectionState === 'connected') {
        setCallState('connected');
        stopPolling();
        // Ajustar bitrate máximo tras conectar (ancho de banda adaptable)
        p.getSenders().forEach(async sender => {
          if (!sender.track) return;
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          if (sender.track.kind === 'video') {
            // Video: máx 2.5 Mbps, mín 200 kbps
            params.encodings[0].maxBitrate = 2_500_000;
            params.encodings[0].minBitrate = 200_000;
            params.encodings[0].maxFramerate = 30;
          } else if (sender.track.kind === 'audio') {
            // Audio: máx 128 kbps
            params.encodings[0].maxBitrate = 128_000;
          }
          try { await sender.setParameters(params); } catch {}
        });
      } else if (p.connectionState === 'failed' || p.connectionState === 'disconnected') {
        cleanup();
      }
    };

    return p;
  }, [cleanup, stopPolling]);

  // Enviar ICE candidate al servidor (evitar duplicados)
  const sendIceCandidate = useCallback(async (candidate: RTCIceCandidate, role: string) => {
    const key = candidate.candidate;
    if (!key || iceSentRef.current.has(key)) return;
    iceSentRef.current.add(key);
    try {
      await sigFetch('/call/ice', 'POST', {
        callId: callIdRef.current,
        candidate: candidate.toJSON(),
        role,
      });
    } catch {}
  }, []);

  // ── CALLER: iniciar llamada ──────────────────────────────────────────────────
  const startCall = useCallback(async (type: 'audio' | 'video', targetUserId: string) => {
    cleanup();
    setCallType(type);

    // Restricciones de video adaptables — intenta 720p, acepta menos si no hay ancho de banda
    const videoConstraints: MediaTrackConstraints = {
      facingMode: 'user',
      width:  { ideal: 1280, min: 320, max: 1920 },
      height: { ideal: 720,  min: 240, max: 1080 },
      frameRate: { ideal: 30, min: 15, max: 60 },
    };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        type === 'video'
          ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: videoConstraints }
          : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }
      );
    } catch (err) {
      // Fallback a resolución más baja si falla
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          type === 'video'
            ? { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }
            : { audio: true, video: false }
        );
      } catch (err2) {
        console.error('getUserMedia error:', err2);
        throw new Error('No se pudo acceder al micrófono/cámara');
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    callIdRef.current = callId;
    roleRef.current = 'caller';

    const p = createPC();
    pc.current = p;

    // Añadir tracks ANTES de crear offer
    stream.getTracks().forEach(t => p.addTrack(t, stream));

    // Configurar ICE candidate handler ANTES de createOffer
    p.onicecandidate = (e) => {
      if (e.candidate) sendIceCandidate(e.candidate, 'caller');
    };

    // Crear y enviar offer
    const offer = await p.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: type === 'video',
    });
    await p.setLocalDescription(offer);

    // Esperar trickle ICE (500ms es suficiente con TURN)
    await new Promise(r => setTimeout(r, 500));

    await sigFetch('/call/offer', 'POST', {
      callId,
      offer: p.localDescription,
      targetUserId,
      type,
    });

    setCallState('calling');

    // Polling para recibir answer + ICE candidates del callee
    let pollCount = 0;
    let answerSet = false;
    let calleeCandidatesApplied = 0;

    pollingRef.current = setInterval(async () => {
      try {
        pollCount++;
        const session = await sigFetch(`/call/${callId}`);

        // Aplicar answer si aún no se ha hecho
        if (!answerSet && session.answer && p.signalingState === 'have-local-offer') {
          await p.setRemoteDescription(new RTCSessionDescription(session.answer));
          answerSet = true;
        }

        // Aplicar ICE candidates del callee
        if (answerSet) {
          const calleeCandidates = session.calleeCandidates || [];
          for (let i = calleeCandidatesApplied; i < calleeCandidates.length; i++) {
            try { await p.addIceCandidate(new RTCIceCandidate(calleeCandidates[i])); } catch {}
          }
          calleeCandidatesApplied = calleeCandidates.length;
        }

        // Timeout: 45 segundos sin respuesta
        if (pollCount > 30 && !answerSet) {
          cleanup();
        }
      } catch {
        // No limpiar en errores de red transitorios
      }
    }, 1500);

  }, [cleanup, createPC, sendIceCandidate]);

  // ── CALLEE: responder llamada ────────────────────────────────────────────────
  const answerCall = useCallback(async (callId: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') => {
    cleanup();
    setCallType(type);

    const videoConstraints: MediaTrackConstraints = {
      facingMode: 'user',
      width:  { ideal: 1280, min: 320, max: 1920 },
      height: { ideal: 720,  min: 240, max: 1080 },
      frameRate: { ideal: 30, min: 15, max: 60 },
    };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        type === 'video'
          ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: videoConstraints }
          : { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }
      );
    } catch (err) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          type === 'video'
            ? { audio: true, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }
            : { audio: true, video: false }
        );
      } catch (err2) {
        console.error('getUserMedia error (callee):', err2);
        throw new Error('No se pudo acceder al micrófono/cámara');
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    callIdRef.current = callId;
    roleRef.current = 'callee';

    const p = createPC();
    pc.current = p;

    // Añadir tracks ANTES de crear answer
    stream.getTracks().forEach(t => p.addTrack(t, stream));

    // Configurar ICE candidate handler ANTES de setRemoteDescription
    p.onicecandidate = (e) => {
      if (e.candidate) sendIceCandidate(e.candidate, 'callee');
    };

    // Aplicar offer del caller
    await p.setRemoteDescription(new RTCSessionDescription(offer));

    // Crear answer
    const answer = await p.createAnswer();
    await p.setLocalDescription(answer);

    // Esperar trickle ICE
    await new Promise(r => setTimeout(r, 500));

    // Enviar answer
    await sigFetch('/call/answer', 'POST', { callId, answer: p.localDescription });

    // Aplicar ICE candidates del caller que ya llegaron
    const session = await sigFetch(`/call/${callId}`);
    let callerCandidatesApplied = 0;
    for (const c of (session.callerCandidates || [])) {
      try { await p.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      callerCandidatesApplied++;
    }

    setCallState('connected');

    // Seguir aplicando ICE candidates del caller que lleguen tarde
    pollingRef.current = setInterval(async () => {
      try {
        const s = await sigFetch(`/call/${callId}`);
        const callerCandidates = s.callerCandidates || [];
        for (let i = callerCandidatesApplied; i < callerCandidates.length; i++) {
          try { await p.addIceCandidate(new RTCIceCandidate(callerCandidates[i])); } catch {}
        }
        callerCandidatesApplied = callerCandidates.length;
      } catch { stopPolling(); }
    }, 2000);

  }, [cleanup, createPC, sendIceCandidate, stopPolling]);

  const endCall = useCallback(async () => {
    if (callIdRef.current) {
      try { await sigFetch(`/call/${callIdRef.current}`, 'DELETE'); } catch {}
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  // Polling para llamadas entrantes
  const pollIncoming = useCallback((myUserId: string, onIncoming: (call: any) => void) => {
    if (!myUserId) return () => {};
    const check = async () => {
      try {
        const calls = await sigFetch(`/call/incoming/${myUserId}`);
        if (Array.isArray(calls) && calls.length > 0) onIncoming(calls[0]);
      } catch {}
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  // Exponer referencia de audio remoto
  const getRemoteAudioRef = useCallback(() => {
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
      remoteAudioRef.current.playsInline = true;
    }
    return remoteAudioRef.current;
  }, []);

  return {
    callState, callType, isMuted, isCamOff,
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
    getRemoteAudioRef,
  };
}
