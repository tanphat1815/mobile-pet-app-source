/**
 * MeditationScreen
 *
 * Timer-driven meditation. User picks a duration preset (5/10/15/20/30
 * min), starts the session, and watches a count-down. Auto-ends and
 * records a WellnessSession in the store.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useWellnessStore } from '../../stores/WellnessStore';
import { MEDITATION_PRESETS, formatTime } from '../../api/wellness';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'Meditation'>;

export function MeditationScreen({ navigation }: Props) {
  const theme = useTheme();
  const startSession = useWellnessStore((s) => s.startSession);
  const endSession = useWellnessStore((s) => s.endSession);

  const [selectedPreset, setSelectedPreset] = useState(
    MEDITATION_PRESETS[1] // default 10min
  );
  const [running, setRunning] = useState(false);
  const [remainingSec, setRemainingSec] = useState(selectedPreset.durationMin * 60);
  const sessionRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  // Reset when preset changes
  useEffect(() => {
    if (!running) setRemainingSec(selectedPreset.durationMin * 60);
  }, [selectedPreset, running]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // If we navigated away while running, finalize the session
      if (running && sessionRef.current) {
        const elapsedSec = Math.round(
          (Date.now() - startedAtRef.current) / 1000
        );
        endSession(sessionRef.current, elapsedSec);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = useCallback(() => {
    hapticSuccess();
    const session = startSession('meditation', selectedPreset.id);
    sessionRef.current = session.id;
    startedAtRef.current = Date.now();
    setRemainingSec(selectedPreset.durationMin * 60);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          setRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (sessionRef.current) {
            endSession(sessionRef.current, selectedPreset.durationMin * 60);
            sessionRef.current = null;
          }
          hapticSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [selectedPreset, startSession, endSession]);

  const stop = useCallback(() => {
    hapticLight();
    setRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sessionRef.current) {
      const elapsedSec = Math.round(
        (Date.now() - startedAtRef.current) / 1000
      );
      endSession(sessionRef.current, elapsedSec);
      sessionRef.current = null;
    }
  }, [endSession]);

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
          Meditation
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        {/* Timer */}
        <View
          style={[
            styles.timerCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.separator,
            },
          ]}
          testID="meditation-timer"
        >
          <Text
            testID="meditation-timer-display"
            style={[styles.timerText, { color: theme.colors.text }]}
          >
            {formatTime(remainingSec)}
          </Text>
          <Text
            style={[
              styles.timerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {running ? 'In session' : 'Tap Start'}
          </Text>
        </View>

        <View style={{ height: 16 }} />

        {/* Preset picker */}
        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          DURATION
        </Text>
        <View style={styles.presetGrid}>
          {MEDITATION_PRESETS.map((p) => {
            const active = p.id === selectedPreset.id;
            return (
              <Pressable
                key={p.id}
                testID={`meditation-preset-${p.id}`}
                disabled={running}
                onPress={() => setSelectedPreset(p)}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: active
                      ? theme.colors.accent + '20'
                      : theme.colors.surface,
                    borderColor: active
                      ? theme.colors.accent
                      : theme.colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    {
                      color: active ? theme.colors.accent : theme.colors.text,
                    },
                  ]}
                >
                  {p.label}
                </Text>
                <Text
                  style={[
                    styles.presetDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {p.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 24 }} />

        {/* Controls */}
        {running ? (
          <Pressable
            testID="meditation-stop"
            onPress={stop}
            style={[styles.button, { backgroundColor: theme.colors.warning }]}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="meditation-start"
            onPress={start}
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        )}

        <View style={{ height: 16 }} />

        <Pressable
          testID="meditation-back"
          onPress={() => navigation.goBack()}
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
  timerCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  timerSubtitle: {
    fontSize: 13,
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    alignItems: 'center',
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  presetDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  linkBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
