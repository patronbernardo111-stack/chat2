import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '../../theme';

interface EGCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: 'sm' | 'md' | 'lg';
}

export const EGCard: React.FC<EGCardProps> = ({
  children,
  style,
  padding = Spacing.cardPadding,
  elevation = 'sm',
}) => (
  <View style={[styles.card, Shadow[elevation], { padding }, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
