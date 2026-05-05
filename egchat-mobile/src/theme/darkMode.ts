// Modo oscuro — colores alternativos para dark theme
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'egchat_theme_mode';

export const DarkColors = {
  bgPrimary:    '#0d1117',
  bgSecondary:  '#161b22',
  bgTertiary:   '#21262d',
  bgInput:      '#21262d',
  textPrimary:  '#e6edf3',
  textSecondary:'#8b949e',
  textTertiary: '#6e7681',
  textLink:     '#58a6ff',
  border:       '#30363d',
  borderLight:  '#21262d',
  accent:       '#07C160',
  accentLight:  '#0d2818',
  accentDark:   '#059669',
  brand:        '#00C8A0',
  bubbleOwn:    '#1a4731',
  bubbleOther:  '#161b22',
  error:        '#f85149',
  errorBg:      '#2d1117',
  errorBorder:  '#6e2c2c',
  errorText:    '#f85149',
  white:        '#ffffff',
  black:        '#000000',
  transparent:  'transparent',
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
