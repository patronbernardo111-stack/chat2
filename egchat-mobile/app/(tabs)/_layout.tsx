import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { Colors } from '../../src/theme';

const Icon = ({ name, color }: { name: string; color: string }) => {
  const icons: Record<string, string> = {
    mensajes: '💬',
    monedero: '💳',
    servicios: '⚡',
    lia: '🤖',
    ajustes: '⚙️',
  };
  return <Text style={{ fontSize: 22 }}>{icons[name] || '●'}</Text>;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgSecondary,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mensajes',
          tabBarIcon: ({ color }) => <Icon name="mensajes" color={color} />,
        }}
      />
      <Tabs.Screen
        name="monedero"
        options={{
          title: 'Monedero',
          tabBarIcon: ({ color }) => <Icon name="monedero" color={color} />,
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color }) => <Icon name="servicios" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lia"
        options={{
          title: 'Lia-25',
          tabBarIcon: ({ color }) => <Icon name="lia" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Icon name="ajustes" color={color} />,
        }}
      />
    </Tabs>
  );
}
