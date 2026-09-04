/**
 * MusicPlayer — full music player UI (Step 12b)
 *
 * Renders: cover, title/artist, progress bar, controls, volume slider,
 * shuffle/repeat toggles.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { CustomSlider } from './CustomSlider';
import { useMusicStore } from '../../stores/MusicStore';
import { hapticLight } from '../../utils/haptics';
import { formatMusicTime } from '../../api/music';

export interface MusicPlayerProps {
  testID?: string;
  /** Hide the volume slider when used in compact layouts. */
  showVolume?: boolean;
}

export function MusicPlayer({ testID, showVolume = true }: MusicPlayerProps) {
  const theme = useTheme();
  const track = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTime = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const volume = useMusicStore((s) => s.volume);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);

  const togglePlay = useMusicStore((s) => s.togglePlay);
  const next = useMusicStore((s) => s.next);
  const previous = useMusicStore((s) => s.previous);
  const seek = useMusicStore((s) => s.seek);
  const setVolume = useMusicStore((s) => s.setVolume);
  const setShuffle = useMusicStore((s) => s.setShuffle);
  const setRepeat = useMusicStore((s) => s.setRepeat);

  // Spinning cover animation
  const spin = useSharedValue(0);
  React.useEffect(() => {
    if (isPlaying) {
      spin.value = withRepeat(
        withTiming(1, { duration: 8000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      spin.value = withTiming(0, { duration: 400 });
    }
  }, [isPlaying, spin]);

  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const cycleRepeat = () => {
    const order = ['all', 'one', 'none'] as const;
    const next = order[(order.indexOf(repeat) + 1) % order.length];
    hapticLight();
    setRepeat(next);
  };

  if (!track) {
    return (
      <View
        testID={testID}
        style={[
          styles.empty,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Chưa có bài hát nào được chọn
        </Text>
      </View>
    );
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: 18,
        },
      ]}
    >
      {/* Cover */}
      <View style={styles.coverWrap}>
        <Animated.View
          style={[
            styles.cover,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.border,
            },
            coverStyle,
          ]}
        >
          <Text style={styles.coverEmoji}>{track.cover}</Text>
        </Animated.View>
      </View>

      {/* Title */}
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
        <Text
          style={[styles.artist, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {track.artist} • {track.album}
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatMusicTime(currentTime)}
        </Text>
        <View style={{ flex: 1, marginHorizontal: 8 }}>
          <CustomSlider
            value={progress}
            onChange={(v) => seek(v * duration)}
            fillColor={theme.colors.accent}
            trackColor={theme.colors.border}
            testID="music-progress"
          />
        </View>
        <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
          {formatMusicTime(duration)}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={() => { hapticLight(); setShuffle(!shuffle); }}
          testID="music-shuffle"
          accessibilityRole="button"
          accessibilityState={{ selected: shuffle }}
          hitSlop={10}
          style={styles.ctrlBtn}
        >
          <Text
            style={{
              fontSize: 18,
              color: shuffle ? theme.colors.accent : theme.colors.textSecondary,
            }}
          >
            ⇄
          </Text>
        </Pressable>

        <Pressable
          onPress={() => { hapticLight(); previous(); }}
          testID="music-prev"
          accessibilityRole="button"
          hitSlop={10}
          style={styles.ctrlBtn}
        >
          <Text style={[styles.ctrlGlyph, { color: theme.colors.text }]}>⏮</Text>
        </Pressable>

        <Pressable
          onPress={() => { hapticLight(); togglePlay(); }}
          testID="music-play"
          accessibilityRole="button"
          accessibilityState={{ busy: isPlaying }}
          hitSlop={10}
          style={[
            styles.playBtn,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Text style={[styles.playGlyph, { color: theme.colors.onAccent }]}>
            {isPlaying ? '❚❚' : '▶'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => { hapticLight(); next(); }}
          testID="music-next"
          accessibilityRole="button"
          hitSlop={10}
          style={styles.ctrlBtn}
        >
          <Text style={[styles.ctrlGlyph, { color: theme.colors.text }]}>⏭</Text>
        </Pressable>

        <Pressable
          onPress={cycleRepeat}
          testID="music-repeat"
          accessibilityRole="button"
          accessibilityState={{ selected: repeat !== 'none' }}
          hitSlop={10}
          style={styles.ctrlBtn}
        >
          <Text
            style={{
              fontSize: 18,
              color: repeat !== 'none' ? theme.colors.accent : theme.colors.textSecondary,
            }}
          >
            {repeat === 'one' ? '↻¹' : '↻'}
          </Text>
        </Pressable>
      </View>

      {/* Volume */}
      {showVolume && (
        <View style={styles.volumeRow}>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>🔈</Text>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <CustomSlider
              value={volume}
              onChange={setVolume}
              fillColor={theme.colors.accent}
              trackColor={theme.colors.border}
              testID="music-volume"
            />
          </View>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary }}>🔊</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1 },
  empty: { borderWidth: 1, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  coverWrap: { alignItems: 'center', marginBottom: 14 },
  cover: {
    width: 160,
    height: 160,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 64 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  artist: { fontSize: 12, textAlign: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timeText: { fontSize: 11, fontVariant: ['tabular-nums'], minWidth: 36, textAlign: 'center' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  ctrlBtn: { padding: 6 },
  ctrlGlyph: { fontSize: 22 },
  playBtn: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { fontSize: 22, fontWeight: '700' },
  volumeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
});
