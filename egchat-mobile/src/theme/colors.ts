// EGCHAT Color System
// Idéntico al design system web (index.css + App.tsx)

export const Colors = {
  // ── Fondos ────────────────────────────────────────────────────
  bgPrimary:   '#F7F8FA',
  bgSecondary: '#FFFFFF',
  bgTertiary:  '#F0F2F5',
  bgInput:     '#F0F2F5',

  // ── Texto ─────────────────────────────────────────────────────
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textTertiary:  '#9CA3AF',
  textLink:      '#2563EB',

  // ── Acento EGCHAT ─────────────────────────────────────────────
  // Header y bottom nav: gradiente #00c8a0 → #00b4e6
  accent:      '#07C160',   // verde chats (burbujas propias, badges)
  accentLight: '#E8F8EE',
  accentDark:  '#059669',

  // Colores de marca del gradiente del header/nav
  brand:       '#00C8A0',   // verde EGCHAT (inicio del gradiente)
  brandBlue:   '#00B4E6',   // azul EGCHAT (fin del gradiente)
  brandDark:   '#0088CC',   // azul oscuro

  // Gradiente principal (header + bottom nav)
  gradientStart: '#00C8A0',
  gradientEnd:   '#00B4E6',

  // ── Bordes ────────────────────────────────────────────────────
  border:      '#E5E7EB',
  borderLight: '#F3F4F6',

  // ── Burbujas de chat ──────────────────────────────────────────
  bubbleOwn:   '#95EC69',   // .msg-bubble-me
  bubbleOther: '#FFFFFF',   // .msg-bubble-them

  // ── Estados ───────────────────────────────────────────────────
  error:       '#EF4444',
  errorBg:     '#FEF2F2',
  errorBorder: '#FECACA',
  errorText:   '#DC2626',
  success:     '#22C55E',
  warning:     '#F59E0B',
  info:        '#00B4E6',

  // ── Colores de categorías (igual que la web) ──────────────────
  purple:      '#A855F7',   // grupos
  orange:      '#F59E0B',   // taxi, advertencias
  red:         '#EF4444',   // peligro, reportar
  green:       '#00C8A0',   // pagos, cifrado E2E

  // ── Especiales ────────────────────────────────────────────────
  neonEG:      '#00E5FF',
  neonChat:    '#1E90FF',
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // ── Overlay ───────────────────────────────────────────────────
  overlay:     'rgba(0,0,0,0.4)',
  overlayLight:'rgba(255,255,255,0.2)',
} as const;

export type ColorKey = keyof typeof Colors;
