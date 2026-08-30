/**
 * usePanelTransition Hook
 *
 * Animates a panel/bottom-sheet sliding up from the bottom of the screen.
 *
 * Usage:
 *   const { containerStyle, animateIn, animateOut } = usePanelTransition();
 *   useEffect(() => { animateIn(); }, []);
 *   <Animated.View style={containerStyle}>...</Animated.View>
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';
import { theme as defaultTheme } from '../../utils/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface PanelTransitionOptions {
  duration?: number;
  fromY?: number;
}

export function usePanelTransition(options: PanelTransitionOptions = {}) {
  const {
    duration: durationOption,
    fromY = SCREEN_HEIGHT,
  } = options;

  const baseDuration = durationOption ?? defaultTheme.duration.slow;
  const duration = useReducedMotionDuration(baseDuration);

  const translateY = useSharedValue(fromY);

  const animateIn = useCallback(() => {
    translateY.value = withTiming(0, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [translateY, duration]);

  const animateOut = useCallback(
    (onComplete?: () => void) => {
      translateY.value = withTiming(
        fromY,
        { duration, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished && onComplete) onComplete();
        }
      );
    },
    [translateY, duration, fromY]
  );

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return {
    containerStyle,
    animateIn,
    animateOut,
    progress: { translateY },
  };
}