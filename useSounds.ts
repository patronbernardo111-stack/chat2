// ─── useSounds.ts ────────────────────────────────────────────────────────────

export interface SoundSettings {
  messageTone: string;
  ringtone: string;
  notificationTone: string;
  volume: number;
  vibrationEnabled: boolean;
  soundEnabled: boolean;
}

export const MESSAGE_TONES = [
  { id: 'default', label: 'Por defecto' },
  { id: 'chime',   label: 'Campana' },
  { id: 'pop',     label: 'Pop' },
  { id: 'none',    label: 'Silencio' },
];

export const RINGTONES = [
  { id: 'default', label: 'Por defecto' },
  { id: 'classic', label: 'Clásico' },
  { id: 'digital', label: 'Digital' },
  { id: 'none',    label: 'Silencio' },
];

export const NOTIFICATION_TONES = [
  { id: 'default', label: 'Por defecto' },
  { id: 'soft',    label: 'Suave' },
  { id: 'none',    label: 'Silencio' },
];

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

// ─── Audio context helper ─────────────────────────────────────────────────────
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

function playTone(freqs: number[], duration = 0.3, volume = 0.3, type: OscillatorType = 'sine'): void {
  const settings = getSoundSettings();
  if (!settings.soundEnabled) return;
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
      gain.gain.setValueAtTime(settings.volume * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration / freqs.length);
      osc.start(t);
      osc.stop(t + duration / freqs.length + 0.05);
    });
  } catch { /* ignore */ }
}

// ─── Ringtone / dialing loop ──────────────────────────────────────────────────
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
export function playMessageReceived(volume = 1.0): void {
  playTone([523, 659], 0.25, 0.25 * volume);
}

export function playMessageSent(volume = 1.0): void {
  playTone([659, 523], 0.2, 0.2 * volume);
}

export function playNotification(volume = 1.0): void {
  playTone([880], 0.3, 0.2 * volume);
}

export function playCallConnected(volume = 1.0): void {
  playTone([523, 659, 784], 0.4, 0.3 * volume);
}

export function playCallEnded(volume = 1.0): void {
  playTone([784, 659, 523], 0.4, 0.3 * volume);
}

export function playError(volume = 1.0): void {
  playTone([300, 250], 0.4, 0.3 * volume, 'sawtooth');
}

export function playSuccess(volume = 1.0): void {
  playTone([523, 659, 784], 0.5, 0.3 * volume);
}

export function vibrate(pattern: number | number[]): void {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}
