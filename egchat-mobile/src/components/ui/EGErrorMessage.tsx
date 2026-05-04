import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, BorderRadius, Spacing } from '../../theme';

interface EGErrorMessageProps {
  text: string;
}

export const EGErrorMessage: React.FC<EGErrorMessageProps> = ({ text }) => (
  <View style={styles.container}>
    <Text style={styles.text}>⚠️ {text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.errorBg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  text: {
    color: Colors.errorText,
    fontSize: FontSize.sm,
  },
});
