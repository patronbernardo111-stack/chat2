import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
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
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={showPasswordToggle ? !showPassword : secureTextEntry}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(p => !p)}
            style={styles.eyeButton}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁' : '👁‍🗨'}</Text>
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
  label: {
    ...Typography.fieldLabel,
    color: Colors.textTertiary,
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.inputPaddingV,
    paddingHorizontal: Spacing.inputPaddingH,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 46,
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
