/**
 * Button Component
 *
 * Pill-shaped button with 3 variants: primary, secondary, danger.
 * Press animation: opacity 0.8 + scale 0.98.
 * Loading state: spinner + disabled.
 */

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const duration = useReducedMotionDuration(120);

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0.85, { duration });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const palette = (() => {
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.accent, text: theme.colors.textInverse };
      case 'secondary':
        return { bg: theme.colors.surface2, text: theme.colors.text };
      case 'danger':
        return { bg: theme.colors.danger, text: theme.colors.textInverse };
      case 'ghost':
        return { bg: 'transparent', text: theme.colors.accent };
    }
  })();

  const sizeMap: Record<ButtonSize, { v: number; h: number; font: number; minH: number }> = {
    sm: { v: 8, h: 16, font: theme.typography.size.footnote, minH: 36 },
    md: { v: 12, h: 20, font: theme.typography.size.body, minH: theme.layout.minTapTarget },
    lg: { v: 16, h: 24, font: theme.typography.size.headline, minH: 52 },
  };
  const sz = sizeMap[size];

  const containerStyle: ViewStyle = {
    backgroundColor: palette.bg,
    paddingVertical: sz.v,
    paddingHorizontal: sz.h,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: sz.minH,
    ...(variant === 'secondary' ? theme.shadows.elevation1 : {}),
  };

  const textStyle: TextStyle = {
    color: palette.text,
    fontSize: sz.font,
    fontWeight: theme.typography.weight.semibold,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[styles.touchable, style]}
      testID={testID}
    >
      <Animated.View style={[containerStyle, animatedStyle]}>
        {loading ? (
          <ActivityIndicator color={palette.text} size="small" />
        ) : (
          <Text style={textStyle}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchable: {
    alignSelf: 'stretch',
  },
});