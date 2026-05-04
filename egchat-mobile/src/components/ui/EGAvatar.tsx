import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors, FontWeight } from '../../theme';

interface EGAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
}

export const EGAvatar: React.FC<EGAvatarProps> = ({ src, name, size = 48 }) => {
  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('') || '?';

  const fontSize = size * 0.35;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.bgTertiary,
  },
  placeholder: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
});
