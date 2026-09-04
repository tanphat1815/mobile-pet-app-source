/**
 * BreathingScreen
 *
 * Pick a breathing preset (4-7-8, box, alternate nostril, energizing)
 * then run a BreathingCircle animation that cycles through inhale/hold/
 * exhale phases. Auto-records a WellnessSession when complete.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useWellnessStore } from '../../stores/WellnessStore';
import { BreathingCircle } from '../../shared/components/BreathingCircle';
import {
  BREATHING_PRESETS,
  BreathingPreset,
  formatTime,
} from '../../api/wellness';
import { hapticSuccess } from '../../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'Breathing'>;

export function BreathingScreen({ navigation }: Props) {
  const theme = useTheme();
  const startSession = useWellnessStore((s) => s.startSession);
  const endSession = useWellnessStore((s) => s.endSession);
  const [selectedPreset, setSelectedPreset] = useState<BreathingPreset>(
    BREATHING_PRESETS[0]
  );
  const [active, setActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const sessionRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        const elapsedSec = Math.round(
          (Date.now() - startedAtRef.current) / 1000
        );
        endSession(sessionRef.current, elapsedSec);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSec =
    (selectedPreset.inhale + selectedPreset.hold1 +
      selectedPreset.exhale + selectedPreset.hold2) * selectedPreset.cycles;

  const handleStart = useCallback(() => {
    hapticSuccess();
    const session = startSession('breathing', selectedPreset.id);
    sessionRef.current = session.id;
    startedAtRef.current = Date.now();
    setCycleCount(0);
    setActive(true);
  }, [selectedPreset, startSession]);

  const handleCycleComplete = useCallback(() => {
    setCycleCount((c) => c + 1);
  }, []);

  const handleComplete = useCallback(() => {
    setActive(false);
    if (sessionRef.current) {
      endSession(sessionRef.current, totalSec);
      sessionRef.current = null;
    }
  }, [totalSec, endSession]);

  const handleStop = useCallback(() => {
    setActive(false);
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
          Breathing
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
          alignItems: 'center',
        }}
      >
        <BreathingCircle
          preset={selectedPreset}
          active={active}
          onCycleComplete={handleCycleComplete}
          onComplete={handleComplete}
        />

        <View style={{ height: 16 }} />
        <Text
          testID="breathing-cycle-count"
          style={[
            styles.cycleText,
            { color: theme.colors.textSecondary },
          ]}
        >
          {active
            ? `Cycle ${cycleCount} / ${selectedPreset.cycles} · ${formatTime(totalSec)}`
            : `${selectedPreset.cycles} cycles · ${formatTime(totalSec)}`}
        </Text>

        <View style={{ height: 16 }} />

        <Text
          style={[
            styles.sectionLabel,
            { color: theme.colors.textSecondary },
          ]}
        >
          PRESET
        </Text>
        <View style={styles.presetGrid}>
          {BREATHING_PRESETS.map((p) => {
            const active2 = p.id === selectedPreset.id;
            return (
              <Pressable
                key={p.id}
                testID={`breathing-preset-${p.id}`}
                disabled={active}
                onPress={() => setSelectedPreset(p)}
                style={[
                  styles.presetCard,
                  {
                    backgroundColor: active2
                      ? theme.colors.accent + '20'
                      : theme.colors.surface,
                    borderColor: active2
                      ? theme.colors.accent
                      : theme.colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    {
                      color: active2 ? theme.colors.accent : theme.colors.text,
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

        {active ? (
          <Pressable
            testID="breathing-stop"
            onPress={handleStop}
            style={[styles.button, { backgroundColor: theme.colors.warning }]}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            testID="breathing-start"
            onPress={handleStart}
            style={[styles.button, { backgroundColor: theme.colors.accent }]}
          >
            <Text style={styles.buttonText}>Start</Text>
          </Pressable>
        )}

        <View style={{ height: 16 }} />

        <Pressable
          testID="breathing-back"
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
  cycleText: {
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignSelf: 'stretch',
  },
  presetCard: {
    width: '48%',
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
    textAlign: 'center',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
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
