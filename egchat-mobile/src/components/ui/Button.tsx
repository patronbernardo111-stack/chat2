// Button.tsx — Botón reutilizable para EGCHAT Mobile
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const VARIANTS = {
  primary: { bg: '#00c8a0', text: '#fff' },
  secondary: { bg: '#F3F4F6', text: '#374151' },
  danger: { bg: '#EF4444', text: '#fff' },
  ghost: { bg: 'transparent', text: '#00c8a0' },
};

const SIZES = {
  sm: { padding: 8, fontSize: 13, borderRadius: 10 },
  md: { padding: 13, fontSize: 15, borderRadius: 12 },
  lg: { padding: 16, fontSize: 16, borderRadius: 14 },
};

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, style, textStyle, icon,
}) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: disabled ? '#E5E7EB' : v.bg, padding: s.padding, borderRadius: s.borderRadius },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={disabled ? '#9CA3AF' : v.text} />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text,
            { fontSize: s.fontSize, color: disabled ? '#9CA3AF' : v.text },
            textStyle,
          ]}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, width: '100%',
  },
  ghost: { borderWidth: 1.5, borderColor: '#00c8a0' },
  text: { fontWeight: '700' },
});

export default Button;
