import { Platform, TextStyle } from 'react-native';

// EGCHAT Typography System
// Extraído del design system web (index.css --font-* variables)

// Familia de fuentes — sistema nativo igual que la web
const fontFamily = Platform.select({
  ios: 'System',       // SF Pro en iOS
  android: 'Roboto',   // Roboto en Android
  default: 'System',
});

export const FontSize = {
  xs: 11,    // timestamps, badges
  sm: 12,    // meta, labels iconos, hora
  base: 14,  // texto mensajes, subtítulos
  md: 15,    // nombre contacto en chat abierto, inputs
  lg: 16,    // nombre en lista de chats
  xl: 17,    // títulos de sección, header
  '2xl': 20, // títulos grandes
} as const;

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
} as const;

export const LineHeight = {
  tight: 1.3,
  normal: 1.4,
  relaxed: 1.45,
} as const;

// Estilos tipográficos semánticos (equivalentes a clases .wa-* del CSS)
export const Typography = {
  // Nombre principal en lista de chats (.wa-name)
  chatName: {
    fontFamily,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.lg * LineHeight.tight,
  } as TextStyle,

  // Último mensaje / subtítulo (.wa-subtitle)
  subtitle: {
    fontFamily,
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.tight,
  } as TextStyle,

  // Hora / timestamp (.wa-time)
  timestamp: {
    fontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  } as TextStyle,

  // Label de icono en servicios/nav (.wa-icon-label)
  iconLabel: {
    fontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center' as TextStyle['textAlign'],
  } as TextStyle,

  // Título de sección (.wa-section-title)
  sectionTitle: {
    fontFamily,
    fontSize: 13,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 0.5,
  } as TextStyle,

  // Texto de mensaje en burbuja (.wa-msg-text)
  messageText: {
    fontFamily,
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.relaxed,
  } as TextStyle,

  // Header título (.wa-header-title)
  headerTitle: {
    fontFamily,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  } as TextStyle,

  // Nombre en header de chat abierto (.wa-chat-name)
  chatHeaderName: {
    fontFamily,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  } as TextStyle,

  // Estado online (.wa-status)
  onlineStatus: {
    fontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  } as TextStyle,

  // Label de campo (.wa-field-label)
  fieldLabel: {
    fontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    textTransform: 'uppercase' as TextStyle['textTransform'],
    letterSpacing: 0.3,
  } as TextStyle,

  // Valor de campo (.wa-field-value)
  fieldValue: {
    fontFamily,
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
  } as TextStyle,

  // Botón de acción (.wa-action-btn)
  actionButton: {
    fontFamily,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  } as TextStyle,

  // Badge de notificación
  badge: {
    fontFamily,
    fontSize: 10,
    fontWeight: FontWeight.bold,
  } as TextStyle,

  // Nav label
  navLabel: {
    fontFamily,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  } as TextStyle,
} as const;
