// ─── useSounds.ts ────────────────────────────────────────────────────────────

export interface SoundSettings {
  messageTone: string;
  ringtone: string;
  notificationTone: string;
  volume: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  messageTone: 'default',
  ringtone: 'default',
  notificationTone: 'default',
  volume: 0.5,
  vibrationEnabled: true,
  soundEnabled: true,
};

export function getSoundSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem('soundSettings');
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSoundSettings(settings: Partial<SoundSettings>): void {
  try {
    const current = getSoundSettings();
    localStorage.setItem('soundSettings', JSON.stringify({ ...current, ...settings }));
  } catch { /* ignore */ }
}

// ─── Audio context ────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!_ctx || _ctx.state === 'closed') {
      _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return _ctx;
  } catch {
    return null;
  }
}

export function unlockAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// Plays with explicit volume (used by tone objects)
function playToneImmediate(freqs: number[], duration = 0.3, volume = 0.3, type: OscillatorType = 'sine'): void {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    freqs.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      const t = ctx.currentTime + i * (duration / freqs.length);
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(Math.max(0.001, volume), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration / freqs.length);
      osc.start(t);
      osc.stop(t + duration / freqs.length + 0.05);
    });
  } catch { /* ignore */ }
}

// Plays respecting soundEnabled setting
function playTone(freqs: number[], duration = 0.3, volume = 0.3, type: OscillatorType = 'sine'): void {
  const settings = getSoundSettings();
  if (!settings.soundEnabled) return;
  playToneImmediate(freqs, duration, settings.volume * volume, type);
}

export function vibrate(pattern: number | number[]): void {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

// ─── Tone catalogs ────────────────────────────────────────────────────────────
export const MESSAGE_TONES = [
  { id: 'default', label: 'Por defecto', name: 'Por defecto', play: (vol = 1) => playToneImmediate([523, 659], 0.25, 0.25 * vol) },
  { id: 'chime',   label: 'Campana',     name: 'Campana',     play: (vol = 1) => playToneImmediate([880, 1100], 0.3, 0.25 * vol) },
  { id: 'pop',     label: 'Pop',         name: 'Pop',         play: (vol = 1) => playToneImmediate([1200], 0.15, 0.3 * vol) },
  { id: 'none',    label: 'Silencio',    name: 'Silencio',    play: (_vol = 1) => {} },
];

export const RINGTONES = [
  { id: 'default',      label: 'Por defecto', name: 'Por defecto', play: (vol = 1) => playToneImmediate([880, 1100, 880, 1100], 0.8, 0.4 * vol) },
  { id: 'classic',      label: 'Clásico',     name: 'Clásico',     play: (vol = 1) => playToneImmediate([440, 550, 440, 550], 0.8, 0.4 * vol) },
  { id: 'digital',      label: 'Digital',     name: 'Digital',     play: (vol = 1) => playToneImmediate([1000, 1200, 1000, 1200], 0.6, 0.35 * vol) },
  { id: 'vibrate_only', label: 'Solo vibrar', name: 'Solo vibrar', play: (_vol = 1) => vibrate([300, 100, 300]) },
  { id: 'none',         label: 'Silencio',    name: 'Silencio',    play: (_vol = 1) => {} },
];

export const NOTIFICATION_TONES = [
  { id: 'default', label: 'Por defecto', name: 'Por defecto', play: (vol = 1) => playToneImmediate([880], 0.3, 0.2 * vol) },
  { id: 'soft',    label: 'Suave',       name: 'Suave',       play: (vol = 1) => playToneImmediate([660], 0.25, 0.15 * vol) },
  { id: 'none',    label: 'Silencio',    name: 'Silencio',    play: (_vol = 1) => {} },
];

// ─── Ringtone / dialing loops ─────────────────────────────────────────────────
let _ringtoneInterval: ReturnType<typeof setInterval> | null = null;
let _dialingInterval:  ReturnType<typeof setInterval> | null = null;

export function startRingtone(): void {
  stopRingtone();
  playTone([880, 1100, 880, 1100], 0.8, 0.4);
  _ringtoneInterval = setInterval(() => playTone([880, 1100, 880, 1100], 0.8, 0.4), 2000);
}

export function stopRingtone(): void {
  if (_ringtoneInterval) { clearInterval(_ringtoneInterval); _ringtoneInterval = null; }
}

export function startDialingTone(): void {
  stopDialingTone();
  playTone([440, 480], 0.5, 0.2);
  _dialingInterval = setInterval(() => playTone([440, 480], 0.5, 0.2), 1000);
}

export function stopDialingTone(): void {
  if (_dialingInterval) { clearInterval(_dialingInterval); _dialingInterval = null; }
}

// ─── One-shot sounds ──────────────────────────────────────────────────────────
export function playMessageReceived(volume = 1.0): void { playTone([523, 659], 0.25, 0.25 * volume); }
export function playMessageSent(volume = 1.0): void     { playTone([659, 523], 0.2,  0.2  * volume); }
export function playNotification(volume = 1.0): void    { playTone([880],      0.3,  0.2  * volume); }
export function playCallConnected(volume = 1.0): void   { playTone([523, 659, 784], 0.4, 0.3 * volume); }
export function playCallEnded(volume = 1.0): void       { playTone([784, 659, 523], 0.4, 0.3 * volume); }
export function playError(volume = 1.0): void           { playTone([300, 250], 0.4, 0.3 * volume, 'sawtooth'); }
export function playSuccess(volume = 1.0): void         { playTone([523, 659, 784], 0.5, 0.3 * volume); }
