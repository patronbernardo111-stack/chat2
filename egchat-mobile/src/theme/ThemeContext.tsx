import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { Colors } from './colors';
import { DarkColors, ThemeMode } from './darkMode';

const THEME_KEY = 'egchat_theme_mode';

// Wrapper de almacenamiento compatible con web y nativo
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.setItemAsync(key, value);
  },
};

interface ThemeContextValue {
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => Promise<void>;
  colors: typeof Colors;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  mode: 'system',
  setMode: async () => {},
  colors: Colors,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then(val => {
      if (val) setModeState(val as ThemeMode);
    });
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await SecureStore.setItemAsync(THEME_KEY, m);
  };

  const colors = isDark ? (DarkColors as unknown as typeof Colors) : Colors;

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
