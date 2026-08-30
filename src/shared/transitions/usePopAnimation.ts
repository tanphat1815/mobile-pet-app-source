/**
 * usePopAnimation Hook
 *
 * One-shot "pop" animation: scale 0 -> 1.1 -> 1 with spring physics.
 * Perfect for badges, success indicators, toast notifications.
 *
 * Usage:
 *   const { containerStyle, trigger } = usePopAnimation();
 *   useEffect(() => { trigger(); }, []);
 *   <Animated.View style={containerStyle}>...</Animated.View>
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme as defaultTheme } from '../../utils/theme';

export interface PopAnimationOptions {
  overshootScale?: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export function usePopAnimation(options: PopAnimationOptions = {}) {
  const {
    overshootScale = 1.1,
    damping = defaultTheme.easing.spring.damping,
    stiffness = defaultTheme.easing.spring.stiffness,
    mass = defaultTheme.easing.spring.mass,
  } = options;

  const scale = useSharedValue(0);

  const trigger = useCallback(() => {
    scale.value = withSpring(1, {
      damping,
      stiffness,
      mass,
    });
  }, [scale, damping, stiffness, mass]);

  const reset = useCallback(() => {
    scale.value = withSpring(overshootScale, { damping, stiffness, mass });
    scale.value = withSpring(1, { damping, stiffness, mass });
  }, [scale, overshootScale, damping, stiffness, mass]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    containerStyle,
    trigger,
    reset,
    progress: { scale },
  };
}