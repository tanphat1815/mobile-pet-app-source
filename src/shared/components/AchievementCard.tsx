/**
 * AchievementCard
 *
 * Square-ish card showing one achievement. Locked achievements are
 * dimmed and show a progress bar instead of the unlock date.
 *
 * Step 8 — rarity border color + hidden achievement placeholder ("???").
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
  rarityColor,
  rarityGlyph,
  categoryGlyph,
} from '../../api/achievementTypes';
import { Badge } from './Badge';

export interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
  testID?: string;
}

export function AchievementCard({ achievement, onPress, testID }: AchievementCardProps) {
  const theme = useTheme();
  const progress = achievementProgressPct(achievement);
  const unlocked = achievement.unlocked;

  // Hidden: show placeholder until unlocked
  const isHidden = achievement.isHidden && !unlocked;

  // Rarity border color (constant, not theme-dependent)
  const rarityBorderColor = unlocked
    ? rarityColor(achievement.rarity)
    : theme.colors.border;

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

  const title = isHidden ? '???' : achievement.title;
  const description = isHidden ? 'Keep playing to unlock!' : achievement.description;
  const icon = isHidden ? '❓' : achievement.icon;

  return (
    <Animated.View
      testID={testID ?? `achievement-card-${achievement.id}`}
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
              ? theme.colors.surface
              : theme.colors.surfaceMuted,
            borderRadius: theme.radius.lg,
            borderColor: rarityBorderColor,
            borderWidth: unlocked ? 2 : 1,
            opacity: unlocked ? 1 : 0.75,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.tier}>
            {unlocked ? rarityGlyph(achievement.rarity) : tierGlyph(achievement.tier ?? 'bronze')}
          </Text>
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
          {title}
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
          {description}
        </Text>

        <View style={styles.footerRow}>
          <Text style={{ fontSize: 14 }}>
            {categoryGlyph(achievement.category)}
          </Text>
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

        {!unlocked && !isHidden && (
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
                  backgroundColor: rarityColor(achievement.rarity),
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