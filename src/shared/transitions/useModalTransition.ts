/**
 * useModalTransition Hook
 *
 * Animates a modal overlay + content pair using Reanimated.
 *
 * - Overlay fades from 0 -> 1 (opacity)
 * - Content scales from 0.9 -> 1.0 with slight translateY up
 *
 * Returns animated styles to spread onto the overlay and content views.
 *
 * Usage:
 *   const { overlayStyle, contentStyle, animateIn, animateOut } = useModalTransition();
 *   useEffect(() => { animateIn(); }, []);
 *   <Animated.View style={overlayStyle}>...</Animated.View>
 *   <Animated.View style={contentStyle}>...</Animated.View>
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';
import { theme as defaultTheme } from '../../utils/theme';

export interface ModalTransitionOptions {
  duration?: number;
  initialScale?: number;
  initialTranslateY?: number;
}

export function useModalTransition(options: ModalTransitionOptions = {}) {
  const {
    duration: durationOption,
    initialScale = 0.9,
    initialTranslateY = 16,
  } = options;

  const baseDuration = durationOption ?? defaultTheme.duration.base;
  const duration = useReducedMotionDuration(baseDuration);

  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(initialScale);
  const contentTranslateY = useSharedValue(initialTranslateY);

  const animateIn = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
    contentScale.value = withSpring(1, {
      damping: defaultTheme.easing.spring.damping,
      stiffness: defaultTheme.easing.spring.stiffness,
      mass: defaultTheme.easing.spring.mass,
    });
    contentTranslateY.value = withTiming(0, { duration, easing: Easing.out(Easing.cubic) });
  }, [overlayOpacity, contentScale, contentTranslateY, duration]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      overlayOpacity.value = withTiming(0, { duration, easing: Easing.in(Easing.cubic) });
      contentScale.value = withTiming(initialScale, { duration, easing: Easing.in(Easing.cubic) });
      contentTranslateY.value = withTiming(
        initialTranslateY,
        { duration, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished && onComplete) onComplete();
        }
      );
    },
    [overlayOpacity, contentScale, contentTranslateY, duration, initialScale, initialTranslateY]
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: contentScale.value },
      { translateY: contentTranslateY.value },
    ],
  }));

  return {
    overlayStyle,
    contentStyle,
    animateIn,
    animateOut,
    progress: { overlayOpacity, contentScale, contentTranslateY },
  };
}