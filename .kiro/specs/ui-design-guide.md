# EGCHAT UI Design Guide
> Extraído del CSS del proyecto web. Usar como referencia para la migración a React Native.

---

## Paleta de Colores

### Fondos
| Variable | Hex | Uso |
|----------|-----|-----|
| `--bg-primary` | `#F7F8FA` | Fondo general de la app |
| `--bg-secondary` | `#FFFFFF` | Cards, modales, listas |
| `--bg-tertiary` | `#F0F2F5` | Fondo body, separadores |
| `--bg-input` | `#F0F2F5` | Campos de texto |

### Texto
| Variable | Hex | Uso |
|----------|-----|-----|
| `--text-primary` | `#111827` | Texto principal, nombres |
| `--text-secondary` | `#6B7280` | Subtítulos, último mensaje |
| `--text-tertiary` | `#9CA3AF` | Timestamps, labels, estado |
| `--text-link` | `#2563EB` | Links, acciones |

### Acento EGCHAT
| Variable | Hex | Uso |
|----------|-----|-----|
| `--accent` | `#07C160` | Botón primario, check activo |
| `--accent-light` | `#E8F8EE` | Fondo acento suave |
| `--accent-dark` | `#059669` | Hover/pressed del acento |

### Bordes
| Variable | Hex | Uso |
|----------|-----|-----|
| `--border` | `#E5E7EB` | Bordes generales |
| `--border-light` | `#F3F4F6` | Separadores suaves entre items |

### Colores especiales
| Nombre | Hex | Uso |
|--------|-----|-----|
| Burbuja propia | `#95EC69` | Mensajes enviados (verde claro) |
| Burbuja ajena | `#FFFFFF` | Mensajes recibidos (blanco) |
| Badge/Error | `#EF4444` | Notificaciones, errores |
| Neon EG | `#00E5FF` | Logo animado "EG" |
| Neon CHAT | `#1E90FF` | Logo animado "CHAT" |
| Header/Brand | `#00C8A0` | Color de marca principal |

---

## Tipografía

### Familia de fuentes
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif
```
En React Native usar: `System` (SF Pro en iOS, Roboto en Android)

### Escala tipográfica
| Variable | Tamaño | Uso |
|----------|--------|-----|
| `--font-xs` | `11px` | Timestamps, badges |
| `--font-sm` | `12px` | Meta, labels de iconos, hora |
| `--font-base` | `14px` | Texto de mensajes, subtítulos |
| `--font-md` | `15px` | Nombre en chat abierto, inputs |
| `--font-lg` | `16px` | Nombre en lista de chats |
| `--font-xl` | `17px` | Títulos de sección, header |
| `--font-2xl` | `20px` | Títulos grandes |

### Pesos
| Uso | Peso |
|-----|------|
| Texto normal | `400` |
| Subtítulos | `500` |
| Nombres, botones | `600` |
| Títulos, headers | `700` |

### Clases semánticas
| Clase | Tamaño | Peso | Color |
|-------|--------|------|-------|
| `.wa-name` | 16px | 600 | `--text-primary` |
| `.wa-subtitle` | 14px | 400 | `--text-secondary` |
| `.wa-time` | 12px | 400 | `--text-tertiary` |
| `.wa-icon-label` | 12px | 500 | `--text-secondary` |
| `.wa-section-title` | 13px | 600 | `--text-tertiary` |
| `.wa-msg-text` | 14px | 400 | `--text-primary` |
| `.wa-header-title` | 17px | 700 | `--text-primary` |
| `.wa-chat-name` | 15px | 600 | `--text-primary` |
| `.wa-status` | 12px | 400 | `--text-tertiary` |
| `.wa-field-label` | 12px | 400 | `--text-tertiary` |
| `.wa-field-value` | 15px | 400 | `--text-primary` |
| `.wa-action-btn` | 15px | 600 | — |

---

## Espaciados

### Padding estándar
| Elemento | Padding |
|----------|---------|
| Lista item | `12px 16px` |
| Input | `10px 14px` |
| Botón primario | `12px 20px` |
| Sección título | `12px 16px 6px` |
| Chat input bar | `8px 12px` |
| Burbuja mensaje | `8px 12px` |

### Gaps
| Contexto | Gap |
|----------|-----|
| Lista item (avatar + texto) | `12px` |
| Chat input bar (elementos) | `8px` |

### Line height
- General: `1.4`
- Mensajes: `1.45`
- Nombres: `1.3`

---

## Bordes Redondeados

| Variable | Valor | Uso |
|----------|-------|-----|
| `--radius-sm` | `8px` | Elementos pequeños |
| `--radius-md` | `12px` | Inputs, botones |
| `--radius-lg` | `16px` | Cards |
| `--radius-xl` | `20px` | Modales, sheets |
| Burbuja propia | `18px 18px 4px 18px` | Mensaje enviado |
| Burbuja ajena | `18px 18px 18px 4px` | Mensaje recibido |
| Avatar | `50%` | Circular |
| Pro icon | `20px` | Icono de servicio |
| Badge | `10px` | Notificación |
| Bottom sheet | `20px 20px 0 0` | Modal inferior |

---

## Sombras

| Variable | Valor | Uso |
|----------|-------|-----|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)` | Cards sutiles |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.08)` | Cards normales |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.10)` | Modales, elevados |
| Burbuja ajena | `0 1px 2px rgba(0,0,0,0.08)` | Mensaje recibido |
| Pro icon | `0 4px 16px rgba(0,0,0,0.12)` | Iconos de servicio |

---

## Componentes Clave

### Botón Primario
```
background: #07C160
color: #FFFFFF
borderRadius: 12px
padding: 12px 20px
fontSize: 14px
fontWeight: 600
width: 100%
```

### Botón Secundario
```
background: #F0F2F5
color: #6B7280
borderRadius: 12px
padding: 12px 20px
fontSize: 14px
fontWeight: 600
```

### Input
```
background: #F0F2F5
borderRadius: 12px
padding: 10px 14px
fontSize: 15px (mínimo 16px en móvil para evitar zoom iOS)
color: #111827
border: none
```

### Card
```
background: #FFFFFF
borderRadius: 16px
shadow: 0 1px 3px rgba(0,0,0,0.06)
border: 1px solid #F3F4F6
```

### Lista Item
```
padding: 12px 16px
gap: 12px
borderBottom: 1px solid #F3F4F6
background: #FFFFFF
```

### Badge de notificación
```
background: #EF4444
color: #FFFFFF
borderRadius: 10px
padding: 1px 6px
fontSize: 10px
fontWeight: 700
minWidth: 18px
```

### Bottom Sheet / Modal
```
background: #FFFFFF
borderRadius: 20px 20px 0 0
maxHeight: 92vh
animation: slideUp 0.28s
```

### Handle del Sheet
```
width: 36px
height: 4px
background: #E5E7EB
borderRadius: 2px
margin: 10px auto 4px
```

---

## Animaciones

| Nombre | Duración | Easing | Uso |
|--------|----------|--------|-----|
| `slideUp` | 280ms | `cubic-bezier(0.32,0.72,0,1)` | Bottom sheets |
| `fadeIn` | — | ease | Aparición de elementos |
| `pulse` | 2s | ease-in-out | Indicadores de carga |
| `headerBtnPop` | 320ms | `cubic-bezier(0.34,1.56,0.64,1)` | Tap en botones header |
| `radialItemIn` | 350ms | `cubic-bezier(0.34,1.56,0.64,1)` | Menú radial |

---

## Breakpoints Responsive

| Nombre | Ancho | Layout |
|--------|-------|--------|
| Mobile | `< 768px` | Bottom nav, full-screen |
| Tablet | `768–1199px` | Sidebar iconos 72px |
| Desktop | `≥ 1200px` | Sidebar completo 240px |
| XL | `≥ 1600px` | Max-width 1400px |

---

## Safe Areas (para React Native)
```javascript
// Usar SafeAreaView de react-native-safe-area-context
// Header: paddingTop = max(14, insets.top)
// Bottom: paddingBottom = max(16, insets.bottom)
```

---

## Equivalencias React Native

| CSS Web | React Native |
|---------|-------------|
| `border-radius: 12px` | `borderRadius: 12` |
| `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` | `elevation: 3` (Android) / `shadowColor + shadowOffset` (iOS) |
| `backdrop-filter: blur(10px)` | `BlurView` de expo-blur |
| `position: fixed` | `position: 'absolute'` |
| `overflow: hidden` | `overflow: 'hidden'` |
| `display: flex` | `flexDirection: 'column'` (default en RN) |
| `gap: 12px` | `gap: 12` (RN 0.71+) |
