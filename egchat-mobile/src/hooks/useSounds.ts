// useSounds.ts — Sistema de sonidos para EGCHAT en React Native
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SoundSettings {
  messageTone: string;
  ringtone: string;
  notificationTone: string;
  volume: number;
  vibrationEnabled: boolean;
}

const DEFAULT_SETTINGS: SoundSettings = {
  messageTone: 'egchat',
  ringtone: 'classic',
  notificationTone: 'pop',
  volume: 0.7,
  vibrationEnabled: true,
};

const STORAGE_KEY = 'egchat_sound_settings';

export const getSoundSettings = async (): Promise<SoundSettings> => {
  try {
    const s = await AsyncStorage.getItem(STORAGE_KEY);
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSoundSettings = async (settings: Partial<SoundSettings>) => {
  try {
    const current = await getSoundSettings();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }));
  } catch {}
};

// Configurar modo de audio
const setupAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
    });
  } catch {}
};

setupAudio();

// Tono de mensaje recibido
export const playMessageReceived = async () => {
  try {
    const s = await getSoundSettings();
    if (s.messageTone === 'none') return;
    // En RN usamos el sistema de notificaciones para sonidos
    // Los sonidos personalizados se configuran en expo-notifications
    if (s.vibrationEnabled) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

// Tono de mensaje enviado
export const playMessageSent = async () => {
  try {
    const s = await getSoundSettings();
    if (s.messageTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

// Notificación
export const playNotification = async () => {
  try {
    const s = await getSoundSettings();
    if (s.notificationTone === 'none') return;
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

// Llamada conectada
export const playCallConnected = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

// Llamada terminada
export const playCallEnded = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
};

// Error
export const playError = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
};

// Éxito
export const playSuccess = async () => {
  try {
    const s = await getSoundSettings();
    if (s.vibrationEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

// Vibración
export const vibrate = async (pattern: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const s = await getSoundSettings();
    if (!s.vibrationEnabled) return;
    const map = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(map[pattern]);
  } catch {}
};

// Ringtone (en RN se gestiona via expo-notifications)
let ringtoneSound: Audio.Sound | null = null;

export const startRingtone = async () => {
  stopRingtone();
  try {
    const s = await getSoundSettings();
    if (s.ringtone === 'none') return;
    if (s.vibrationEnabled) {
      // Vibración de llamada entrante
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  } catch {}
};

export const stopRingtone = async () => {
  try {
    if (ringtoneSound) {
      await ringtoneSound.stopAsync();
      await ringtoneSound.unloadAsync();
      ringtoneSound = null;
    }
  } catch {}
};

export const startDialingTone = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
};

export const stopDialingTone = () => {};

export const MESSAGE_TONES = [
  { id: 'egchat', name: 'EGCHAT' },
  { id: 'notif', name: 'Notificación' },
  { id: 'ding', name: 'Ding' },
  { id: 'chime', name: 'Chime' },
  { id: 'pop', name: 'Pop' },
  { id: 'bubble', name: 'Burbuja' },
  { id: 'none', name: 'Sin sonido' },
];

export const RINGTONES = [
  { id: 'classic', name: 'Clásico' },
  { id: 'modern', name: 'Moderno' },
  { id: 'digital', name: 'Digital' },
  { id: 'marimba', name: 'Marimba' },
  { id: 'vibrate_only', name: 'Solo vibración' },
  { id: 'none', name: 'Sin tono' },
];

export const NOTIFICATION_TONES = [
  { id: 'pop', name: 'Pop' },
  { id: 'ding', name: 'Ding' },
  { id: 'chime', name: 'Chime' },
  { id: 'bubble', name: 'Burbuja' },
  { id: 'none', name: 'Sin sonido' },
];
