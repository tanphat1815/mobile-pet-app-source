/**
 * QuestRow
 *
 * One row in the quest list. Step 6 thêm:
 *   - Difficulty chip (4 levels × màu)
 *   - Streak bonus multiplier in reward line
 *   - Tier badge (daily/weekly/event)
 *   - Optional reroll button (for daily/active quests)
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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
  getDifficultyMeta,
  applyRewardMultiplier,
} from '../../api/achievementTypes';
import { Badge } from './Badge';
import { Button } from './Button';
import { QuestDifficultyChip } from './QuestDifficultyChip';
import { hapticLight } from '../../utils/haptics';

export interface QuestRowProps {
  quest: Quest;
  now: number;
  onClaim?: () => void;
  onReroll?: () => void;
  claiming?: boolean;
  rerolling?: boolean;
}

export function QuestRow({ quest, now, onClaim, onReroll, claiming, rerolling }: QuestRowProps) {
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

  // Step 6 — reward với difficulty + streak multiplier
  const baseXp = quest.rewardXP ?? 0;
  const baseCoins = quest.rewardCoins ?? 0;
  const finalXp = applyRewardMultiplier(baseXp, quest.difficulty, quest.streakBonus);
  const finalCoins = applyRewardMultiplier(baseCoins, quest.difficulty, quest.streakBonus);

  // Reroll cost label
  const rerollLabel = quest.freeRerollsLeft > 0
    ? '🎁 Free'
    : `🪙 ${quest.rerollCost}`;

  return (
    <View
      testID={`quest-row-${quest.tier}-${quest.id}`}
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
            <QuestDifficultyChip difficulty={quest.difficulty} />
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
          <View style={styles.metaRow}>
            <Badge label={quest.tier.toUpperCase()} variant="neutral" size="sm" />
            {quest.category && (
              <Badge label={quest.category} variant="neutral" size="sm" />
            )}
          </View>
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
          {totalXp}/{totalObj} done • +{finalCoins} 🪙 • +{finalXp} XP
          {quest.streakBonus > 1 ? ` (×${quest.streakBonus.toFixed(1)})` : ''}
        </Text>
        <View style={styles.actionRow}>
          {status === 'active' && onReroll ? (
            <Pressable
              testID={`reroll-btn-${quest.id}`}
              onPress={() => {
                hapticLight();
                onReroll();
              }}
              disabled={rerolling}
              style={({ pressed }) => [
                styles.rerollBtn,
                {
                  backgroundColor: pressed
                    ? theme.colors.surfaceMuted
                    : theme.colors.surface2,
                  borderColor: theme.colors.border,
                  opacity: rerolling ? 0.5 : 1,
                },
              ]}
            >
              <Text style={{ color: theme.colors.accent, fontWeight: '600', fontSize: 12 }}>
                🔄 {rerollLabel}
              </Text>
            </Pressable>
          ) : null}
          {completed && status !== 'expired' && onClaim ? (
            <Button
              title="Claim"
              onPress={onClaim}
              variant="primary"
              size="sm"
              loading={claiming ?? false}
            />
          ) : null}
        </View>
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
    marginBottom: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  title: {
    flexShrink: 1,
  },
  description: {},
  metaRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
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
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rerollBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});
