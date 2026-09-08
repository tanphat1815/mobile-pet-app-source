/**
 * CatchFallScreen — Step 12g mini-game 1
 *
 * Tap-to-move / drag paddle horizontally to catch falling objects.
 * - 5 object types (fish 🐟 / cake 🎂 / star ⭐ / toy 🧶 / bomb 💣)
 * - +10..20 pts good, -10 for bomb, -life for missed good
 * - 45 seconds, 3 lives, win if score >= 30
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  PanResponder,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';
import {
  CATCH_FALL_DEFAULT_DURATION_SEC,
  CATCH_FALL_OBJECT_SIZE,
  CATCH_FALL_PADDLE_HEIGHT,
  CATCH_FALL_PADDLE_WIDTH,
  CATCH_FALL_PLAY_AREA_HEIGHT,
  CATCH_FALL_PLAY_AREA_WIDTH,
  createCatchFallState,
  decrementTime,
  finishCatchFall,
  setPaddleX,
  spawnCatchFallObject,
  startCatchFall,
  tickCatchFall,
  xpFromScore,
  type CatchFallObject,
  type CatchFallState,
} from '../../api/miniGames';
import { useMiniGamesStore } from '../../stores/MiniGamesStore';
import { Button } from '../../shared/components/Button';

const TARGET_FPS = 30;
const FRAME_MS = 1000 / TARGET_FPS;

export function CatchFallScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const recordResult = useMiniGamesStore((s) => s.recordResult);

  const [state, setState] = useState<CatchFallState>(() => createCatchFallState());
  const [running, setRunning] = useState(false);
  const lastTickRef = useRef<number>(Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  // PanResponder for paddle drag
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gesture) => {
        const dx = gesture.x0 - (CATCH_FALL_PADDLE_WIDTH / 2);
        setState((prev) => setPaddleX(prev, dx));
      },
      onPanResponderMove: (_, gesture) => {
        setState((prev) => setPaddleX(prev, gesture.moveX - CATCH_FALL_PADDLE_WIDTH / 2));
      },
    })
  ).current;

  const start = () => {
    hapticLight();
    setState((prev) => startCatchFall(prev));
    setRunning(true);
    lastTickRef.current = Date.now();
  };

  // Game loop
  useEffect(() => {
    if (!running) return;
    let frameId: ReturnType<typeof setTimeout> | null = null;
    let countdownId: ReturnType<typeof setInterval> | null = null;

    const loop = () => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;
      setState((prev) => {
        if (!prev.running) return prev;
        const tickRes = tickCatchFall({ state: prev, deltaMs });
        return tickRes.state;
      });
      frameId = setTimeout(loop, FRAME_MS);
    };
    loop();

    countdownId = setInterval(() => {
      setState((prev) => decrementTime(prev));
    }, 1000);

    return () => {
      if (frameId) clearTimeout(frameId);
      if (countdownId) clearInterval(countdownId);
    };
  }, [running]);

  // Watch for completion (timeLeft = 0 OR lives = 0)
  useEffect(() => {
    if (!state.running && state.finished && state.score > 0) {
      setRunning(false);
      const success = state.success;
      const xp = xpFromScore(state.score);
      recordResult('catch_fall', state.score, success, CATCH_FALL_DEFAULT_DURATION_SEC - state.timeLeft);
      hapticSuccess();
      Alert.alert(
        success ? '🎉 Hoàn thành!' : '⏱ Hết giờ!',
        `Điểm: ${state.score}\n${success ? `+${xp} XP` : 'Cố gắng lần sau nhé!'}`,
        [{ text: 'Chơi lại', onPress: () => setState(createCatchFallState()) }]
      );
    } else if (!state.running && state.finished && state.score === 0) {
      setRunning(false);
    }
  }, [state.running, state.finished, state.score, state.success, state.timeLeft, recordResult]);

  // End conditions
  useEffect(() => {
    if (state.timeLeft === 0 && state.running) {
      setState((prev) => finishCatchFall(prev, prev.score >= 30));
    }
    if (state.lives <= 0 && state.running) {
      setState((prev) => finishCatchFall(prev, false));
    }
  }, [state.timeLeft, state.lives, state.running]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: 16 + insets.top }]}>
      {/* HUD */}
      <View style={[styles.hud, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
        <Text style={[styles.hudLabel, { color: theme.colors.textTertiary }]}>Điểm</Text>
        <Text style={[styles.hudValue, { color: theme.colors.text }]} testID="mg-cf-score">{state.score}</Text>
        <Text style={[styles.hudLabel, { color: theme.colors.textTertiary, marginLeft: 16 }]}>Mạng</Text>
        <Text style={[styles.hudValue, { color: theme.colors.danger }]}>{'❤'.repeat(Math.max(0, state.lives))}</Text>
        <Text style={[styles.hudLabel, { color: theme.colors.textTertiary, marginLeft: 16 }]}>Thời gian</Text>
        <Text style={[styles.hudValue, { color: theme.colors.accent }]} testID="mg-cf-timer">{state.timeLeft}s</Text>
      </View>

      {/* Play area */}
      <View style={styles.playAreaWrapper}>
        <View
          {...panResponder.panHandlers}
          style={[
            styles.playArea,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Paddle */}
          <View
            testID="mg-cf-paddle"
            style={[
              styles.paddle,
              {
                left: state.paddleX,
                backgroundColor: theme.colors.accent,
                borderColor: theme.colors.accentMuted,
              },
            ]}
          />

          {/* Falling objects */}
          {state.objects.map((obj) => (
            <FallingObject key={obj.id} obj={obj} />
          ))}

          {/* Idle overlay */}
          {!running && !state.finished && (
            <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
              <View style={[styles.overlayCard, { backgroundColor: theme.colors.bg }]}>
                <Text style={[styles.overlayTitle, { color: theme.colors.text }]}>🎯 Bắt Đồ Vật</Text>
                <Text style={[styles.overlayText, { color: theme.colors.textSecondary }]}>
                  Kéo paddle để bắt cá, bánh, ngôi sao.{'\n'}
                  Tránh bom 💣 và đừng để rơi xuống!
                </Text>
                <Button title="▶ Bắt đầu" onPress={start} variant="primary" testID="mg-cf-start" />
              </View>
            </View>
          )}

          {/* Finished overlay */}
          {!running && state.finished && (
            <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
              <View style={[styles.overlayCard, { backgroundColor: theme.colors.bg }]}>
                <Text style={[styles.overlayTitle, { color: theme.colors.text }]}>
                  {state.success ? '🎉 Hoàn thành!' : '⏱ Hết lượt'}
                </Text>
                <Text style={[styles.overlayText, { color: theme.colors.textSecondary }]}>
                  Điểm: <Text style={{ fontWeight: '700' }}>{state.score}</Text>{'\n'}
                  {state.success ? `+${xpFromScore(state.score)} XP` : 'Cố gắng lần sau nhé!'}
                </Text>
                <Button
                  title="🔄 Chơi lại"
                  onPress={() => {
                    setState(createCatchFallState());
                  }}
                  variant="primary"
                  testID="mg-cf-restart"
                />
                <View style={{ height: 8 }} />
                <Button
                  title="Về sảnh"
                  onPress={() => {
                    setState(createCatchFallState());
                    setRunning(false);
                  }}
                  variant="ghost"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function FallingObject({ obj }: { obj: CatchFallObject }) {
  return (
    <Text
      style={[
        styles.object,
        {
          left: obj.x,
          top: obj.y,
        },
      ]}
    >
      {obj.icon}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hudLabel: { fontSize: 11, fontWeight: '600' },
  hudValue: { fontSize: 18, fontWeight: '700', marginLeft: 4 },

  playAreaWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  playArea: {
    width: CATCH_FALL_PLAY_AREA_WIDTH,
    height: CATCH_FALL_PLAY_AREA_HEIGHT,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  paddle: {
    position: 'absolute',
    width: CATCH_FALL_PADDLE_WIDTH,
    height: CATCH_FALL_PADDLE_HEIGHT,
    borderRadius: 8,
    bottom: 26,
    borderWidth: 2,
  },
  object: {
    position: 'absolute',
    fontSize: 26,
    lineHeight: CATCH_FALL_OBJECT_SIZE,
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
