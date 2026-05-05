// ══════════════════════════════════════════════════════════════════
// useWebRTC — React Native (react-native-webrtc)
// Migrado desde useWebRTC.ts web, adaptado para RN
// ══════════════════════════════════════════════════════════════════
import { useRef, useState, useCallback, useEffect } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
  RTCView,
} from 'react-native-webrtc';
import { getToken } from '../api';

export { RTCView };

// ── Configuración STUN pública ────────────────────────────────────
const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const BASE = (process.env.EXPO_PUBLIC_API_URL || 'https://chat2-0x2c.onrender.com').replace(/\/$/, '');

// ── Señalización HTTP (igual que la web) ──────────────────────────
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

// ── Obtener TURN servers dinámicos ────────────────────────────────
async function getIceServers(): Promise<RTCIceServer[]> {
  try {
    const data = await sigFetch('/call/turn-credentials');
    if (data?.iceServers?.length) return data.iceServers;
  } catch {}
  return STUN_SERVERS;
}

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export function useWebRTC() {
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
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

  const cleanupResources = useCallback(() => {
    stopPolling();
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t: any) => t.stop());
      localStreamRef.current = null;
    }
    iceSentRef.current.clear();
    setRemoteStream(null);
    setLocalStream(null);
  }, [stopPolling]);

  const cleanup = useCallback(() => {
    cleanupResources();
    setCallState('idle');
  }, [cleanupResources]);

  const triggerEnded = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    setCallState('ended');
    cleanupResources();
  }, [cleanupResources]);

  const sendIceCandidate = useCallback(async (candidate: any, role: string) => {
    const key = candidate.candidate;
    if (!key || iceSentRef.current.has(key)) return;
    iceSentRef.current.add(key);
    try {
      await sigFetch('/call/ice', 'POST', {
        callId: callIdRef.current,
        candidate: candidate.toJSON ? candidate.toJSON() : candidate,
        role,
      });
    } catch {}
  }, []);

  const createPC = useCallback(async () => {
    const iceServers = await getIceServers();
    const p = new RTCPeerConnection({
      iceServers: iceServers.length > 0 ? iceServers : STUN_SERVERS,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    } as any);

    p.ontrack = (e: any) => {
      const stream = e.streams?.[0] || new MediaStream([e.track]);
      setRemoteStream(stream);
    };

    p.onconnectionstatechange = () => {
      const state = (p as any).connectionState;
      if (state === 'connected') {
        setCallState('connected');
      } else if (state === 'failed') {
        if (!endedRef.current) {
          try { (p as any).restartIce?.(); } catch { triggerEnded(); }
        }
      } else if (state === 'closed') {
        triggerEnded();
      }
    };

    p.oniceconnectionstatechange = () => {
      const iceState = (p as any).iceConnectionState;
      if (iceState === 'failed') {
        try { (p as any).restartIce?.(); } catch {}
      }
    };

    return p;
  }, [triggerEnded]);

  // ── CALLER ────────────────────────────────────────────────────────
  const startCall = useCallback(async (type: 'audio' | 'video', targetUserId: string) => {
    endedRef.current = false;
    cleanup();
    setCallType(type);

    // Obtener stream local
    const constraints: any = type === 'video'
      ? { audio: true, video: { facingMode: 'user', width: 1280, height: 720 } }
      : { audio: true, video: false };

    let stream: MediaStream;
    try {
      stream = await mediaDevices.getUserMedia(constraints) as MediaStream;
    } catch (err: any) {
      // Fallback sin constraints específicos
      stream = await mediaDevices.getUserMedia({ audio: true, video: type === 'video' }) as MediaStream;
    }

    localStreamRef.current = stream;
    setLocalStream(stream);

    const callId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    callIdRef.current = callId;
    roleRef.current = 'caller';

    const p = await createPC();
    pc.current = p;
    stream.getTracks().forEach((t: any) => p.addTrack(t, stream));
    p.onicecandidate = (e: any) => { if (e.candidate) sendIceCandidate(e.candidate, 'caller'); };

    const offer = await p.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: type === 'video' } as any);
    await p.setLocalDescription(offer as any);
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
        consecutiveErrors = 0;
        if (!session || session.ended) { triggerEnded(); return; }

        if (!answerSet && session.answer && (p as any).signalingState === 'have-local-offer') {
          await p.setRemoteDescription(new RTCSessionDescription(session.answer) as any);
          answerSet = true;
        }
        if (answerSet) {
          const cands = session.calleeCandidates || [];
          for (let i = calleeCandidatesApplied; i < cands.length; i++) {
            try { await p.addIceCandidate(new RTCIceCandidate(cands[i]) as any); } catch {}
          }
          calleeCandidatesApplied = cands.length;
        }
        if (pollCount > 80 && !answerSet) triggerEnded();
      } catch {
        consecutiveErrors++;
        const rtcState = (p as any).connectionState;
        if (consecutiveErrors >= 5 && (rtcState === 'failed' || rtcState === 'closed')) {
          triggerEnded();
        }
      }
    }, 1000);
  }, [cleanup, createPC, sendIceCandidate, triggerEnded]);

  // ── CALLEE ────────────────────────────────────────────────────────
  const answerCall = useCallback(async (callId: string, offer: any, type: 'audio' | 'video') => {
    endedRef.current = false;
    cleanup();
    setCallType(type);

    const constraints: any = type === 'video'
      ? { audio: true, video: { facingMode: 'user' } }
      : { audio: true, video: false };

    let stream: MediaStream;
    try {
      stream = await mediaDevices.getUserMedia(constraints) as MediaStream;
    } catch {
      stream = await mediaDevices.getUserMedia({ audio: true, video: false }) as MediaStream;
    }

    localStreamRef.current = stream;
    setLocalStream(stream);
    callIdRef.current = callId;
    roleRef.current = 'callee';

    const p = await createPC();
    pc.current = p;
    stream.getTracks().forEach((t: any) => p.addTrack(t, stream));
    p.onicecandidate = (e: any) => { if (e.candidate) sendIceCandidate(e.candidate, 'callee'); };

    await p.setRemoteDescription(new RTCSessionDescription(offer) as any);
    const answer = await p.createAnswer();
    await p.setLocalDescription(answer as any);
    await new Promise(r => setTimeout(r, 500));
    await sigFetch('/call/answer', 'POST', { callId, answer: p.localDescription });

    const session = await sigFetch(`/call/${callId}`);
    let callerCandidatesApplied = 0;
    for (const c of (session.callerCandidates || [])) {
      try { await p.addIceCandidate(new RTCIceCandidate(c) as any); } catch {}
      callerCandidatesApplied++;
    }

    setCallState('ringing');

    let calleeErrors = 0;
    pollingRef.current = setInterval(async () => {
      if (endedRef.current) return;
      try {
        const s = await sigFetch(`/call/${callId}`);
        calleeErrors = 0;
        if (!s || s.ended) { triggerEnded(); return; }
        const cands = s.callerCandidates || [];
        for (let i = callerCandidatesApplied; i < cands.length; i++) {
          try { await p.addIceCandidate(new RTCIceCandidate(cands[i]) as any); } catch {}
        }
        callerCandidatesApplied = cands.length;
      } catch {
        calleeErrors++;
        const rtcState = (p as any).connectionState;
        if (calleeErrors >= 5 && (rtcState === 'failed' || rtcState === 'closed')) {
          triggerEnded();
        }
      }
    }, 1000);
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
    localStreamRef.current?.getAudioTracks().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t: any) => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  }, []);

  // Polling llamadas entrantes
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
    localStream, remoteStream,
    startCall, answerCall, endCall, toggleMute, toggleCamera, pollIncoming,
  };
}
