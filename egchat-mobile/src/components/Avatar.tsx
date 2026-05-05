// Avatar.tsx — Componente de avatar para React Native
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const PALETTES = [
  ['#00c8a0', '#00b4e6'],
  ['#6B5BD6', '#8B5CF6'],
  ['#F59E0B', '#EF4444'],
  ['#EC4899', '#F43F5E'],
  ['#0EA5E9', '#6366F1'],
  ['#10B981', '#059669'],
  ['#F97316', '#EF4444'],
  ['#8B5CF6', '#EC4899'],
  ['#06B6D4', '#0EA5E9'],
  ['#84CC16', '#22C55E'],
  ['#F59E0B', '#84CC16'],
  ['#EF4444', '#F97316'],
];

export const nameToColor = (name: string): { from: string; to: string } => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const [from, to] = PALETTES[Math.abs(hash) % PALETTES.length];
  return { from, to };
};

export const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface AvatarProps {
  name: string;
  size?: number;
  photo?: string;
  status?: 'online' | 'offline' | 'away';
  showStatus?: boolean;
  style?: object;
}

export const Avatar: React.FC<AvatarProps> = ({
  name, size = 40, photo, status, showStatus = false, style
}) => {
  const { from } = nameToColor(name);
  const initials = getInitials(name);
  const fontSize = Math.max(10, Math.round(size * 0.35));
  const statusSize = Math.max(8, Math.round(size * 0.22));
  const statusColor = status === 'online' ? '#22c55e' : status === 'away' ? '#f59e0b' : '#9CA3AF';

  return (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      {photo ? (
        <Image
          source={{ uri: photo }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: from }]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
      {showStatus && status && (
        <View style={[
          styles.status,
          {
            width: statusSize,
            height: statusSize,
            borderRadius: statusSize / 2,
            backgroundColor: statusColor,
            bottom: 0,
            right: 0,
            borderWidth: Math.max(1, statusSize * 0.2),
          }
        ]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
  status: {
    position: 'absolute',
    borderColor: '#fff',
  },
});

export default Avatar;
