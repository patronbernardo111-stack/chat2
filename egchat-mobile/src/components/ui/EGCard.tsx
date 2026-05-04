import React, { useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '../../theme';

interface EGCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export const EGCard: React.FC<EGCardProps> = ({
  children,
  style,
  padding = Spacing.cardPadding,
  elevation = 'sm',
  onPress,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50 }).start();
  };

  const onPressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  const cardStyle = [styles.card, Shadow[elevation], { padding }, style];

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
          style={cardStyle}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
