// ProIcon.tsx — Icono Pro para React Native
import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

interface ProIconProps {
  src?: string;
  label?: string;
  size?: number;
  onPress?: () => void;
  showBadge?: boolean;
}

export const ProIcon: React.FC<ProIconProps> = ({
  src, label, size = 48, onPress, showBadge = false,
}) => {
  const content = (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.label, { fontSize: size * 0.35 }]}>
          {label?.slice(0, 2).toUpperCase() || '⭐'}
        </Text>
      )}
      {showBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'linear-gradient(135deg, #F59E0B, #EF4444)' as any,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    color: '#fff',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#fff',
  },
});

export default ProIcon;
