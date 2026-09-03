/**
 * LevelBar
 *
 * Displays the pet's level + a progress bar showing XP into the next
 * level. Animates smoothly when XP changes.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { xpProgress, xpForLevel } from '../../api/petTypes';

export interface LevelBarProps {
  level: number;
  xp: number;
  reducedMotion?: boolean;
}

export function LevelBar({ level, xp, reducedMotion = false }: LevelBarProps) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  const stats = { level, xp, hunger: 0, happiness: 0, energy: 0 } as any;
  const pct = xpProgress(stats) * 100;
  const currentThreshold = xpForLevel(level - 1);
  const nextThreshold = xpForLevel(level);

  useEffect(() => {
    progress.value = reducedMotion
      ? pct
      : withTiming(pct, { duration: 700 });
  }, [pct, reducedMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, progress.value))}%`,
  }));

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.levelPill}>
          <Text
            style={[
              styles.levelText,
              {
                color: theme.colors.accent,
                fontSize: theme.typography.size.footnote,
                fontWeight: '700',
              },
            ]}
          >
            LV {level}
          </Text>
        </View>
        <Text
          style={[
            styles.xpLabel,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.caption1,
            },
          ]}
        >
          {xp - currentThreshold} / {nextThreshold - currentThreshold} XP
        </Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.sm,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  levelPill: {},
  levelText: {},
  xpLabel: {},
  track: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});