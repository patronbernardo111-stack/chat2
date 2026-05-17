/**
 * ServiceIcon — Iconos SVG idénticos a la versión web de EGCHAT
 * Todos los paths son los mismos que renderIcon() en App.tsx (web)
 */
import React from 'react';
import Svg, {
  Path, Circle, Line, Polyline, Polygon, Rect, Ellipse,
} from 'react-native-svg';

interface Props {
  name: string;
  size?: number;
  color?: string;
}

export const ServiceIcon = ({ name, size = 28, color = '#374151' }: Props) => {
  const props = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {

    // ── Básicos ──────────────────────────────────────────────────
    case 'recharge':
      return (
        <Svg {...props}>
          <Rect x="5" y="2" width="14" height="20" rx="2" />
          <Path d="M9 7h6" />
          <Path d="M9 11h4" />
          <Path d="M15 14l2-2-2-2" />
          <Circle cx="12" cy="18" r="0.5" fill={color} stroke="none" />
        </Svg>
      );

    case 'world':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="2" y1="12" x2="22" y2="12" />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </Svg>
      );

    case 'services':
      return (
        <Svg {...props}>
          <Rect x="3" y="3" width="7" height="7" rx="1" />
          <Rect x="14" y="3" width="7" height="7" rx="1" />
          <Rect x="14" y="14" width="7" height="7" rx="1" />
          <Rect x="3" y="14" width="7" height="7" rx="1" />
        </Svg>
      );

    // ── Financieros ──────────────────────────────────────────────
    case 'banking':
      return (
        <Svg {...props}>
          <Path d="M3 21h18" />
          <Path d="M3 10h18" />
          <Path d="M5 6l7-3 7 3" />
          <Path d="M4 10v11" />
          <Path d="M20 10v11" />
          <Path d="M8 14v3" />
          <Path d="M12 14v3" />
          <Path d="M16 14v3" />
        </Svg>
      );

    case 'seguros':
      return (
        <Svg {...props}>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <Polyline points="9 12 11 14 15 10" />
        </Svg>
      );

    case 'factura':
      return (
        <Svg {...props}>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Polyline points="14 2 14 8 20 8" />
          <Line x1="16" y1="13" x2="8" y2="13" />
          <Line x1="16" y1="17" x2="8" y2="17" />
          <Polyline points="10 9 9 9 8 9" />
        </Svg>
      );

    case 'invest':
      return (
        <Svg {...props}>
          <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <Polyline points="16 7 22 7 22 13" />
        </Svg>
      );

    case 'tarjeta':
      return (
        <Svg {...props}>
          <Rect x="1" y="4" width="22" height="16" rx="2" />
          <Line x1="1" y1="10" x2="23" y2="10" />
          <Line x1="5" y1="15" x2="9" y2="15" />
          <Line x1="12" y1="15" x2="14" y2="15" />
        </Svg>
      );

    case 'historial':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" />
          <Polyline points="12 6 12 12 16 14" />
        </Svg>
      );

    // ── Servicios Públicos ───────────────────────────────────────
    case 'electricidad':
      return (
        <Svg {...props}>
          <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </Svg>
      );

    case 'rain':
      return (
        <Svg {...props} strokeWidth={2}>
          <Path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0C19 10 12 2 12 2z" />
        </Svg>
      );

    case 'salud':
      return (
        <Svg {...props}>
          <Path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 0 1 2-2h3" />
          <Path d="M19 3H9a2 2 0 0 0-2 2v3h14V5a2 2 0 0 0-2-2z" />
          <Line x1="14" y1="11" x2="14" y2="17" />
          <Line x1="11" y1="14" x2="17" y2="14" />
        </Svg>
      );

    case 'edu':
      return (
        <Svg {...props}>
          <Path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" />
          <Path d="M6 12v5c3 3 9 3 12 0v-5" />
        </Svg>
      );

    case 'mensajes':
      return (
        <Svg {...props}>
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <Line x1="9" y1="10" x2="15" y2="10" />
          <Line x1="9" y1="14" x2="13" y2="14" />
        </Svg>
      );

    case 'gobierno':
      return (
        <Svg {...props}>
          <Path d="M2 20h20" />
          <Path d="M4 20V10" />
          <Path d="M20 20V10" />
          <Path d="M12 4v16" />
          <Path d="M12 4l-8 6h16l-8-6z" />
          <Path d="M8 14v3" />
          <Path d="M16 14v3" />
        </Svg>
      );

    // ── Servicios Diarios ────────────────────────────────────────
    case 'comercio':
      return (
        <Svg {...props}>
          <Path d="M3 9l1-6h16l1 6" />
          <Path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
          <Path d="M5 11v9h14v-9" />
          <Path d="M9 21v-6h6v6" />
        </Svg>
      );

    case 'money':
      return (
        <Svg {...props}>
          <Line x1="12" y1="1" x2="12" y2="23" />
          <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </Svg>
      );

    case 'restaurante':
      return (
        <Svg {...props}>
          <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <Line x1="6" y1="1" x2="6" y2="4" />
          <Line x1="10" y1="1" x2="10" y2="4" />
          <Line x1="14" y1="1" x2="14" y2="4" />
        </Svg>
      );

    case 'hotel':
      return (
        <Svg {...props}>
          <Path d="M3 22V12h18v10" />
          <Path d="M3 12V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
          <Path d="M11 12V7" />
          <Path d="M7 22v-4h10v4" />
        </Svg>
      );

    case 'vuelos':
      return (
        <Svg {...props}>
          <Path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19 4c-2 0-4 2-4 2L7 7.2l-1.5 1.5 5.5 2-2 3.5-3-1-1 1 2.5 2.5 2.5 2.5 1-1-1-3 3.5-2 2 5.5z" />
        </Svg>
      );

    case 'gasolinera':
      return (
        <Svg {...props}>
          <Path d="M3 22V8l9-6 9 6v14" />
          <Path d="M9 22V12h6v10" />
          <Path d="M19 8h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2" />
        </Svg>
      );

    case 'tienda':
      return (
        <Svg {...props}>
          <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <Line x1="3" y1="6" x2="21" y2="6" />
          <Path d="M16 10a4 4 0 0 1-8 0" />
        </Svg>
      );

    case 'lavanderia':
      return (
        <Svg {...props}>
          <Rect x="2" y="2" width="20" height="20" rx="2" />
          <Circle cx="12" cy="13" r="5" />
          <Circle cx="12" cy="13" r="2" />
          <Line x1="6" y1="6" x2="6.01" y2="6" />
          <Line x1="9" y1="6" x2="9.01" y2="6" />
        </Svg>
      );

    case 'belleza':
      return (
        <Svg {...props}>
          <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </Svg>
      );

    case 'noticias':
      return (
        <Svg {...props}>
          <Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <Line x1="18" y1="9" x2="10" y2="9" />
          <Line x1="18" y1="13" x2="10" y2="13" />
          <Line x1="14" y1="17" x2="10" y2="17" />
        </Svg>
      );

    // ── Herramientas ─────────────────────────────────────────────
    case 'id-card':
      return (
        <Svg {...props}>
          <Rect x="3" y="4" width="18" height="16" rx="2" />
          <Circle cx="9" cy="10" r="2" />
          <Path d="M7 18v-2a2 2 0 0 1 4 0v2" />
          <Line x1="14" y1="8" x2="18" y2="8" />
          <Line x1="14" y1="12" x2="18" y2="12" />
        </Svg>
      );

    case 'ai':
      return (
        <Svg {...props}>
          <Rect x="3" y="6" width="18" height="13" rx="3" />
          <Path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <Circle cx="8.5" cy="12.5" r="1.5" />
          <Circle cx="15.5" cy="12.5" r="1.5" />
          <Path d="M9 16c.83.63 1.94 1 3 1s2.17-.37 3-1" />
          <Line x1="12" y1="3" x2="12" y2="6" />
        </Svg>
      );

    case 'emergencia':
      return (
        <Svg {...props}>
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <Line x1="12" y1="9" x2="12" y2="13" />
          <Line x1="12" y1="17" x2="12.01" y2="17" />
        </Svg>
      );

    case 'ajustes':
      return (
        <Svg {...props}>
          <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </Svg>
      );

    // ── Fallback ─────────────────────────────────────────────────
    default:
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="8" x2="12" y2="12" />
          <Line x1="12" y1="16" x2="12.01" y2="16" />
        </Svg>
      );
  }
};
