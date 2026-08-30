/**
 * useInputShake Hook
 *
 * Shake animation for input fields that display errors.
 * 4 left/right oscillations, ~400ms total.
 *
 * Usage:
 *   const { animatedStyle, shake } = useInputShake();
 *   if (error) shake();
 *   <Animated.View style={animatedStyle}>
 *     <TextInput ... />
 *   </Animated.View>
 */

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotionDuration } from '../../utils/useReducedMotionDuration';

const SHAKE_AMPLITUDE = 8;
const SHAKE_OSCILLATIONS = 4;
const BASE_DURATION = 60;

export function useInputShake() {
  const offsetX = useSharedValue(0);
  const duration = useReducedMotionDuration(BASE_DURATION);

  const shake = useCallback(() => {
    const steps = Array.from({ length: SHAKE_OSCILLATIONS * 2 }, (_, i) =>
      i % 2 === 0 ? SHAKE_AMPLITUDE : -SHAKE_AMPLITUDE
    );
    offsetX.value = withSequence(
      ...steps.map((v) => withTiming(v, { duration })),
      withTiming(0, { duration })
    );
  }, [offsetX, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  return {
    animatedStyle,
    shake,
    progress: { offsetX },
  };
}