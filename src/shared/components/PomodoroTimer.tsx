/**
 * PomodoroTimer
 *
 * Countdown UI for Pomodoro sessions. Tracks focus / break cycles,
 * auto-cycles when phase ends, and notifies the parent via callback.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import {
  PomodoroConfig,
  DEFAULT_POMODORO,
  formatTime,
} from '../../api/wellness';
import { hapticSuccess } from '../../utils/haptics';

export type PomodoroPhase = 'focus' | 'short-break' | 'long-break' | 'idle';

export interface PomodoroTimerProps {
  config?: PomodoroConfig;
  /** Called when a phase ends. */
  onPhaseComplete?: (phase: PomodoroPhase, cycleIndex: number) => void;
  /** Called when a full session ends (after longBreak). */
  onSessionComplete?: () => void;
  testID?: string;
}

export function PomodoroTimer({
  config = DEFAULT_POMODORO,
  onPhaseComplete,
  onSessionComplete,
  testID,
}: PomodoroTimerProps) {
  const theme = useTheme();
  const [phase, setPhase] = useState<PomodoroPhase>('idle');
  const [running, setRunning] = useState(false);
  const [remainingSec, setRemainingSec] = useState(config.focusMin * 60);
  const [cycleIndex, setCycleIndex] = useState(0); // 0..config.cyclesBeforeLongBreak-1
  const progress = useSharedValue(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseDurationSec = useCallback(
    (p: PomodoroPhase): number => {
      switch (p) {
        case 'focus':
          return config.focusMin * 60;
        case 'short-break':
          return config.shortBreakMin * 60;
        case 'long-break':
          return config.longBreakMin * 60;
        default:
          return config.focusMin * 60;
      }
    },
    [config]
  );

  // Start next phase (called by Run button or auto-cycle)
  const startPhase = useCallback(
    (next: PomodoroPhase, idx: number) => {
      setPhase(next);
      setCycleIndex(idx);
      setRemainingSec(phaseDurationSec(next));
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: phaseDurationSec(next) * 1000,
        easing: Easing.linear,
      });
    },
    [phaseDurationSec, progress]
  );

  // Tick the timer
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          // Phase complete — schedule next on next tick to avoid race
          setTimeout(() => {
            if (phase === 'focus') {
              const nextCycle = cycleIndex + 1;
              if (nextCycle >= config.cyclesBeforeLongBreak) {
                onPhaseComplete?.('focus', cycleIndex);
                startPhase('long-break', cycleIndex);
              } else {
                onPhaseComplete?.('focus', cycleIndex);
                startPhase('short-break', cycleIndex);
              }
            } else {
              // Break complete
              onPhaseComplete?.(phase, cycleIndex);
              const nextCycle =
                phase === 'long-break' ? 0 : cycleIndex + 1;
              if (phase === 'long-break') {
                onSessionComplete?.();
              }
              startPhase('focus', nextCycle);
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, cycleIndex, config, onPhaseComplete, onSessionComplete, startPhase]);

  const handleStart = () => {
    if (phase === 'idle') {
      hapticSuccess();
      startPhase('focus', 0);
    }
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setPhase('idle');
    setCycleIndex(0);
    setRemainingSec(config.focusMin * 60);
    progress.value = 0;
  };

  const phaseLabel =
    phase === 'idle'
      ? 'Ready'
      : phase === 'focus'
      ? `Focus · cycle ${cycleIndex + 1}/${config.cyclesBeforeLongBreak}`
      : phase === 'short-break'
      ? 'Short break'
      : 'Long break';

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      testID={testID ?? 'pomodoro-timer'}
      style={[styles.root, { backgroundColor: theme.colors.surface, borderColor: theme.colors.separator }]}
    >
      <Text
        style={[styles.phaseLabel, { color: theme.colors.textSecondary }]}
        testID="pomodoro-phase-label"
      >
        {phaseLabel}
      </Text>
      <Text
        style={[styles.timer, { color: theme.colors.text }]}
        testID="pomodoro-timer-display"
      >
        {formatTime(remainingSec)}
      </Text>

      {/* Progress bar */}
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.surfaceMuted },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            { backgroundColor: theme.colors.accent },
            progressBarStyle,
          ]}
        />
      </View>

      <View style={styles.controls}>
        {running ? (
          <Pressable
            testID="pomodoro-pause"
            onPress={handlePause}
            style={[styles.button, { backgroundColor: theme.colors.warning }]}
          >
            <Text style={styles.buttonText}>Pause</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="pomodoro-start"
            onPress={handleStart}
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={styles.buttonText}>{phase === 'idle' ? 'Start' : 'Resume'}</Text>
          </Pressable>
        )}
        <Pressable
          testID="pomodoro-reset"
          onPress={handleReset}
          style={[styles.button, { backgroundColor: theme.colors.surfaceMuted }]}
        >
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  timer: {
    fontSize: 64,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
