// Modo oscuro — colores alternativos para dark theme
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'egchat_theme_mode';

export const DarkColors = {
  // ── Fondos ────────────────────────────────────────────────────
  bgPrimary:    '#0d1117',
  bgSecondary:  '#161b22',
  bgTertiary:   '#21262d',
  bgInput:      '#21262d',

  // ── Texto ─────────────────────────────────────────────────────
  textPrimary:   '#e6edf3',
  textSecondary: '#8b949e',
  textTertiary:  '#6e7681',
  textLink:      '#58a6ff',

  // ── Acento (mismo gradiente que la web en dark) ───────────────
  accent:        '#07C160',
  accentLight:   '#0d2818',
  accentDark:    '#059669',
  brand:         '#00C8A0',
  brandBlue:     '#00B4E6',
  brandDark:     '#0088CC',
  gradientStart: '#00C8A0',
  gradientEnd:   '#00B4E6',

  // ── Bordes ────────────────────────────────────────────────────
  border:        '#30363d',
  borderLight:   '#21262d',

  // ── Burbujas ──────────────────────────────────────────────────
  bubbleOwn:     '#1a4731',
  bubbleOther:   '#161b22',

  // ── Estados ───────────────────────────────────────────────────
  error:         '#f85149',
  errorBg:       '#2d1117',
  errorBorder:   '#6e2c2c',
  errorText:     '#f85149',
  success:       '#3fb950',
  warning:       '#d29922',
  info:          '#58a6ff',

  // ── Colores de categorías ─────────────────────────────────────
  purple:        '#A855F7',
  orange:        '#F59E0B',
  red:           '#EF4444',
  green:         '#00C8A0',

  // ── Especiales ────────────────────────────────────────────────
  neonEG:        '#00E5FF',
  neonChat:      '#1E90FF',
  white:         '#ffffff',
  black:         '#000000',
  transparent:   'transparent',
  overlay:       'rgba(0,0,0,0.6)',
  overlayLight:  'rgba(255,255,255,0.1)',
};

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  await SecureStore.setItemAsync(THEME_KEY, mode);
}

export async function getThemeMode(): Promise<ThemeMode> {
  const val = await SecureStore.getItemAsync(THEME_KEY);
  return (val as ThemeMode) || 'system';
}

// Hook para usar el tema
export function useTheme() {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    getThemeMode().then(setMode);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  return { isDark, mode, setMode: async (m: ThemeMode) => { setMode(m); await saveThemeMode(m); } };
}
