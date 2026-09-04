/**
 * PomodoroScreen
 *
 * Wraps the PomodoroTimer component with a session-recording layer.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useWellnessStore } from '../../stores/WellnessStore';
import { PomodoroTimer, PomodoroPhase } from '../../shared/components/PomodoroTimer';
import { DEFAULT_POMODORO } from '../../api/wellness';
import { hapticSuccess } from '../../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'Pomodoro'>;

export function PomodoroScreen({ navigation }: Props) {
  const theme = useTheme();
  const startSession = useWellnessStore((s) => s.startSession);
  const endSession = useWellnessStore((s) => s.endSession);
  const config = useWellnessStore((s) => s.pomodoroConfig);
  const sessionRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const [completedPhases, setCompletedPhases] = useState(0);

  const handlePhaseComplete = useCallback(
    (phase: PomodoroPhase, _cycleIndex: number) => {
      hapticSuccess();
      setCompletedPhases((n) => n + 1);
    },
    []
  );

  const handleSessionComplete = useCallback(() => {
    if (sessionRef.current) {
      const elapsedSec = Math.round(
        (Date.now() - startedAtRef.current) / 1000
      );
      endSession(sessionRef.current, elapsedSec);
      sessionRef.current = null;
    }
  }, [endSession]);

  // Start a pomodoro session when the timer mounts and user clicks Start.
  // We piggy-back on PomodoroTimer's 'idle' → 'focus' transition: the
  // moment the timer becomes non-idle, we create a session. To detect
  // this without forking the timer, we listen via the 'start' event by
  // wrapping onPhaseComplete (the first call is when 'focus' ends).
  // Simpler approach: start the session on the first phase completion.
  const onPhaseCompleteWrapped = useCallback(
    (phase: PomodoroPhase, cycleIndex: number) => {
      if (!sessionRef.current) {
        const s = startSession('pomodoro', `cycle-${cycleIndex + 1}`);
        sessionRef.current = s.id;
        startedAtRef.current = Date.now();
      }
      handlePhaseComplete(phase, cycleIndex);
    },
    [handlePhaseComplete, startSession]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title2,
            fontWeight: '700',
          }}
        >
          Pomodoro
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 2,
          }}
        >
          {config.focusMin}m focus · {config.shortBreakMin}m break · long {config.longBreakMin}m every {config.cyclesBeforeLongBreak}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        <PomodoroTimer
          config={config}
          onPhaseComplete={onPhaseCompleteWrapped}
          onSessionComplete={handleSessionComplete}
        />

        <View style={{ height: 16 }} />

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.separator,
            },
          ]}
          testID="pomodoro-completed"
        >
          <Text style={[styles.statNum, { color: theme.colors.text }]}>
            {completedPhases}
          </Text>
          <Text
            style={[
              styles.statLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            phases completed this session
          </Text>
        </View>

        <View style={{ height: 16 }} />

        <Pressable
          testID="pomodoro-back"
          onPress={() => {
            if (sessionRef.current) {
              const elapsedSec = Math.round(
                (Date.now() - startedAtRef.current) / 1000
              );
              endSession(sessionRef.current, elapsedSec);
              sessionRef.current = null;
            }
            navigation.goBack();
          }}
          style={styles.linkBtn}
        >
          <Text style={{ color: theme.colors.textSecondary }}>Back to Wellness</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  statCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  linkBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
