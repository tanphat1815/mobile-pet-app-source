/**
 * useAvatarHover Hook
 *
 * Returns animated style + handlers for press-in scale + press-out spring-back.
 * Designed for circular avatars, buttons, tappable rows.
 *
 * Usage:
 *   const { animatedStyle, onPressIn, onPressOut } = useAvatarHover();
 *   <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
 *     <Animated.View style={animatedStyle}>...</Animated.View>
 *   </Pressable>
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';
import { theme as defaultTheme } from '../../utils/theme';

export interface AvatarHoverOptions {
  pressedScale?: number;
  duration?: number;
}

export function useAvatarHover(options: AvatarHoverOptions = {}) {
  const {
    pressedScale = 0.92,
    duration: durationOption,
  } = options;

  const baseDuration = durationOption ?? defaultTheme.duration.fast;
  const duration = useReducedMotionDuration(baseDuration);

  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withTiming(pressedScale, { duration });
  }, [scale, pressedScale, duration]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: defaultTheme.easing.spring.damping,
      stiffness: defaultTheme.easing.spring.stiffness,
      mass: defaultTheme.easing.spring.mass,
    });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
    progress: { scale },
  };
}