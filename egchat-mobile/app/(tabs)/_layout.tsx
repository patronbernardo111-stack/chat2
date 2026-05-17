import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon } from 'react-native-svg';
import { Colors } from '../../src/theme';
import { useThemeContext } from '../../src/theme/ThemeContext';
import { DarkColors } from '../../src/theme/darkMode';

// ── Iconos SVG idénticos a la web ────────────────────────────────
const NavIcon = ({ name, color, size = 26 }: { name: string; color: string; size?: number }) => {
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
          <Circle cx="12" cy="12" r="3"/>
          <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          <Path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
        </Svg>
      );
    case 'ajustes':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="3"/>
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </Svg>
      );
    case 'lia':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 2a10 10 0 1 0 10 10"/>
          <Path d="M12 8v4l3 3"/>
          <Circle cx="18" cy="5" r="3"/>
        </Svg>
      );
    default:
      return null;
  }
};

// ── Tab bar con gradiente idéntico a la web ───────────────────────
const GradientTabBar = ({ state, descriptors, navigation }: any) => {
  const navItems = [
    { name: 'index',    icon: 'mensajes', label: 'Mensajería' },
    { name: 'monedero', icon: 'wallet',   label: 'Cartera'    },
    { name: 'servicios',icon: 'services', label: 'Servicios'  },
    { name: 'lia',      icon: 'lia',      label: 'Lia-25'     },
    { name: 'ajustes',  icon: 'ajustes',  label: 'Ajustes'    },
  ];

  return (
    <LinearGradient
      colors={['#00C8A0', '#00B4E6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: 6,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        minHeight: 49,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255,255,255,0.25)',
      }}
    >
      {navItems.map((item, index) => {
        const route = state.routes[index];
        const isFocused = state.index === index;
        const iconColor = isFocused ? '#ffffff' : 'rgba(255,255,255,0.65)';
        const labelColor = isFocused ? '#ffffff' : 'rgba(255,255,255,0.65)';
        const fontWeight = isFocused ? '600' : '400';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <View
            key={item.name}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
            onTouchEnd={onPress}
            accessible
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <NavIcon name={item.icon} color={iconColor} size={26} />
            <View>
              {/* Label */}
              <View>
                {/* Using Text via import below */}
              </View>
            </View>
          </View>
        );
      })}
    </LinearGradient>
  );
};

export default function TabsLayout() {
  const { isDark } = useThemeContext();
  const C = isDark ? DarkColors as unknown as typeof Colors : Colors;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.brand,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 6,
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
        tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mensajería',
          tabBarIcon: ({ color }) => <NavIcon name="mensajes" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="monedero"
        options={{
          title: 'Cartera',
          tabBarIcon: ({ color }) => <NavIcon name="wallet" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color }) => <NavIcon name="services" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="lia"
        options={{
          title: 'Lia-25',
          tabBarIcon: ({ color }) => <NavIcon name="lia" color={color} size={26} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <NavIcon name="ajustes" color={color} size={26} />,
        }}
      />
    </Tabs>
  );
}
