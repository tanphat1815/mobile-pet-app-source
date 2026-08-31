/**
 * QuestRow
 *
 * One row in the quest list. Shows:
 *   - Quest icon + title + category
 *   - Countdown (or "Completed" / "Expired")
 *   - Aggregate progress bar
 *   - Each objective as a sub-line with a checkbox-style indicator
 *   - Reward (coins + XP)
 *   - Optional Claim button when completed
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import {
  Quest,
  questProgressPct,
  questCountdownLabel,
  isQuestExpired,
} from '../../api/achievementTypes';
import { Badge } from './Badge';
import { Button } from './Button';

export interface QuestRowProps {
  quest: Quest;
  now: number;
  onClaim?: () => void;
  claiming?: boolean;
}

export function QuestRow({ quest, now, onClaim, claiming }: QuestRowProps) {
  const theme = useTheme();
  const pct = questProgressPct(quest);
  const expired = isQuestExpired(quest, now);
  const completed = quest.status === 'completed';
  const status: 'active' | 'completed' | 'expired' = expired
    ? 'expired'
    : completed
    ? 'completed'
    : 'active';

  const progress = useSharedValue(pct);
  React.useEffect(() => {
    progress.value = withTiming(pct, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
  }, [pct, progress]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const totalXp = quest.objectives.filter((o) => o.done).length;
  const totalObj = quest.objectives.length;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.separator,
          borderRadius: theme.radius.lg,
          opacity: status === 'expired' ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 22 }}>{quest.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.size.headline,
                  fontWeight: '700',
                },
              ]}
              numberOfLines={1}
            >
              {quest.title}
            </Text>
            {quest.category && (
              <View style={{ marginLeft: 8 }}>
                <Badge label={quest.category} variant="neutral" size="sm" />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
              },
            ]}
            numberOfLines={2}
          >
            {quest.description}
          </Text>
        </View>
        {status === 'completed' ? (
          <Badge label="Done" variant="success" size="sm" />
        ) : status === 'expired' ? (
          <Badge label="Expired" variant="warning" size="sm" />
        ) : (
          <Text
            style={[
              styles.countdown,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.caption1,
              },
            ]}
          >
            {questCountdownLabel(quest, now)}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.border },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor:
                status === 'completed'
                  ? theme.colors.success
                  : theme.colors.accent,
            },
            fillStyle,
          ]}
        />
      </View>

      <View style={styles.objectivesList}>
        {quest.objectives.map((o) => (
          <View key={o.id} style={styles.objectiveRow}>
            <Text
              style={{
                color: o.done ? theme.colors.success : theme.colors.textSecondary,
                fontSize: 14,
                marginRight: 8,
              }}
            >
              {o.done ? '✓' : '○'}
            </Text>
            <Text
              style={{
                flex: 1,
                color: o.done
                  ? theme.colors.textSecondary
                  : theme.colors.text,
                fontSize: theme.typography.size.subhead,
                textDecorationLine: o.done ? 'line-through' : 'none',
              }}
              numberOfLines={1}
            >
              {o.description}
            </Text>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.caption1,
                fontVariant: ['tabular-nums'],
              }}
            >
              {o.current}/{o.goal}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footerRow}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.caption1,
          }}
        >
          {totalXp}/{totalObj} done
          {quest.rewardCoins !== undefined && (
            <> • +{quest.rewardCoins} 🪙</>
          )}
          {quest.rewardXP !== undefined && <> • +{quest.rewardXP} XP</>}
        </Text>
        {completed && status !== 'expired' && onClaim && (
          <Button
            title="Claim"
            onPress={onClaim}
            variant="primary"
            size="sm"
            loading={claiming}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    flexShrink: 1,
  },
  description: {},
  countdown: {
    marginLeft: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  objectivesList: {
    marginBottom: 8,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});