// useSounds.ts — Sistema de sonidos para EGCHAT usando Web Audio API
// Sin archivos externos — genera todos los tonos programáticamente

let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

// ── Configuración de tonos guardada en localStorage ───────────────────────────
export interface SoundSettings {
  messageTone: string;
  ringtone: string;
  notificationTone: string;
  volume: number; // 0-1
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  messageTone: 'whatsapp',
  ringtone: 'classic',
  notificationTone: 'pop',
  volume: 0.7,
  vibrationEnabled: true,
};

export const getSoundSettings = (): SoundSettings => {
  try {
    const s = localStorage.getItem('egchat_sound_settings');
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
};

export const saveSoundSettings = (settings: Partial<SoundSettings>) => {
  try {
    const current = getSoundSettings();
    localStorage.setItem('egchat_sound_settings', JSON.stringify({ ...current, ...settings }));
  } catch {}
};

// ── Tonos de mensaje disponibles ─────────────────────────────────────────────
export const MESSAGE_TONES: { id: string; name: string; play: (vol: number) => void }[] = [
  {
    id: 'whatsapp', name: 'WhatsApp',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [{ freq: 880, start: 0, dur: 0.08 }, { freq: 1100, start: 0.1, dur: 0.1 }].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + start);
        gain.gain.setValueAtTime(0, t + start);
        gain.gain.linearRampToValueAtTime(vol * 0.4, t + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
        osc.start(t + start); osc.stop(t + start + dur + 0.05);
      });
    }
  },
  {
    id: 'telegram', name: 'Telegram',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + i * 0.06);
        gain.gain.setValueAtTime(vol * 0.25, t + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.08);
        osc.start(t + i * 0.06); osc.stop(t + i * 0.06 + 0.1);
      });
    }
  },
  {
    id: 'ding', name: 'Ding',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.3);
      gain.gain.setValueAtTime(vol * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t); osc.stop(t + 0.4);
    }
  },
  {
    id: 'chime', name: 'Chime',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [1047, 1319, 1568].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t + i * 0.12);
        gain.gain.setValueAtTime(vol * 0.3, t + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.25);
        osc.start(t + i * 0.12); osc.stop(t + i * 0.12 + 0.3);
      });
    }
  },
  {
    id: 'pop', name: 'Pop',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
      gain.gain.setValueAtTime(vol * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.start(t); osc.stop(t + 0.1);
    }
  },
  {
    id: 'bubble', name: 'Burbuja',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [0, 0.08, 0.16].forEach((offset, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(600 + i * 200, t + offset);
        osc.frequency.exponentialRampToValueAtTime(1200 + i * 100, t + offset + 0.06);
        gain.gain.setValueAtTime(vol * 0.2, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08);
        osc.start(t + offset); osc.stop(t + offset + 0.1);
      });
    }
  },
  {
    id: 'none', name: 'Sin sonido',
    play: () => {}
  },
];

// ── Tonos de llamada disponibles ──────────────────────────────────────────────
export const RINGTONES: { id: string; name: string; play: (vol: number) => void }[] = [
  {
    id: 'classic', name: 'Clásico',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [0, 0.35].forEach(offset => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(480, t + offset);
        osc.frequency.setValueAtTime(440, t + offset + 0.15);
        gain.gain.setValueAtTime(0, t + offset);
        gain.gain.linearRampToValueAtTime(vol * 0.6, t + offset + 0.02);
        gain.gain.setValueAtTime(vol * 0.6, t + offset + 0.13);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.28);
        osc.start(t + offset); osc.stop(t + offset + 0.3);
      });
    }
  },
  {
    id: 'modern', name: 'Moderno',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [523, 659, 784, 1047, 784, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + i * 0.1);
        gain.gain.setValueAtTime(vol * 0.3, t + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.09);
        osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.12);
      });
    }
  },
  {
    id: 'digital', name: 'Digital',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [0, 0.2, 0.4].forEach(offset => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(880, t + offset);
        gain.gain.setValueAtTime(vol * 0.15, t + offset);
        gain.gain.setValueAtTime(vol * 0.15, t + offset + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.15);
        osc.start(t + offset); osc.stop(t + offset + 0.18);
      });
    }
  },
  {
    id: 'marimba', name: 'Marimba',
    play: (vol) => {
      const ctx = getCtx(); const t = ctx.currentTime;
      [784, 1047, 1319, 1047, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, t + i * 0.15);
        gain.gain.setValueAtTime(vol * 0.35, t + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.2);
        osc.start(t + i * 0.15); osc.stop(t + i * 0.15 + 0.25);
      });
    }
  },
  {
    id: 'vibrate_only', name: 'Solo vibración',
    play: () => {}
  },
  {
    id: 'none', name: 'Sin tono',
    play: () => {}
  },
];

// ── Tonos de notificación ─────────────────────────────────────────────────────
export const NOTIFICATION_TONES: { id: string; name: string; play: (vol: number) => void }[] = [
  { id: 'pop', name: 'Pop', play: (vol) => MESSAGE_TONES.find(t => t.id === 'pop')!.play(vol) },
  { id: 'ding', name: 'Ding', play: (vol) => MESSAGE_TONES.find(t => t.id === 'ding')!.play(vol) },
  { id: 'chime', name: 'Chime', play: (vol) => MESSAGE_TONES.find(t => t.id === 'chime')!.play(vol) },
  { id: 'bubble', name: 'Burbuja', play: (vol) => MESSAGE_TONES.find(t => t.id === 'bubble')!.play(vol) },
  { id: 'none', name: 'Sin sonido', play: () => {} },
];

// ── Funciones principales que usan la configuración guardada ─────────────────
export const playMessageReceived = () => {
  try {
    const s = getSoundSettings();
    const tone = MESSAGE_TONES.find(t => t.id === s.messageTone) || MESSAGE_TONES[0];
    tone.play(s.volume);
  } catch {}
};

export const playMessageSent = () => {
  try {
    const s = getSoundSettings();
    if (s.messageTone === 'none') return;
    const ctx = getCtx(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.06);
    gain.gain.setValueAtTime(s.volume * 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.1);
  } catch {}
};

export const playNotification = () => {
  try {
    const s = getSoundSettings();
    const tone = NOTIFICATION_TONES.find(t => t.id === s.notificationTone) || NOTIFICATION_TONES[0];
    tone.play(s.volume);
  } catch {}
};

// ── Ringtone ──────────────────────────────────────────────────────────────────
let ringtoneInterval: ReturnType<typeof setInterval> | null = null;

export const startRingtone = () => {
  stopRingtone();
  const s = getSoundSettings();
  if (s.ringtone === 'none') return;
  const tone = RINGTONES.find(t => t.id === s.ringtone) || RINGTONES[0];
  const playRing = () => { try { tone.play(s.volume); } catch {} };
  playRing();
  ringtoneInterval = setInterval(playRing, 2000);
};

export const stopRingtone = () => {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
};

// ── Tono de marcación ─────────────────────────────────────────────────────────
let dialingInterval: ReturnType<typeof setInterval> | null = null;

export const startDialingTone = () => {
  stopDialingTone();
  const s = getSoundSettings();
  const playDial = () => {
    try {
      const ctx = getCtx(); const t = ctx.currentTime;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(440, t);
      gain.gain.setValueAtTime(s.volume * 0.2, t);
      gain.gain.setValueAtTime(s.volume * 0.2, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t); osc.stop(t + 0.5);
    } catch {}
  };
  playDial();
  dialingInterval = setInterval(playDial, 1500);
};

export const stopDialingTone = () => {
  if (dialingInterval) { clearInterval(dialingInterval); dialingInterval = null; }
};

// ── Llamada conectada ─────────────────────────────────────────────────────────
export const playCallConnected = () => {
  try {
    const s = getSoundSettings();
    const ctx = getCtx(); const t = ctx.currentTime;
    [600, 800, 1000].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(s.volume * 0.25, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.07);
      osc.start(t + i * 0.08); osc.stop(t + i * 0.08 + 0.1);
    });
  } catch {}
};

// ── Llamada terminada ─────────────────────────────────────────────────────────
export const playCallEnded = () => {
  try {
    const s = getSoundSettings();
    const ctx = getCtx(); const t = ctx.currentTime;
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    gain.gain.setValueAtTime(s.volume * 0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.start(t); osc.stop(t + 0.5);
  } catch {}
};

// ── Error ─────────────────────────────────────────────────────────────────────
export const playError = () => {
  try {
    const s = getSoundSettings();
    const ctx = getCtx(); const t = ctx.currentTime;
    [0, 0.15].forEach(offset => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t + offset);
      gain.gain.setValueAtTime(s.volume * 0.15, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
      osc.start(t + offset); osc.stop(t + offset + 0.15);
    });
  } catch {}
};

// ── Éxito ─────────────────────────────────────────────────────────────────────
export const playSuccess = () => {
  try {
    const s = getSoundSettings();
    const ctx = getCtx(); const t = ctx.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(s.volume * 0.2, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);
      osc.start(t + i * 0.1); osc.stop(t + i * 0.1 + 0.15);
    });
  } catch {}
};

// ── Vibración ─────────────────────────────────────────────────────────────────
export const vibrate = (pattern: number | number[] = 100) => {
  try {
    const s = getSoundSettings();
    if (s.vibrationEnabled) navigator.vibrate?.(pattern);
  } catch {}
};

// ── Desbloquear audio ─────────────────────────────────────────────────────────
export const unlockAudio = () => {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {}
};
