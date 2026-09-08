/**
 * TimingGameScreen — Step 12g mini-game 2
 *
 * Stop the indicator inside the green zone for max points.
 * - 10 rounds, indicator speed increases per round
 * - Target zone shrinks per round
 * - Perfect center: 20 pts, edge: 10 pts, miss: -5 pts
 * - Win if score >= 30
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';
import {
  PERFECT_SCORE,
  GOOD_SCORE,
  MISS_SCORE,
  TIMING_MAX_ROUNDS,
  TIMING_RESULT_DELAY_MS,
  createTimingState,
  finishTiming,
  nextTimingRound,
  pressTiming,
  startTiming,
  tickTimingIndicator,
  xpFromScore,
  type TimingState,
} from '../../api/miniGames';
import { useMiniGamesStore } from '../../stores/MiniGamesStore';
import { Button } from '../../shared/components/Button';

const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;

export function TimingGameScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const recordResult = useMiniGamesStore((s) => s.recordResult);

  const [state, setState] = useState<TimingState>(() => createTimingState());
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef<number>(Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  const start = () => {
    hapticLight();
    setState(startTiming(createTimingState()));
    setRunning(true);
    lastTickRef.current = Date.now();
  };

  // Indicator loop
  useEffect(() => {
    if (!running) return;
    let frameId: ReturnType<typeof setTimeout> | null = null;
    const loop = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;
      const units = Math.max(0.1, deltaMs / FRAME_MS);
      setState((prev) => tickTimingIndicator(prev, units));
      frameId = setTimeout(loop, FRAME_MS);
    };
    loop();
    return () => {
      if (frameId) clearTimeout(frameId);
    };
  }, [running]);

  // Watch for completion
  useEffect(() => {
    if (state.finished && !state.running) {
      setRunning(false);
      const success = state.score >= 30;
      recordResult('timing', state.score, success, state.round * 5); // approximate
      hapticSuccess();
      Alert.alert(
        success ? '🎉 Hoàn thành!' : '⏱ Hết vòng!',
        `Điểm: ${state.score}\n${success ? `+${xpFromScore(state.score)} XP` : 'Cố gắng lần sau nhé!'}`,
        [{ text: 'Chơi lại', onPress: () => setState(createTimingState()) }]
      );
    }
  }, [state.finished, state.running, state.score, state.round, recordResult]);

  const handlePress = () => {
    if (!state.running || !state.canPress) return;
    hapticLight();
    setState((prev) => {
      const result = pressTiming(prev);
      const after = result.state;
      if (result.result === 'perfect') hapticSuccess();
      else if (result.result === 'miss') hapticError();
      // Schedule next round after TIMING_RESULT_DELAY_MS
      setTimeout(() => {
        setState((cur) => {
          if (cur.finished) return cur;
          const next = nextTimingRound(cur);
          if (next.finished) {
            return finishTiming(next, next.score >= 30);
          }
          return next;
        });
      }, TIMING_RESULT_DELAY_MS);
      return after;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: 16 + insets.top }]}>
      {/* HUD */}
      <View style={[styles.hud, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
        <View style={styles.hudItem}>
          <Text style={[styles.hudLabel, { color: theme.colors.textTertiary }]}>Điểm</Text>
          <Text style={[styles.hudValue, { color: theme.colors.text }]} testID="mg-t-score">{state.score}</Text>
        </View>
        <View style={styles.hudItem}>
          <Text style={[styles.hudLabel, { color: theme.colors.textTertiary }]}>Vòng</Text>
          <Text style={[styles.hudValue, { color: theme.colors.accent }]} testID="mg-t-round">
            {state.round}/{state.maxRounds}
          </Text>
        </View>
      </View>

      {/* Track */}
      <View style={styles.trackWrapper}>
        <View
          style={[
            styles.track,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          {/* Target zone */}
          <View
            testID="mg-t-target"
            style={[
              styles.targetZone,
              {
                left: `${state.targetStart}%`,
                width: `${state.targetEnd - state.targetStart}%`,
                backgroundColor: theme.colors.success + '40',
                borderColor: theme.colors.success,
              },
            ]}
          />

          {/* Indicator */}
          {state.canPress && state.running && (
            <View
              testID="mg-t-indicator"
              style={[
                styles.indicator,
                {
                  left: `${state.indicatorPos}%`,
                  backgroundColor: theme.colors.danger,
                },
              ]}
            />
          )}

          {/* Last result marker */}
          {state.lastResult && (
            <Text style={styles.lastResult}>
              {state.lastResult === 'perfect' ? '⭐ PERFECT +20' : state.lastResult === 'good' ? '✓ GOOD +10' : '✗ MISS -5'}
            </Text>
          )}
        </View>

        {/* Tap button */}
        <Pressable
          testID="mg-t-press"
          onPress={handlePress}
          disabled={!state.running || !state.canPress}
          style={({ pressed }) => [
            styles.pressButton,
            {
              backgroundColor: pressed ? theme.colors.accentMuted : theme.colors.accent,
              opacity: !state.running || !state.canPress ? 0.4 : 1,
            },
          ]}
        >
          <Text style={styles.pressButtonText}>
            {state.canPress ? '⚡ NHẤN!' : '⏳'}
          </Text>
        </Pressable>
      </View>

      {/* Idle overlay */}
      {!running && !state.finished && (
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.overlayCard, { backgroundColor: theme.colors.bg }]}>
            <Text style={[styles.overlayTitle, { color: theme.colors.text }]}>⚡ Phản Xạ Nhanh</Text>
            <Text style={[styles.overlayText, { color: theme.colors.textSecondary }]}>
              Nhấn đúng lúc khi thanh đỏ nằm trong vùng xanh.{'\n'}
              Trúng giữa: +20 điểm · Mép: +10 · Trượt: -5
            </Text>
            <Button title="▶ Bắt đầu" onPress={start} variant="primary" testID="mg-t-start" />
          </View>
        </View>
      )}

      {/* Finished overlay */}
      {!running && state.finished && (
        <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
          <View style={[styles.overlayCard, { backgroundColor: theme.colors.bg }]}>
            <Text style={[styles.overlayTitle, { color: theme.colors.text }]}>
              {state.score >= 30 ? '🎉 Hoàn thành!' : '⏱ Hết vòng'}
            </Text>
            <Text style={[styles.overlayText, { color: theme.colors.textSecondary }]}>
              Điểm: <Text style={{ fontWeight: '700' }}>{state.score}</Text>{'\n'}
              {state.score >= 30 ? `+${xpFromScore(state.score)} XP` : 'Cố gắng lần sau nhé!'}
            </Text>
            <Button
              title="🔄 Chơi lại"
              onPress={() => setState(createTimingState())}
              variant="primary"
              testID="mg-t-restart"
            />
            <View style={{ height: 8 }} />
            <Button
              title="Về sảnh"
              onPress={() => {
                setState(createTimingState());
              }}
              variant="ghost"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hudItem: { alignItems: 'center' },
  hudLabel: { fontSize: 11, fontWeight: '600' },
  hudValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },

  trackWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    alignItems: 'stretch',
  },
  track: {
    height: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  targetZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 4,
    marginLeft: -2,
    borderRadius: 2,
  },
  lastResult: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 2,
  },

  pressButton: {
    marginTop: 32,
    paddingVertical: 22,
    borderRadius: 14,
    alignItems: 'center',
  },
  pressButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '85%',
    maxWidth: 320,
  },
  overlayTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  overlayText: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
});
