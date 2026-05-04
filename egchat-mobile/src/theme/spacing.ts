// EGCHAT Spacing System
// Extraído del design system web (index.css padding/margin/gap)

export const Spacing = {
  // Base units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,

  // Específicos por componente (extraídos del CSS)
  listItemPaddingV: 12,   // .eg-list-item padding vertical
  listItemPaddingH: 16,   // .eg-list-item padding horizontal
  listItemGap: 12,        // gap entre avatar y texto
  inputPaddingV: 10,      // .eg-input padding vertical
  inputPaddingH: 14,      // .eg-input padding horizontal
  buttonPaddingV: 12,     // .eg-btn-primary padding vertical
  buttonPaddingH: 20,     // .eg-btn-primary padding horizontal
  cardPadding: 16,        // padding interno de cards
  screenPadding: 20,      // padding lateral de pantallas
  sectionTitlePaddingT: 12,
  sectionTitlePaddingB: 6,
  chatInputBarPadding: 8,
  chatInputBarGap: 8,
  bubblePaddingV: 8,
  bubblePaddingH: 12,
} as const;

export const BorderRadius = {
  sm: 8,    // --radius-sm
  md: 12,   // --radius-md — inputs, botones
  lg: 16,   // --radius-lg — cards
  xl: 20,   // --radius-xl — modales, sheets
  full: 999, // circular

  // Burbujas de chat
  bubbleOwn: {
    topLeft: 18,
    topRight: 18,
    bottomLeft: 18,
    bottomRight: 4,
  },
  bubbleOther: {
    topLeft: 18,
    topRight: 18,
    bottomLeft: 4,
    bottomRight: 18,
  },

  // Otros
  avatar: 999,   // circular
  badge: 10,
  proIcon: 20,
  sheet: 20,     // bottom sheet top corners
} as const;

export const Shadow = {
  // --shadow-sm
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  // --shadow-md
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  // --shadow-lg
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 5,
  },
  // Burbuja mensaje ajeno
  bubble: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  // Pro icon / servicio
  proIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;
