/**
 * AchievementsScreen — Step 8 Achievements Parity
 *
 * Read-only viewer for achievements. Filtered by:
 *  - Category: 8 categories (All / Progression / Care / Social / Gameplay /
 *    Explore / Collect / Special / Hidden)
 *  - Rarity: 5 tiers (All / Common / Uncommon / Rare / Epic / Legendary)
 *
 * Real-time: useAchievementRealtimeSync pipes achievement:unlocked
 * events into the store and triggers toast via AchievementToastHost.
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
import {
  useAchievementStore,
  useAchievementRealtimeSync,
} from '../stores/AchievementStore';
import { SegmentedTabs, TabItem } from '../shared/components/SegmentedTabs';
import { AchievementCard } from '../shared/components/AchievementCard';
import { AchievementShareSheet } from '../shared/components/AchievementShareSheet';
import {
  Achievement,
  AchievementCategory,
  AchievementRarity,
  ACHIEVEMENT_CATEGORIES,
  rarityColor,
  rarityLabel,
  rarityGlyph,
} from '../api/achievementTypes';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Achievements'>;

type CategoryKey = 'all' | AchievementCategory;
type RarityKey = 'all' | AchievementRarity;

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  all: 'All',
  progression: 'Progression',
  care: 'Care',
  social: 'Social',
  gameplay: 'Gameplay',
  exploration: 'Explore',
  collection: 'Collect',
  special: 'Special',
  hidden: 'Hidden',
};

const RARITY_KEYS: RarityKey[] = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

export function AchievementsScreen({ navigation }: Props) {
  const theme = useTheme();

  const achievements = useAchievementStore((s) => s.achievements);
  const status = useAchievementStore((s) => s.status);
  const loadAll = useAchievementStore((s) => s.loadAll);

  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityKey>('all');
  const [showLocked, setShowLocked] = useState(true);
  const [shareAchievement, setShareAchievement] = useState<Achievement | null>(null);

  useAchievementRealtimeSync();

  useEffect(() => {
    if (status === 'idle') loadAll();
  }, [status, loadAll]);

  const filtered = useMemo(() => {
    return achievements.filter((a) => {
      if (!showLocked && !a.unlocked) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (rarityFilter !== 'all' && a.rarity !== rarityFilter) return false;
      return true;
    });
  }, [achievements, categoryFilter, rarityFilter, showLocked]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  // Category tabs
  const categoryTabs: TabItem[] = (['all', ...ACHIEVEMENT_CATEGORIES.map((c) => c.id)] as CategoryKey[]).map(
    (k) => {
      const count =
        k === 'all'
          ? totalCount
          : achievements.filter((a) => a.category === k).length;
      return { key: k, label: CATEGORY_LABELS[k], badge: count };
    }
  );

  // Rarity filter chips
  const rarityChips = RARITY_KEYS.map((r) => ({
    key: r,
    label: r === 'all' ? 'All' : `${rarityGlyph(r)} ${rarityLabel(r)}`,
    color: r === 'all' ? undefined : rarityColor(r),
  }));

  const handlePress = useCallback((a: Achievement) => {
    const isHidden = a.isHidden && !a.unlocked;
    const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'default' }> = [];
    if (a.unlocked) {
      buttons.push({ text: 'Share', onPress: () => setShareAchievement(a) });
    }
    buttons.push({ text: 'OK', style: 'cancel' });
    Alert.alert(
      isHidden ? `🔒 Hidden Achievement` : a.unlocked ? `🏆 ${a.title}` : `🔒 ${a.title}`,
      isHidden
        ? 'Keep playing to unlock this achievement!'
        : `${a.description}\n\n${
            a.unlocked
              ? `Unlocked on ${new Date(a.unlockedAt ?? Date.now()).toLocaleDateString()}`
              : a.progressHint ?? 'Not yet unlocked'
          }${
            (a.rewardCoins !== undefined || a.rewardXP !== undefined)
              ? `\n\nReward: ${a.rewardCoins ?? 0} 🪙 • ${a.rewardXP ?? 0} XP`
              : ''
          }`,
      buttons
    );
  }, []);

  const flatListRef = useRef<FlatList>(null);

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

      {/* Category tabs */}
      <SegmentedTabs
        items={categoryTabs}
        activeKey={categoryFilter}
        onChange={(k) => setCategoryFilter(k as CategoryKey)}
      />

      {/* Rarity filter chips */}
      <View style={styles.rarityRow}>
        {rarityChips.map((chip) => (
          <Pressable
            key={chip.key}
            testID={`rarity-filter-${chip.key}`}
            onPress={() => setRarityFilter(chip.key)}
            style={({ pressed }) => [
              styles.rarityChip,
              {
                backgroundColor:
                  rarityFilter === chip.key
                    ? chip.color ?? theme.colors.accent
                    : pressed
                    ? theme.colors.surfaceMuted
                    : theme.colors.surface2,
                borderColor:
                  rarityFilter === chip.key
                    ? chip.color ?? theme.colors.accent
                    : theme.colors.border,
                borderWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.rarityChipText,
                {
                  color:
                    rarityFilter === chip.key
                      ? '#FFFFFF'
                      : chip.color ?? theme.colors.textSecondary,
                },
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={[
          styles.toggleRow,
          { paddingHorizontal: theme.spacing.lg },
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
        ref={flatListRef}
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
              testID={`achievement-card-${item.id}`}
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

      {/* Share sheet modal */}
      {shareAchievement && (
        <View style={styles.shareSheetOverlay}>
          <Pressable
            style={styles.shareOverlayBackdrop}
            onPress={() => setShareAchievement(null)}
          />
          <View
            style={[
              styles.shareSheet,
              { backgroundColor: theme.colors.bg },
            ]}
          >
            <AchievementShareSheet
              achievement={shareAchievement}
              onClose={() => setShareAchievement(null)}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  rarityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  rarityChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  rarityChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
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
  shareSheetOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  shareOverlayBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  shareSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
});
