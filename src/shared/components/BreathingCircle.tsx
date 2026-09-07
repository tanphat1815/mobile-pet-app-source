/**
 * BreathingCircle
 *
 * Animated breathing visualization. Renders a circle that scales +
 * fades through inhale / hold / exhale / hold phases.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import type { BreathingPreset } from '../../api/wellness';

export type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'hold2' | 'idle';

export interface BreathingCircleProps {
  preset: BreathingPreset;
  /** Whether the animation is running. */
  active: boolean;
  /** Called when a cycle completes (counts down from preset.cycles). */
  onCycleComplete?: () => void;
  /** Called when all cycles are done. */
  onComplete?: () => void;
  testID?: string;
}

const MIN_SCALE = 1.0;
const MAX_SCALE = 1.6;

export function BreathingCircle({
  preset,
  active,
  onCycleComplete,
  onComplete,
  testID,
}: BreathingCircleProps) {
  const theme = useTheme();
  const scale = useSharedValue(MIN_SCALE);
  const opacity = useSharedValue(0.7);

  const phaseLabel = useMemo(() => preset.label, [preset]);

  useEffect(() => {
    if (!active) {
      cancelAnimation(scale);
      scale.value = withTiming(MIN_SCALE, { duration: 600 });
      opacity.value = withTiming(0.7, { duration: 600 });
      return;
    }

    let cancelled = false;
    let cycleCount = 0;

    const runPhase = (
      toScale: number,
      duration: number,
      phase: BreathPhase,
      callback?: () => void
    ) => {
      if (cancelled) return;
      // The label can't be set on the UI thread, so schedule via runOnJS.
      // For simplicity we just animate; the parent screen renders the
      // label based on the current `phase` shared value.
      scale.value = withTiming(
        toScale,
        { duration: duration * 1000, easing: Easing.inOut(Easing.quad) }
      );
      opacity.value = withTiming(
        toScale === MAX_SCALE ? 1 : 0.55,
        { duration: duration * 1000 }
      );
      setTimeout(() => {
        if (cancelled) return;
        callback?.();
      }, duration * 1000);
    };

    const cycleOnce = () => {
      if (cancelled) return;
      // inhale
      runPhase(MAX_SCALE, preset.inhale, 'inhale', () => {
        // hold1
        if (preset.hold1 > 0) {
          runPhase(MAX_SCALE, preset.hold1, 'hold', () => {
            // exhale
            runPhase(MIN_SCALE, preset.exhale, 'exhale', () => {
              if (preset.hold2 > 0) {
                runPhase(MIN_SCALE, preset.hold2, 'hold2', () => {
                  cycleCount += 1;
                  onCycleComplete?.();
                  if (cycleCount >= preset.cycles) {
                    onComplete?.();
                    return;
                  }
                  cycleOnce();
                });
              } else {
                cycleCount += 1;
                onCycleComplete?.();
                if (cycleCount >= preset.cycles) {
                  onComplete?.();
                  return;
                }
                cycleOnce();
              }
            });
          });
        } else {
          // no hold1 → exhale directly
          runPhase(MIN_SCALE, preset.exhale, 'exhale', () => {
            cycleCount += 1;
            onCycleComplete?.();
            if (cycleCount >= preset.cycles) {
              onComplete?.();
              return;
            }
            cycleOnce();
          });
        }
      });
    };

    cycleOnce();
    return () => {
      cancelled = true;
      cancelAnimation(scale);
    };
  }, [active, preset, scale, opacity, onCycleComplete, onComplete]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.glow,
          { backgroundColor: theme.colors.accent + '15' },
        ]}
      />
      <Animated.View
        testID={testID ?? 'breathing-circle'}
        style={[
          styles.circle,
          {
            backgroundColor: theme.colors.accent + '40',
            borderColor: theme.colors.accent,
          },
          animStyle,
        ]}
      />
      <View style={styles.labelWrap} pointerEvents="none">
        <Text
          testID="breathing-label"
          style={[styles.label, { color: theme.colors.text }]}
        >
          {active ? phaseLabel : 'Tap Start'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  circle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
  },
  labelWrap: {
    position: 'absolute',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
