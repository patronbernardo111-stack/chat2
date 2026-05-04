import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Colors, Typography, BorderRadius, Spacing, Shadow } from '../../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface EGButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const EGButton: React.FC<EGButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.base,
          styles[variant],
          isDisabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? Colors.white : Colors.accent}
            size="small"
          />
        ) : (
          <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.buttonPaddingV,
    paddingHorizontal: Spacing.buttonPaddingH,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  // Variantes
  primary: {
    backgroundColor: Colors.accent,
    ...Shadow.sm,
  },
  secondary: {
    backgroundColor: Colors.bgInput,
  },
  outline: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  // Textos
  text: {
    ...Typography.actionButton,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.textSecondary,
  },
  outlineText: {
    color: Colors.textPrimary,
  },
  ghostText: {
    color: Colors.textSecondary,
  },
  dangerText: {
    color: Colors.errorText,
  },
});
