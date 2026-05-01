// ─── useWebRTC — señalización via HTTP polling ────────────────────────────────
import { useRef, useState, useCallback, useEffect } from 'react';
import { authAPI } from './api';

const BASE = (() => {
  const url = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (!url || url.startsWith('/')) return 'https://egchat-api.onrender.com/api';
  return url.endsWith('/api') ? url : url.replace(/\/$/, '') + '/api';
})();

// ── ICE Servers — STUN gratuitos (Google, Cloudflare, Twilio) + TURN público ──
// Los STUN servers descubren la IP pública.
// Los TURN servers actúan como relay cuando la conexión directa falla (NAT estricto,
// redes móviles, diferentes países). Usamos múltiples para máxima cobertura.
const ICE_SERVERS: RTCIceServer[] = [
  // STUN — Google (los más confiables, prioritarios)
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun4.l.google.com:19302'] },
  // STUN — Cloudflare (backup rápido)
  { urls: 'stun:stun.cloudflare.com:3478' },
  // STUN — stunprotocol.org
  { urls: 'stun:stun.stunprotocol.org:3478' },
  // TURN — Open Relay UDP (mejor para móviles)
  { urls: ['turn:openrelay.metered.ca:80?transport=udp', 'turn:openrelay.metered.ca:80?transport=tcp'],
    username: 'openrelayproject', credential: 'openrelayproject' },
  // TURN — Open Relay HTTPS (para firewalls estrictos)
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject', credential: 'openrelayproject' },
  // TURN — Metered CA (redundancia)
  { urls: ['turn:a.relay.metered.ca:80?transport=udp', 'turn:a.relay.metered.ca:80?transport=tcp'],
    username: 'openrelayproject', credential: 'openrelayproject' },
  // TURN — Numb (gratuito, estable)
  { urls: ['turn:numb.viagenie.ca:3478?transport=udp', 'turn:numb.viagenie.ca:3478?transport=tcp'],
    username: 'webrtc@live.com', credential: 'muazkh' },
];

// ── FUNCIONES HELPER: Forzar codecs compatibles iOS ↔ Android ───────────────────
/**
 * Fuerza H.264 como codec de video principal en el SDP.
 * iOS NO soporta VP8/VP9, solo H.264. Android anuncia VP8 por defecto.
 * Esta función reordena los codecs en la sección de video para que H.264
 * sea el primero y asegura que tenga los parámetros correctos (profile-level-id,
 * packetization-mode, rtcp-fb) requeridos por iOS.
 */
function forceH264InSDP(sdp: string): string {
  if (!sdp) return sdp;

  const lines = sdp.split('\n');
  const newLines: string[] = [];
  let inVideoSection = false;
  let videoMLineIndex = -1;
  let h264Pt: string | null = null;

  // Primera pasada: encontrar sección de video y líneas de H.264
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('m=video')) {
      inVideoSection = true;
      videoMLineIndex = newLines.length;
      newLines.push(line);
      continue;
    }

    if (line.startsWith('m=') && inVideoSection) {
      inVideoSection = false;
      newLines.push(line);
      continue;
    }

    if (inVideoSection) {
      // Detectar H.264 en rtpmap
      if (line.startsWith('a=rtpmap:')) {
        const match = line.match(/a=rtpmap:(\d+)\s+(\w+)/);
        if (match) {
          const pt = match[1];
          const codec = match[2].toLowerCase();
          if (codec === 'h264' || codec === 'avc') {
            h264Pt = pt;
          }
        }
      }
      newLines.push(line);
      continue;
    }

    newLines.push(line);
  }

  // Segunda pasada: reordenar codecs en m=video (H.264 primero)
  if (videoMLineIndex !== -1 && h264Pt) {
    const originalLine = newLines[videoMLineIndex];
    const parts = originalLine.split(' ');
    if (parts.length >= 4) {
      // Reconstruir: m=video <port> <proto> <h264_pt> [otros...]
      const newParts = [parts[0], parts[1], parts[2], h264Pt];
      const used = new Set([h264Pt]);
      for (let j = 3; j < parts.length; j++) {
        const pt = parts[j].trim();
        if (pt && !used.has(pt)) {
          newParts.push(pt);
          used.add(pt);
        }
      }
      newLines[videoMLineIndex] = newParts.join(' ');
    }
  }

  // Tercera pasada: asegurar fmtp y rtcp-fb para H.264
  for (let i = 0; i < newLines.length; i++) {
    const line = newLines[i];

    if (line.startsWith('a=fmtp:') && h264Pt) {
      const match = line.match(/a=fmtp:(\d+)\s+(.*)/);
      if (match && match[1] === h264Pt) {
        // Asegurar parámetros H.264 para iOS
        if (!match[2].includes('profile-level-id') || !match[2].includes('packetization-mode')) {
          newLines[i] = `a=fmtp:${h264Pt} profile-level-id=42e01f;packetization-mode=1`;
        }
      }
    }

    // Añadir rtcp-fb si falta (requerido por iOS)
    if (inVideoSection && h264Pt) {
      // Insertar rtcp-fb después del m=video si no existen
      let hasRtcpFb = false;
      for (const l of newLines) {
        if (l.startsWith(`a=rtcp-fb:${h264Pt}`)) {
          hasRtcpFb = true;
          break;
        }
      }
      if (!hasRtcpFb) {
        // Insertar antes de la primera línea que no sea de video
        const insertIdx = newLines.findIndex(l => l.startsWith('m=audio') || l.startsWith('m=application'));
        if (insertIdx === -1) insertIdx = newLines.length;
        newLines.splice(insertIdx, 0, `a=rtcp-fb:${h264Pt} goog-remb`);
        newLines.splice(insertIdx + 1, 0, `a=rtcp-fb:${h264Pt} nack`);
        newLines.splice(insertIdx + 2, 0, `a=rtcp-fb:${h264Pt} nackpli`);
        break; // ya insertamos, salir
      }
    }
  }

  return newLines.join('\n');
}

/**
 * Fuerza Opus como codec de audio principal.
 * Opus es estándar en WebRTC, pero aseguramos que sea el primero.
 */
function forceOpusInSDP(sdp: string): string {
  if (!sdp) return sdp;

  const lines = sdp.split('\n');
  const newLines: string[] = [];
  let audioMLineIndex = -1;
  let opusPt: string | null = null;

  // Primera pasada: encontrar sección de audio y Opus
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('m=audio')) {
      audioMLineIndex = newLines.length;
      newLines.push(line);
      continue;
    }

    if (audioMLineIndex !== -1 && line.startsWith('a=rtpmap:')) {
      const match = line.match(/a=rtpmap:(\d+)\s+(\w+)/);
      if (match && match[2].toLowerCase() === 'opus') {
        opusPt = match[1];
      }
    }

    newLines.push(line);
  }

  // Reordenar: Opus primero en m=audio
  if (audioMLineIndex !== -1 && opusPt) {
    const originalLine = newLines[audioMLineIndex];
    const parts = originalLine.split(' ');
    if (parts.length >= 4) {
      const newParts = [parts[0], parts[1], parts[2], opusPt];
      const used = new Set([opusPt]);
      for (let j = 3; j < parts.length; j++) {
        const pt = parts[j].trim();
        if (pt && !used.has(pt)) {
          newParts.push(pt);
          used.add(pt);
        }
      }
      newLines[audioMLineIndex] = newParts.join(' ');
    }
  }

  return newLines.join('\n');
}

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
    // ── DETECTAR ANDROID ─────────────────────────────────────────────────────────
    const isAndroid = /android/i.test(navigator.userAgent);
    
    // ── CONFIGURACIÓN BASE PEER CONNECTION ──────────────────────────────────────
    const pcConfig: RTCConfiguration = {
      iceServers: ICE_SERVERS,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 10,
    };
    
    const p = new RTCPeerConnection(pcConfig);

    p.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      setRemoteStream(stream);
      if (e.track.kind === 'audio' && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
      // Debug: log codec del track recibido
      const receiver = p.getReceivers().find(r => r.track === e.track);
      if (receiver) {
        const params = receiver.getParameters();
        console.log('📥 Track recibido:', e.track.kind, 
                    '| codec:', params?.codecs?.[0]?.mimeType || 'unknown');
      }
    };

    p.onconnectionstatechange = () => {
      const state = p.connectionState;
      console.log('WebRTC connection state:', state);
      
      if (state === 'connected') {
        setCallState('connected');
        p.getSenders().forEach(async sender => {
          if (!sender.track) return;
          try {
            const params = sender.getParameters();
            if (!params.encodings?.length) params.encodings = [{}];
            
            if (sender.track.kind === 'video') {
              params.encodings[0].maxBitrate = 1_500_000;
              params.encodings[0].maxFramerate = 30;
              params.encodings[0].scalabilityMode = 'L1T2';
            } else {
              params.encodings[0].maxBitrate = 128_000;
            }
            await sender.setParameters(params);
          } catch (e) {
            console.warn('Failed to set sender parameters:', e);
          }
        });
      } else if (state === 'disconnected') {
        console.warn('WebRTC disconnected (transient), waiting for recovery...');
        setTimeout(() => {
          if (p.connectionState === 'disconnected' && roleRef.current === 'caller') {
            try { p.restartIce(); } catch {}
          }
        }, 10000);
      } else if (state === 'failed') {
        console.error('WebRTC connection failed');
        if (roleRef.current === 'caller' && !endedRef.current) {
          try { 
            console.log('Attempting ICE restart...');
            p.restartIce(); 
          } catch (e) {
            console.error('ICE restart failed:', e);
            triggerEnded();
          }
        } else {
          triggerEnded();
        }
      } else if (state === 'closed') {
        triggerEnded();
      }
    };

    p.oniceconnectionstatechange = () => {
      const iceState = p.iceConnectionState;
      console.log('WebRTC ICE connection state:', iceState);
      
      if (iceState === 'failed') {
        console.warn('ICE failed, attempting restart...');
        if (!endedRef.current) {
          try { p.restartIce(); } catch {}
        }
      } else if (iceState === 'disconnected') {
        console.warn('ICE disconnected, waiting for recovery...');
        setTimeout(() => {
          if (p.iceConnectionState === 'disconnected' && !endedRef.current) {
            console.warn('ICE still disconnected after 20s, restarting...');
            try { p.restartIce(); } catch {}
          }
        }, 20000);
      }
    };

    // ── INTERCEPTAR SDP EN ANDROID: Forzar H.264 + Opus ─────────────────────────
    if (isAndroid) {
      console.log('🤖 Android detectado → forzando codecs H.264/Opus');

      const originalCreateOffer = p.createOffer.bind(p);
      p.createOffer = async (options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> => {
        const offer = await originalCreateOffer(options);
        
        if (offer.sdp) {
          let modifiedSDP = offer.sdp;
          modifiedSDP = forceH264InSDP(modifiedSDP);
          modifiedSDP = forceOpusInSDP(modifiedSDP);
          
          console.log('📤 SDP Offer MODIFICADO (primeros 800 chars):\n', 
                      modifiedSDP.substring(0, 800));
          
          return { type: 'offer', sdp: modifiedSDP };
        }
        
        return offer;
      };

      const originalCreateAnswer = p.createAnswer.bind(p);
      p.createAnswer = async (options?: RTCAnswerOptions): Promise<RTCSessionDescriptionInit> => {
        const answer = await originalCreateAnswer(options);
        
        if (answer.sdp) {
          let modifiedSDP = answer.sdp;
          modifiedSDP = forceH264InSDP(modifiedSDP);
          modifiedSDP = forceOpusInSDP(modifiedSDP);
          
          console.log('📥 SDP Answer MODIFICADO (primeros 800 chars):\n', 
                      modifiedSDP.substring(0, 800));
          
          return { type: 'answer', sdp: modifiedSDP };
        }
        
        return answer;
      };
    }

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
       // Solicitar permisos adecuados según tipo de llamada
       const constraints = type === 'video'
         ? { 
             audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
             video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
           }
         : { 
             audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
             video: false
           };

       try {
         stream = await navigator.mediaDevices.getUserMedia(constraints);
       } catch (err: any) {
         // Si falla con los constraints óptimos, intentar con defaults
         const fallbackConstraints = type === 'video'
           ? { audio: true, video: { facingMode: 'user' } }
           : { audio: true, video: false };
         
         console.warn('Optimal constraints failed, using fallback:', err.message);
         try {
           stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
         } catch (fallbackErr: any) {
           // Si aún falla, mostrar mensaje de error específico
           if (fallbackErr.name === 'NotAllowedError') {
             throw new Error('Permiso denegado para acceder a micrófono/cámara. Verifica los permisos en tu dispositivo.');
           } else if (fallbackErr.name === 'NotFoundError') {
             throw new Error('No se encontró micrófono/cámara en tu dispositivo.');
           } else {
             throw new Error(`No se pudo acceder a micrófono/cámara: ${fallbackErr.message}`);
           }
         }
       }
     } catch (err: any) {
       console.error('Get user media error:', err);
       throw err;
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
     
     // ── LOG SDP EN ANDROID PARA DEBUGGING ───────────────────────────────────────
     const isAndroid = /android/i.test(navigator.userAgent);
     if (isAndroid) {
       console.log('📤 [Android] SDP Offer FINAL (enviado al servidor):\n', 
                   p.localDescription?.sdp || 'sin sdp');
     }
     
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
         // Timeout 120s sin respuesta (el receptor puede estar desbloqueando el teléfono)
         if (pollCount > 80 && !answerSet) triggerEnded();
       } catch (err: any) {
         consecutiveErrors++;
         // Solo cortar si hay 10+ errores consecutivos Y la conexión WebRTC está definitivamente caída
         const rtcState = p.connectionState || p.iceConnectionState;
         const rtcFailed = rtcState === 'failed' || rtcState === 'closed';
         // 'disconnected' es transitorio — NO cortar por eso
         if (consecutiveErrors >= 10 && rtcFailed) {
           triggerEnded();
         }
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
       // Solicitar permisos adecuados según tipo de llamada
       const constraints = type === 'video'
         ? {
             audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
             video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
           }
         : {
             audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
             video: false
           };

       try {
         stream = await navigator.mediaDevices.getUserMedia(constraints);
       } catch (err: any) {
         // Fallback a constraints más simples
         const fallbackConstraints = type === 'video'
           ? { audio: true, video: { facingMode: 'user' } }
           : { audio: true, video: false };
         
         console.warn('Optimal constraints failed, using fallback:', err.message);
         try {
           stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
         } catch (fallbackErr: any) {
           if (fallbackErr.name === 'NotAllowedError') {
             throw new Error('Permiso denegado para acceder a micrófono/cámara.');
           } else if (fallbackErr.name === 'NotFoundError') {
             throw new Error('No se encontró micrófono/cámara en tu dispositivo.');
           } else {
             throw new Error(`No se pudo acceder a micrófono/cámara: ${fallbackErr.message}`);
           }
         }
       }
     } catch (err: any) {
       console.error('Get user media error:', err);
       throw err;
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
     
     // ── LOG SDP EN ANDROID PARA DEBUGGING ───────────────────────────────────────
     const isAndroid = /android/i.test(navigator.userAgent);
     if (isAndroid) {
       console.log('📥 [Android] SDP Answer FINAL (enviado al servidor):\n', 
                   p.localDescription?.sdp || 'sin sdp');
     }
     
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
         // Solo cortar si hay 10+ errores Y WebRTC está definitivamente caído
         const rtcState = p.connectionState || p.iceConnectionState;
         const rtcFailed = rtcState === 'failed' || rtcState === 'closed';
         // 'disconnected' es transitorio — NO cortar por eso, puede recuperarse
         if (calleeConsecutiveErrors >= 10 && rtcFailed) triggerEnded();
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
