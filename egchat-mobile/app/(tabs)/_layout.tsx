import { Tabs } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Iconos SVG ────────────────────────────────────────────────────
const NavIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  const s = size;
  switch (name) {
    case 'mensajes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </Svg>
      );
    case 'wallet':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="2" y="5" width="20" height="14" rx="2"/>
          <Path d="M16 12h2"/>
          <Path d="M2 10h20"/>
        </Svg>
      );
    case 'services':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1"/>
          <Rect x="14" y="3" width="7" height="7" rx="1"/>
          <Rect x="3" y="14" width="7" height="7" rx="1"/>
          <Rect x="14" y="14" width="7" height="7" rx="1"/>
        </Svg>
      );
    case 'ajustes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3"/>
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
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
          height: Platform.OS === 'ios' ? 80 : 58,
          borderTopWidth: 0,
          elevation: 0,
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
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      {/* Tab 1 — Mensajería */}
      <Tabs.Screen
        name="mensajeria"
        options={{
          title: 'Mensajería',
          tabBarIcon: ({ color }) => <NavIcon name="mensajes" color={color} size={24} />,
        }}
      />

      {/* Tab 2 — Cartera */}
      <Tabs.Screen
        name="monedero"
        options={{
          title: 'Cartera',
          tabBarIcon: ({ color }) => <NavIcon name="wallet" color={color} size={24} />,
        }}
      />

      {/* Tab 3 — Servicios */}
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color }) => <NavIcon name="services" color={color} size={24} />,
        }}
      />

      {/* Tab 4 — Ajustes */}
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <NavIcon name="ajustes" color={color} size={24} />,
        }}
      />

      {/* Pantallas ocultas del tab bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Home Dashboard — accesible tras login, no en tab bar
        }}
      />
      <Tabs.Screen
        name="lia"
        options={{
          href: null, // LIA-25 — accesible desde botón flotante
        }}
      />
    </Tabs>
  );
}
