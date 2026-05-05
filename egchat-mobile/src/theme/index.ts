// EGCHAT Theme — punto de entrada único
// Importa todo desde aquí: import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme'

export { Colors } from './colors';
export type { ColorKey } from './colors';
export { ThemeProvider, useThemeContext } from './ThemeContext';
export { DarkColors } from './darkMode';
export type { ThemeMode } from './darkMode';
export { Typography, FontSize, FontWeight, LineHeight } from './typography';
export { Spacing, BorderRadius, Shadow } from './spacing';

// Tema completo como objeto único (útil para ThemeContext)
import { Colors } from './colors';
import { Typography, FontSize, FontWeight } from './typography';
import { Spacing, BorderRadius, Shadow } from './spacing';

export const Theme = {
  colors: Colors,
  typography: Typography,
  fontSize: FontSize,
  fontWeight: FontWeight,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadow: Shadow,
} as const;

export type AppTheme = typeof Theme;
