/**
 * QuestsScreen
 *
 * Step 6 — Daily / Weekly / Event tier tabs, streak banner header,
 * reroll button cho daily quests.
 *
 * Real-time: useAchievementRealtimeSync pipes quest:progress events.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAchievementStore, useAchievementRealtimeSync } from '../stores/AchievementStore';
import { SegmentedTabs, TabItem } from '../shared/components/SegmentedTabs';
import { QuestRow } from '../shared/components/QuestRow';
import { StreakBanner } from '../shared/components/StreakBanner';
import { isQuestExpired, QuestTier } from '../api/achievementTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Quests'>;

type FilterKey = 'active' | 'completed';
type TierKey = QuestTier | 'all';

export function QuestsScreen({ navigation }: Props) {
  const theme = useTheme();

  const quests = useAchievementStore((s) => s.quests);
  const streak = useAchievementStore((s) => s.streak);
  const status = useAchievementStore((s) => s.status);
  const claiming = useAchievementStore((s) => s.claiming);
  const rerolling = useAchievementStore((s) => s.rerolling);
  const loadAll = useAchievementStore((s) => s.loadAll);
  const claimReward = useAchievementStore((s) => s.claimReward);
  const reroll = useAchievementStore((s) => s.reroll);

  const [filter, setFilter] = useState<FilterKey>('active');
  const [tier, setTier] = useState<TierKey>('all');
  const [now, setNow] = useState(Date.now());

  useAchievementRealtimeSync();

  useEffect(() => {
    if (status === 'idle') loadAll();
  }, [status, loadAll]);

  // 1Hz ticker for countdown labels
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = quests.filter((q) => {
    if (filter === 'completed') return q.status === 'completed';
    const expired = isQuestExpired(q, now);
    if (q.status !== 'active' || expired) return false;
    if (tier !== 'all' && q.tier !== tier) return false;
    return true;
  });

  const dailyCount = quests.filter((q) => q.tier === 'daily' && q.status === 'active' && !isQuestExpired(q, now)).length;
  const weeklyCount = quests.filter((q) => q.tier === 'weekly' && q.status === 'active' && !isQuestExpired(q, now)).length;
  const eventCount = quests.filter((q) => q.tier === 'event' && q.status === 'active' && !isQuestExpired(q, now)).length;
  const completedCount = quests.filter((q) => q.status === 'completed').length;

  const filterTabs: TabItem[] = [
    { key: 'active', label: 'Active', badge: dailyCount + weeklyCount + eventCount },
    { key: 'completed', label: 'Completed', badge: completedCount },
  ];

  const tierTabs: TabItem[] = [
    { key: 'all', label: 'All' },
    { key: 'daily', label: 'Daily', badge: dailyCount || undefined },
    { key: 'weekly', label: 'Weekly', badge: weeklyCount || undefined },
    { key: 'event', label: 'Event', badge: eventCount || undefined },
  ];

  const handleClaim = useCallback(
    async (questId: string, title: string) => {
      try {
        const res = await claimReward(questId);
        Alert.alert(
          `Reward claimed!`,
          `${title}\n\n+${res.coins} 🪙 • +${res.xp} XP`,
          [{ text: 'OK' }]
        );
      } catch (err) {
        Alert.alert(
          'Could not claim',
          err instanceof Error ? err.message : 'Unknown error'
        );
      }
    },
    [claimReward]
  );

  const handleReroll = useCallback(
    async (questId: string, title: string, cost: number, hasFree: boolean) => {
      const action = hasFree ? 'use free reroll' : `spend ${cost} coins`;
      Alert.alert(
        'Reroll Quest',
        `Replace "${title}" with a different quest?\n(${action})`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: hasFree ? 'Reroll (Free)' : `Reroll (${cost} 🪙)`,
            onPress: async () => {
              try {
                await reroll(questId);
                Alert.alert('Quest Rerolled!', 'New quest has replaced the old one.');
              } catch (err) {
                Alert.alert(
                  'Reroll failed',
                  err instanceof Error ? err.message : 'Unknown error'
                );
              }
            },
          },
        ]
      );
    },
    [reroll]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title1,
            fontWeight: '700',
          }}
        >
          Quests
        </Text>
      </View>

      {/* Streak banner */}
      {streak && (
        <StreakBanner streak={streak} compact />
      )}

      {/* Tier tabs */}
      <View style={{ paddingHorizontal: 16 }}>
        <SegmentedTabs
          items={tierTabs}
          activeKey={tier}
          onChange={(k) => setTier(k as TierKey)}
        />
      </View>

      {/* Filter tabs */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <SegmentedTabs
          items={filterTabs}
          activeKey={filter}
          onChange={(k) => setFilter(k as FilterKey)}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={loadAll}
            tintColor={theme.colors.accent}
          />
        }
        renderItem={({ item }) => (
          <QuestRow
            quest={item}
            now={now}
            onClaim={() => handleClaim(item.id, item.title)}
            onReroll={
              item.status === 'active' && (item.freeRerollsLeft > 0 || item.rerollCost > 0)
                ? () => handleReroll(item.id, item.title, item.rerollCost, item.freeRerollsLeft > 0)
                : undefined
            }
            claiming={claiming}
            rerolling={rerolling}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                textAlign: 'center',
              }}
            >
              {filter === 'active'
                ? tier === 'all'
                  ? 'No active quests right now'
                  : `No active ${tier} quests`
                : 'No completed quests yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  empty: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
});
