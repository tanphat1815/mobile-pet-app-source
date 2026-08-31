/**
 * QuestsScreen
 *
 * Read-only viewer for active / completed / expired quests. Tabs let
 * the user filter; completed quests can be claimed (the only mutation
 * in this read-only step).
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
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAchievementStore, useAchievementRealtimeSync } from '../stores/AchievementStore';
import { SegmentedTabs, TabItem } from '../shared/components/SegmentedTabs';
import { QuestRow } from '../shared/components/QuestRow';
import { isQuestExpired } from '../api/achievementTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Quests'>;
type FilterKey = 'active' | 'completed';

export function QuestsScreen({ navigation }: Props) {
  const theme = useTheme();

  const quests = useAchievementStore((s) => s.quests);
  const status = useAchievementStore((s) => s.status);
  const claiming = useAchievementStore((s) => s.claiming);
  const loadAll = useAchievementStore((s) => s.loadAll);
  const claimReward = useAchievementStore((s) => s.claimReward);

  const [filter, setFilter] = useState<FilterKey>('active');
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
    const expired = isQuestExpired(q, now);
    if (filter === 'completed') return q.status === 'completed';
    return q.status === 'active' && !expired;
  });

  const activeCount = quests.filter((q) => q.status === 'active' && !isQuestExpired(q, now)).length;
  const completedCount = quests.filter((q) => q.status === 'completed').length;

  const tabs: TabItem[] = [
    { key: 'active', label: 'Active', badge: activeCount },
    { key: 'completed', label: 'Completed', badge: completedCount },
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
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 2,
          }}
        >
          {activeCount} active • {completedCount} completed
        </Text>
      </View>

      <SegmentedTabs items={tabs} activeKey={filter} onChange={(k) => setFilter(k as FilterKey)} />

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
            claiming={claiming}
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
                ? 'No active quests right now'
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