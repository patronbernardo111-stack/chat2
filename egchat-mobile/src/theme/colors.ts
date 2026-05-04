// EGCHAT Color System
// Extraído del design system web (index.css)

export const Colors = {
  // Fondos
  bgPrimary: '#F7F8FA',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#F0F2F5',
  bgInput: '#F0F2F5',

  // Texto
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLink: '#2563EB',

  // Acento EGCHAT
  accent: '#07C160',
  accentLight: '#E8F8EE',
  accentDark: '#059669',
  brand: '#00C8A0',

  // Bordes
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Burbujas de chat
  bubbleOwn: '#95EC69',
  bubbleOther: '#FFFFFF',

  // Estados
  error: '#EF4444',
  errorBg: '#FEF2F2',
  errorBorder: '#FECACA',
  errorText: '#DC2626',
  success: '#22C55E',
  warning: '#F59E0B',

  // Especiales
  neonEG: '#00E5FF',
  neonChat: '#1E90FF',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
