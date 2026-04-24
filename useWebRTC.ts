// ─── useWebRTC — señalización via HTTP polling ────────────────────────────────
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
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:80', username: 'e8dd65f0a7c3e0a7e8dd65f0', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443', username: 'e8dd65f0a7c3e0a7e8dd65f0', credential: 'openrelayproject' },
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
  const endedRef = useRef<boolean>(false);

  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  }, []);

  // Libera recursos sin tocar callState
  const cleanupResources = useCallback(() => {
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
  }, [stopPolling]);

  // Limpieza completa (al desmontar)
  const cleanup = useCallback(() => {
    cleanupResources();
    setCallState('idle');
  }, [cleanupResources]);

  const createPC = useCallback(() => {
    const p = new RTCPeerConnection({ iceServers: ICE_SERVERS, bundlePolicy: 'max-bundle', rtcpMuxPolicy: 'require' });

    p.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      setRemoteStream(stream);
      if (e.track.kind === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    p.onconnectionstatechange = () => {
      if (p.connectionState === 'connected') {
        setCallState('connected');
        p.getSenders().forEach(async sender => {
          if (!sender.track) return;
          const params = sender.getParameters();
          if (!params.encodings?.length) params.encodings = [{}];
          if (sender.track.kind === 'video') {
            params.encodings[0].maxBitrate = 2_500_000;
            params.encodings[0].maxFramerate = 30;
          } else {
            params.encodings[0].maxBitrate = 128_000;
          }
          try { await sender.setParameters(params); } catch {}
        });
      }
      // No llamar cleanup en failed/disconnected — puede ser transitorio
    };

    return p;
  }, []);

  const sendIceCandidate = useCallback(async (candidate: RTCIceCandidate, role: string) => {
    const key = candidate.candidate;
    if (!key || iceSentRef.current.has(key)) return;
    iceSentRef.current.add(key);
    try { await sigFetch('/call/ice', 'POST', { callId: callIdRef.current, candidate: candidate.toJSON(), role }); } catch {}
  }, []);

  const triggerEnded = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setCallState('ended');
    cleanupResources();
  }, [cleanupResources]);

  // ── CALLER ──────────────────────────────────────────────────────────────────
  const startCall = useCallback(async (type: 'audio' | 'video', targetUserId: string) => {
    endedRef.current = false;
    cleanup();
    setCallType(type);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        type === 'video'
          ? { audio: { echoCancellation: true, noiseSuppression: true }, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { audio: { echoCancellation: true, noiseSuppression: true }, video: false }
      );
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' ? { facingMode: 'user' } : false });
      } catch (err) {
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
    stream.getTracks().forEach(t => p.addTrack(t, stream));
    p.onicecandidate = (e) => { if (e.candidate) sendIceCandidate(e.candidate, 'caller'); };

    const offer = await p.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' });
    await p.setLocalDescription(offer);
    await new Promise(r => setTimeout(r, 500));
    await sigFetch('/call/offer', 'POST', { callId, offer: p.localDescription, targetUserId, type });

    setCallState('calling');

    let pollCount = 0;
    let answerSet = false;
    let calleeCandidatesApplied = 0;
    let consecutiveErrors = 0;

    pollingRef.current = setInterval(async () => {
      if (endedRef.current) return;
      try {
        pollCount++;
        const session = await sigFetch(`/call/${callId}`);
        consecutiveErrors = 0; // reset on success
        if (!session || session.ended) { triggerEnded(); return; }

        if (!answerSet && session.answer && p.signalingState === 'have-local-offer') {
          await p.setRemoteDescription(new RTCSessionDescription(session.answer));
          answerSet = true;
        }
        if (answerSet) {
          const cands = session.calleeCandidates || [];
          for (let i = calleeCandidatesApplied; i < cands.length; i++) {
            try { await p.addIceCandidate(new RTCIceCandidate(cands[i])); } catch {}
          }
          calleeCandidatesApplied = cands.length;
        }
        // Timeout 60s sin respuesta (aumentado de 45s)
        if (pollCount > 40 && !answerSet) triggerEnded();
      } catch (err: any) {
        consecutiveErrors++;
        // Solo cortar si hay 5+ errores consecutivos Y la conexión WebRTC está caída
        const rtcState = p.connectionState || p.iceConnectionState;
        const rtcFailed = rtcState === 'failed' || rtcState === 'disconnected' || rtcState === 'closed';
        if (consecutiveErrors >= 5 && rtcFailed) {
          triggerEnded();
        }
        // Si es 404 pero WebRTC sigue conectado, ignorar (servidor reiniciado)
      }
    }, 1500);
  }, [cleanup, createPC, sendIceCandidate, triggerEnded]);

  // ── CALLEE ──────────────────────────────────────────────────────────────────
  const answerCall = useCallback(async (callId: string, offer: RTCSessionDescriptionInit, type: 'audio' | 'video') => {
    endedRef.current = false;
    cleanup();
    setCallType(type);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(
        type === 'video'
          ? { audio: { echoCancellation: true, noiseSuppression: true }, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } }
          : { audio: { echoCancellation: true, noiseSuppression: true }, video: false }
      );
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' ? { facingMode: 'user' } : false });
      } catch {
        throw new Error('No se pudo acceder al micrófono/cámara');
      }
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    callIdRef.current = callId;
    roleRef.current = 'callee';

    const p = createPC();
    pc.current = p;
    stream.getTracks().forEach(t => p.addTrack(t, stream));
    p.onicecandidate = (e) => { if (e.candidate) sendIceCandidate(e.candidate, 'callee'); };

    await p.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await p.createAnswer();
    await p.setLocalDescription(answer);
    await new Promise(r => setTimeout(r, 500));
    await sigFetch('/call/answer', 'POST', { callId, answer: p.localDescription });

    const session = await sigFetch(`/call/${callId}`);
    let callerCandidatesApplied = 0;
    for (const c of (session.callerCandidates || [])) {
      try { await p.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      callerCandidatesApplied++;
    }

    setCallState('connected');

    let calleeConsecutiveErrors = 0;
    pollingRef.current = setInterval(async () => {
      if (endedRef.current) return;
      try {
        const s = await sigFetch(`/call/${callId}`);
        calleeConsecutiveErrors = 0;
        if (!s || s.ended) { triggerEnded(); return; }
        const cands = s.callerCandidates || [];
        for (let i = callerCandidatesApplied; i < cands.length; i++) {
          try { await p.addIceCandidate(new RTCIceCandidate(cands[i])); } catch {}
        }
        callerCandidatesApplied = cands.length;
      } catch (err: any) {
        calleeConsecutiveErrors++;
        // Solo cortar si hay 5+ errores Y WebRTC está caído
        const rtcState = p.connectionState || p.iceConnectionState;
        const rtcFailed = rtcState === 'failed' || rtcState === 'disconnected' || rtcState === 'closed';
        if (calleeConsecutiveErrors >= 5 && rtcFailed) triggerEnded();
      }
    }, 1500);
  }, [cleanup, createPC, sendIceCandidate, triggerEnded]);

  const endCall = useCallback(async () => {
    endedRef.current = true;
    if (callIdRef.current) {
      try { await sigFetch(`/call/${callIdRef.current}`, 'DELETE'); } catch {}
    }
    cleanupResources();
    setCallState('idle');
  }, [cleanupResources]);

  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  // Polling llamadas entrantes
  const pollIncoming = useCallback((myUserId: string, onIncoming: (call: any) => void, onCancelled?: () => void) => {
    if (!myUserId) return () => {};
    let lastCallId: string | null = null;
    const check = async () => {
      try {
        const calls = await sigFetch(`/call/incoming/${myUserId}`);
        if (Array.isArray(calls) && calls.length > 0) {
          const call = calls[0];
          if (call.callId !== lastCallId) { lastCallId = call.callId; onIncoming(call); }
        } else {
          // Si había una llamada activa y ya no aparece → el caller canceló
          if (lastCallId !== null) {
            lastCallId = null;
            onCancelled?.();
          }
        }
      } catch {}
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { return () => { cleanup(); }; }, [cleanup]);

  const getRemoteAudioRef = useCallback(() => {
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
      (remoteAudioRef.current as any).playsInline = true;
    }
    return remoteAudioRef.current;
  }, []);

  const setRemoteAudioElement = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioRef.current = el;
    if (el && remoteStream) { el.srcObject = remoteStream; el.play().catch(() => {}); }
  }, [remoteStream]);

  return {
    callState, callType, isMuted, isCamOff,
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
    getRemoteAudioRef, setRemoteAudioElement,
  };
}
