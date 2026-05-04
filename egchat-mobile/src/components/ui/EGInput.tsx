import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Animated,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, FontSize } from '../../theme';

interface EGInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export const EGInput: React.FC<EGInputProps> = ({
  label,
  error,
  containerStyle,
  showPasswordToggle = false,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animación del label flotante
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const animateLabel = (toValue: number) => {
    Animated.timing(labelAnim, {
      toValue,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    animateLabel(1);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!value) animateLabel(0);
    onBlur?.(e);
  };

  // Interpolaciones del label flotante
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [13, -8],
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [FontSize.md, FontSize.sm],
  });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.textTertiary, isFocused ? Colors.accent : Colors.textTertiary],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        {/* Label flotante */}
        {label && (
          <Animated.Text
            style={[
              styles.floatingLabel,
              { top: labelTop, fontSize: labelFontSize, color: labelColor },
            ]}
          >
            {label}
          </Animated.Text>
        )}

        <TextInput
          style={[styles.input, label && styles.inputWithLabel]}
          placeholderTextColor={label ? 'transparent' : Colors.textTertiary}
          secureTextEntry={showPasswordToggle ? !showPassword : secureTextEntry}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(p => !p)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'visible',
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: '#E8F0FE',
  },
  inputError: {
    borderColor: Colors.error,
  },
  floatingLabel: {
    position: 'absolute',
    left: Spacing.inputPaddingH,
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.inputPaddingV,
    paddingHorizontal: Spacing.inputPaddingH,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 46,
  },
  inputWithLabel: {
    paddingTop: 18,
    paddingBottom: 6,
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 16,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.errorText,
    marginTop: 4,
  },
});
