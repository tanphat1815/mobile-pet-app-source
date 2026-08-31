/**
 * AchievementCard
 *
 * Square-ish card showing one achievement. Locked achievements are
 * dimmed and show a progress bar instead of the unlock date.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import {
  Achievement,
  achievementProgressPct,
  tierGlyph,
  categoryGlyph,
} from '../../api/achievementTypes';
import { Badge } from './Badge';

export interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
}

export function AchievementCard({ achievement, onPress }: AchievementCardProps) {
  const theme = useTheme();
  const progress = achievementProgressPct(achievement);
  const unlocked = achievement.unlocked;

  // Subtle pop animation on mount
  const scale = useSharedValue(0.95);
  useEffect(() => {
    scale.value = withSpring(1, {
      damping: theme.easing.spring.damping,
      stiffness: theme.easing.spring.stiffness,
      mass: theme.easing.spring.mass,
    });
  }, [scale, theme.easing.spring]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.root, animatedStyle]}
      onTouchEnd={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        unlocked
          ? `Unlocked achievement: ${achievement.title}`
          : `Locked achievement: ${achievement.title}, ${progress}%`
      }
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: unlocked
              ? theme.colors.surface
              : theme.isDark
              ? '#1C1C1E'
              : '#F2F2F7',
            borderRadius: theme.radius.lg,
            borderColor: unlocked
              ? theme.colors.border
              : 'transparent',
            opacity: unlocked ? 1 : 0.75,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{achievement.icon}</Text>
          <Text style={styles.tier}>{tierGlyph(achievement.tier)}</Text>
        </View>
        <Text
          style={[
            styles.title,
            {
              color: unlocked
                ? theme.colors.text
                : theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
            },
          ]}
          numberOfLines={2}
        >
          {achievement.title}
        </Text>
        <Text
          style={[
            styles.description,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.caption1,
            },
          ]}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>

        <View style={styles.footerRow}>
          <Text style={{ fontSize: 14 }}>{categoryGlyph(achievement.category)}</Text>
          {unlocked ? (
            <Badge label="Unlocked" variant="success" size="sm" />
          ) : (
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.caption2,
                fontVariant: ['tabular-nums'],
              }}
            >
              {achievement.progressHint ?? `${progress}%`}
            </Text>
          )}
        </View>

        {!unlocked && (
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.colors.border },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.accent,
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  card: {
    padding: 12,
    borderWidth: 1,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
  },
  tier: {
    fontSize: 18,
  },
  title: {
    fontWeight: '700',
    marginTop: 6,
  },
  description: {
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
  },
});