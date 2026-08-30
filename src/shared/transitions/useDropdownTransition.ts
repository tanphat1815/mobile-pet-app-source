/**
 * useDropdownTransition Hook
 *
 * Animates a dropdown menu with fade + scale + slide.
 *
 * Usage:
 *   const { containerStyle, animateIn, animateOut } = useDropdownTransition();
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';
import { theme as defaultTheme } from '../../utils/theme';

export interface DropdownTransitionOptions {
  duration?: number;
  initialOpacity?: number;
  initialScale?: number;
  initialTranslateY?: number;
}

export function useDropdownTransition(options: DropdownTransitionOptions = {}) {
  const {
    duration: durationOption,
    initialOpacity = 0,
    initialScale = 0.95,
    initialTranslateY = -8,
  } = options;

  const baseDuration = durationOption ?? defaultTheme.duration.fast;
  const duration = useReducedMotionDuration(baseDuration);

  const opacity = useSharedValue(initialOpacity);
  const scale = useSharedValue(initialScale);
  const translateY = useSharedValue(initialTranslateY);

  const animateIn = useCallback(() => {
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
  }, [opacity, scale, translateY, duration]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      opacity.value = withTiming(initialOpacity, { duration, easing: Easing.in(Easing.cubic) });
      scale.value = withTiming(initialScale, { duration, easing: Easing.in(Easing.cubic) });
      translateY.value = withTiming(
        initialTranslateY,
        { duration, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished && onComplete) onComplete();
        }
      );
    },
    [opacity, scale, translateY, duration, initialOpacity, initialScale, initialTranslateY]
  );

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return {
    containerStyle,
    animateIn,
    animateOut,
    progress: { opacity, scale, translateY },
  };
}