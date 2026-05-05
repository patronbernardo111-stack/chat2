// Input.tsx — Campo de texto reutilizable para EGCHAT Mobile
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label, error, leftIcon, rightIcon, onRightIconPress, style, ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.container,
        focused && styles.containerFocused,
        !!error && styles.containerError,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeft, rightIcon && styles.inputWithRight, style]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.iconRight} onPress={onRightIconPress}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  container: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  containerFocused: { borderColor: '#00c8a0', backgroundColor: '#fff' },
  containerError: { borderColor: '#EF4444' },
  input: { flex: 1, padding: 12, fontSize: 15, color: '#111827' },
  inputWithLeft: { paddingLeft: 4 },
  inputWithRight: { paddingRight: 4 },
  iconLeft: { paddingLeft: 12 },
  iconRight: { paddingRight: 12 },
  error: { fontSize: 12, color: '#EF4444' },
});

export default Input;
