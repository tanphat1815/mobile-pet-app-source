/**
 * useReducedMotionDuration Hook
 *
 * Helper hook that returns a duration value with reduced motion applied.
 * When the user has reduced motion enabled (iOS/Android system setting),
 * all animation durations are clamped to ~1ms to effectively disable motion
 * while still letting the layout/animation logic run.
 *
 * Usage:
 *   const duration = useReducedMotionDuration(theme.duration.base);
 *   withTiming(value, { duration });
 */

import { useReducedMotion } from './useReducedMotion';

export function useReducedMotionDuration(baseDuration: number): number {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? 1 : baseDuration;
}