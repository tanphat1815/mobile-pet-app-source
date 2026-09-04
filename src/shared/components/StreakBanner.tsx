/**
 * StreakBanner
 *
 * 🔥 hiển thị streak + bonus multiplier. Pulse animation ở streak cao.
 * Step 6 — xem docs/steps/step-06-quests-upgrade.md.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { Streak, streakLabel, formatBonus } from '../../api/streakTracker';

interface StreakBannerProps {
  streak: Streak;
  compact?: boolean;
}

export function StreakBanner({ streak, compact = false }: StreakBannerProps) {
  const theme = useTheme();
  const pulse = useSharedValue(1);

  // Pulse on streak >= 7
  useEffect(() => {
    if (streak.current >= 7) {
      pulse.value = withRepeat(
        withTiming(1.15, {
          duration: 800,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [streak.current, pulse]);

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      testID="streak-banner"
      accessibilityLabel={`Current streak: ${streakLabel(streak)}. Bonus: ${formatBonus(streak.bonusMultiplier)}`}
      style={[
        styles.root,
        compact && styles.compact,
        {
          backgroundColor:
            streak.current >= 30
              ? '#7A1F1F'
              : streak.current >= 7
              ? '#FF7F50'
              : theme.colors.accent,
        },
      ]}
    >
      <Animated.Text style={[styles.fire, fireStyle]}>🔥</Animated.Text>
      <View style={styles.content}>
        <Text
          style={[
            styles.streakText,
            { color: '#FFFFFF', fontSize: compact ? 14 : 16 },
          ]}
        >
          {streakLabel(streak)}
        </Text>
        <Text style={styles.bonusText}>
          {streak.current > 0
            ? `Bonus ${formatBonus(streak.bonusMultiplier)} XP`
            : 'Start a streak today!'}
        </Text>
      </View>
      {streak.longest > streak.current ? (
        <View style={styles.longestChip}>
          <Text style={styles.longestText}>🏆 {streak.longest}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  compact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  fire: {
    fontSize: 32,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  streakText: {
    fontWeight: '700',
  },
  bonusText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  longestChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  longestText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
