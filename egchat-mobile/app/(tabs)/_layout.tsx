import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { useThemeContext } from '../../src/theme/ThemeContext';

// ── Iconos SVG idénticos a la versión web ─────────────────────────
const NavIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  const s = size;
  switch (name) {

    // Mensajería — burbuja con líneas de texto (igual que web)
    case 'mensajes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <Line x1="9" y1="10" x2="15" y2="10"/>
          <Line x1="9" y1="14" x2="13" y2="14"/>
        </Svg>
      );

    // Cartera — billetera con punto (igual que web)
    case 'wallet':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>
          <Rect x="16" y="11" width="2" height="2" fill={color} stroke="none"/>
        </Svg>
      );

    // Servicios — 4 cuadrados (igual que web)
    case 'services':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1"/>
          <Rect x="14" y="3" width="7" height="7" rx="1"/>
          <Rect x="14" y="14" width="7" height="7" rx="1"/>
          <Rect x="3" y="14" width="7" height="7" rx="1"/>
        </Svg>
      );

    // Ajustes — engranaje detallado (igual que web)
    case 'ajustes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </Svg>
      );

    default:
      return null;
  }
};

export default function TabsLayout() {
  const { isDark } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 80 : 60,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#00C8A0', '#00B4E6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        ),
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="mensajeria"
        options={{
          title: 'Mensajería',
          tabBarIcon: ({ color }) => <NavIcon name="mensajes" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="monedero"
        options={{
          title: 'Cartera',
          tabBarIcon: ({ color }) => <NavIcon name="wallet" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color }) => <NavIcon name="services" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <NavIcon name="ajustes" color={color} size={24} />,
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="lia"   options={{ href: null }} />
    </Tabs>
  );
}
