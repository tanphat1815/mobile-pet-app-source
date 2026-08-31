/**
 * AchievementsScreen
 *
 * Read-only viewer for achievements. Filtered by category (All / Care /
 * Social / Exploration / Collection / Special).
 *
 * Real-time: useAchievementRealtimeSync pipes achievement:unlocked
 * events into the store.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { AchievementCard } from '../shared/components/AchievementCard';
import {
  Achievement,
  AchievementCategory,
} from '../api/achievementTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Achievements'>;
type FilterKey = 'all' | AchievementCategory;

const CATEGORY_LABELS: Record<FilterKey, string> = {
  all: 'All',
  care: 'Care',
  social: 'Social',
  exploration: 'Explore',
  collection: 'Collect',
  special: 'Special',
};

export function AchievementsScreen({ navigation }: Props) {
  const theme = useTheme();

  const achievements = useAchievementStore((s) => s.achievements);
  const status = useAchievementStore((s) => s.status);
  const loadAll = useAchievementStore((s) => s.loadAll);

  const [filter, setFilter] = useState<FilterKey>('all');
  const [showLocked, setShowLocked] = useState(true);

  useAchievementRealtimeSync();

  useEffect(() => {
    if (status === 'idle') loadAll();
  }, [status, loadAll]);

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      if (!showLocked && !a.unlocked) return false;
      if (filter !== 'all' && a.category !== filter) return false;
      return true;
    });
  }, [achievements, filter, showLocked]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const tabs: TabItem[] = (Object.keys(CATEGORY_LABELS) as FilterKey[]).map(
    (k) => {
      const count =
        k === 'all'
          ? totalCount
          : achievements.filter((a) => a.category === k).length;
      return { key: k, label: CATEGORY_LABELS[k], badge: count };
    }
  );

  const handlePress = useCallback((a: Achievement) => {
    Alert.alert(
      a.unlocked ? `🏆 ${a.title}` : `🔒 ${a.title}`,
      `${a.description}\n\n${
        a.unlocked
          ? `Unlocked on ${new Date(a.unlockedAt ?? Date.now()).toLocaleDateString()}`
          : a.progressHint ?? 'Not yet unlocked'
      }${
        a.rewardCoins !== undefined || a.rewardXP !== undefined
          ? `\n\nReward: ${a.rewardCoins ?? 0} 🪙 • ${a.rewardXP ?? 0} XP`
          : ''
      }`,
      [{ text: 'OK' }]
    );
  }, []);

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
          Achievements
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 2,
          }}
        >
          {unlockedCount} of {totalCount} unlocked
        </Text>
      </View>

      <SegmentedTabs items={tabs} activeKey={filter} onChange={(k) => setFilter(k as FilterKey)} />

      <View
        style={[
          styles.toggleRow,
          {
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
      >
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.caption1,
          }}
        >
          Showing {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </Text>
        <Text
          onPress={() => setShowLocked((s) => !s)}
          style={{
            color: theme.colors.accent,
            fontSize: theme.typography.size.subhead,
            fontWeight: '600',
          }}
          accessibilityRole="button"
        >
          {showLocked ? 'Hide locked' : 'Show all'}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1, padding: 4 }}>
            <AchievementCard
              achievement={item}
              onPress={() => handlePress(item)}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={status === 'loading'}
            onRefresh={loadAll}
            tintColor={theme.colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                textAlign: 'center',
              }}
            >
              {status === 'loading' ? 'Loading...' : 'Nothing here yet'}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  empty: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
});