/**
 * AdventureHomeScreen — Step 12c
 *
 * Main adventure hub:
 *  - Active adventure card (progress bar + timer + rewards/encounters count)
 *  - Location grid (5 locations with lock/unlock + start button)
 *  - History tab (recent adventures)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import {
  useAdventureStore,
  selectCurrentAdventure,
  selectIsOnAdventure,
  selectProgress,
  selectRemainingSec,
  selectHistory,
} from '../../stores/AdventureStore';
import {
  LOCATIONS,
  formatDuration,
  rarityColor,
  rarityLabel,
  type Location,
  type AdventureSession,
  type AdventureHistoryEntry,
} from '../../api/adventure';
import { CustomSlider } from '../../shared/components/CustomSlider';
import { Button } from '../../shared/components/Button';
// Side-effect: install dev exposes (Step 12c)
import '../../api/adventureDev';

type Tab = 'locations' | 'history';

const LOCATION_ORDER = ['park', 'beach', 'forest', 'city', 'mountain'];

// Pet stats stub — in a real app these come from the pet store
const PET_STATS = { level: 20, energy: 100 };

export function AdventureHomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('locations');

  const currentAdventure = useAdventureStore(selectCurrentAdventure);
  const isOnAdventure = useAdventureStore(selectIsOnAdventure);
  const progress = useAdventureStore(selectProgress);
  const remainingSec = useAdventureStore(selectRemainingSec);
  const history = useAdventureStore(selectHistory);
  const startAdventure = useAdventureStore((s) => s.startAdventure);
  const completeAdventure = useAdventureStore((s) => s.completeAdventure);
  const cancelAdventure = useAdventureStore((s) => s.cancelAdventure);
  const tickCountdown = useAdventureStore((s) => s.tickCountdown);
  const checkCompletion = useAdventureStore((s) => s.checkCompletion);
  const hydrate = useAdventureStore((s) => s.hydrate);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Poll timer — tick every second
  useEffect(() => {
    if (!isOnAdventure) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      tickCountdown(1);
      if (checkCompletion()) {
        // Auto-complete
        hapticSuccess();
        const result = completeAdventure(PET_STATS);
        if (result.success) {
          Alert.alert(
            '🎉 Thám hiểm hoàn thành!',
            `Bạn nhận được ${result.xpEarned} XP và ${currentAdventure?.rewards.length ?? 0} vật phẩm!`,
            [{ text: 'OK' }]
          );
        }
      }
    }, 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOnAdventure, tickCountdown, checkCompletion, completeAdventure, currentAdventure]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>🏔️ Cuộc Phiêu Lưu</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          5 địa điểm · Nhặt kho báu · Gặp gỡ sinh vật
        </Text>
      </View>

      {/* Tabs */}
      <View
        style={[styles.tabs, { borderBottomColor: theme.colors.border }]}
      >
        {(['locations', 'history'] as Tab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => { hapticLight(); setTab(t); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`adv-tab-${t}`}
              style={[
                styles.tab,
                {
                  borderBottomColor: active ? theme.colors.accent : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: active ? '700' : '500',
                  color: active ? theme.colors.accent : theme.colors.textSecondary,
                }}
              >
                {t === 'locations' ? '📍 Địa điểm' : '📜 Lịch sử'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* Active adventure banner */}
        {isOnAdventure && currentAdventure && (
          <ActiveAdventureCard
            adventure={currentAdventure}
            progress={progress}
            remainingSec={remainingSec}
            formatTimer={formatTimer}
            onComplete={() => {
              const result = completeAdventure(PET_STATS);
              if (result.success) {
                Alert.alert(
                  '🎉 Hoàn thành!',
                  `+${result.xpEarned} XP · ${currentAdventure.rewards.length} vật phẩm`,
                  [{ text: 'OK' }]
                );
              }
            }}
            onCancel={() => {
              Alert.alert(
                'Hủy chuyến thám hiểm?',
                'Pet sẽ quay về nhà nhưng không nhận được phần thưởng.',
                [
                  { text: 'Không', style: 'cancel' },
                  {
                    text: 'Hủy',
                    style: 'destructive',
                    onPress: cancelAdventure,
                  },
                ]
              );
            }}
          />
        )}

        {tab === 'locations' && (
          <LocationsTab
            isOnAdventure={isOnAdventure}
            startAdventure={startAdventure}
            petStats={PET_STATS}
          />
        )}
        {tab === 'history' && (
          <HistoryTab history={history} />
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function ActiveAdventureCard({
  adventure,
  progress,
  remainingSec,
  formatTimer,
  onComplete,
  onCancel,
}: {
  adventure: AdventureSession;
  progress: number;
  remainingSec: number;
  formatTimer: (s: number) => string;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const completed = progress >= 1;

  return (
    <View
      testID="adv-active-card"
      style={[
        styles.activeCard,
        {
          backgroundColor: theme.colors.surface,
          borderColor: completed ? '#4ECDC4' : theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: 16,
        },
      ]}
    >
      <View style={styles.activeHeader}>
        <Text style={{ fontSize: 28 }}>{adventure.locationEmoji}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.activeTitle, { color: theme.colors.text }]}>
            Đang khám phá: {adventure.locationName}
          </Text>
          <Text style={[styles.activeSub, { color: theme.colors.textSecondary }]}>
            {completed ? '✅ Hoàn thành!' : `Còn lại: ${formatTimer(remainingSec)}`}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <CustomSlider
          value={Math.min(1, progress)}
          onChange={() => {}}
          fillColor={completed ? '#4ECDC4' : theme.colors.accent}
          trackColor={theme.colors.border}
          testID="adv-progress"
          height={10}
        />
      </View>

      <View style={styles.activeStats}>
        <View style={styles.activeStat}>
          <Text style={{ fontSize: 20 }}>🎁</Text>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {adventure.rewards.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Vật phẩm</Text>
        </View>
        <View style={styles.activeStat}>
          <Text style={{ fontSize: 20 }}>✨</Text>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {adventure.encounters.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Gặp gỡ</Text>
        </View>
        <View style={styles.activeStat}>
          <Text style={{ fontSize: 20 }}>⚡</Text>
          <Text style={[styles.statVal, { color: theme.colors.text }]}>
            {adventure.energyCost}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Thể lực</Text>
        </View>
      </View>

      {/* Latest events */}
      {(adventure.encounters.length > 0 || adventure.rewards.length > 0) && (
        <View style={{ marginTop: 10 }}>
          {adventure.encounters.slice(-2).map((e, i) => (
            <Text
              key={`enc-${i}`}
              style={[styles.eventLine, { color: theme.colors.textSecondary }]}
            >
              {e.icon} {e.msg}
            </Text>
          ))}
          {adventure.rewards.slice(-2).map((r, i) => (
            <Text
              key={`rew-${i}`}
              style={[styles.eventLine, { color: rarityColor(r.rarity) }]}
            >
              🎁 {r.itemId} ({rarityLabel(r.rarity)})
            </Text>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Hủy"
            onPress={onCancel}
            variant="ghost"
            size="sm"
            testID="adv-cancel"
          />
        </View>
        {completed && (
          <View style={{ flex: 1 }}>
            <Button
              title="Nhận thưởng 🎉"
              onPress={onComplete}
              variant="primary"
              size="sm"
              testID="adv-complete"
            />
          </View>
        )}
      </View>
    </View>
  );
}

function LocationsTab({
  isOnAdventure,
  startAdventure,
  petStats,
}: {
  isOnAdventure: boolean;
  startAdventure: (id: string, stats: any) => { success: boolean; error?: string };
  petStats: any;
}) {
  const theme = useTheme();
  const unlockedLocations = useAdventureStore((s) => s.unlockedLocations);

  return (
    <View testID="adv-locations-tab">
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Chọn địa điểm
      </Text>
      {LOCATION_ORDER.map((locId) => {
        const loc = LOCATIONS[locId];
        const unlocked = unlockedLocations.includes(locId);
        const locked = !unlocked;

        return (
          <View
            key={locId}
            testID={`adv-location-${locId}`}
            style={[
              styles.locationCard,
              {
                backgroundColor: locked ? theme.colors.surfaceAlt : theme.colors.surface,
                borderColor: locked ? theme.colors.border : theme.colors.border,
                borderRadius: theme.radius.lg,
                opacity: isOnAdventure || locked ? 0.7 : 1,
              },
            ]}
          >
            <View style={styles.locationLeft}>
              <Text style={{ fontSize: 32 }}>{loc.emoji}</Text>
              {locked && (
                <View style={[styles.lockBadge, { backgroundColor: theme.colors.textSecondary + '33' }]}>
                  <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>🔒</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.locName, { color: theme.colors.text }]}>
                {loc.displayName}
                {locked && ' 🔒'}
              </Text>
              <Text style={[styles.locDesc, { color: theme.colors.textSecondary }]}>
                {loc.description}
              </Text>
              <View style={styles.locMeta}>
                <Text style={[styles.locMetaText, { color: theme.colors.textSecondary }]}>
                  ⏱ {formatDuration(loc.duration)}
                </Text>
                <Text style={[styles.locMetaText, { color: theme.colors.textSecondary }]}>
                  ⚡ {loc.energyCost}
                </Text>
                <Text style={[styles.locMetaText, { color: theme.colors.textSecondary }]}>
                  🎁 {loc.rewards.rare?.length ?? 0} rare
                </Text>
                <Text style={[styles.locMetaText, { color: theme.colors.textSecondary }]}>
                  Lv.{loc.minLevel}
                </Text>
              </View>
            </View>
            <View style={{ justifyContent: 'center' }}>
              <Pressable
                onPress={() => {
                  if (isOnAdventure || locked) return;
                  hapticLight();
                  const result = startAdventure(locId, petStats);
                  if (!result.success) {
                    Alert.alert('Không thể bắt đầu', result.error);
                  }
                }}
                disabled={isOnAdventure || locked}
                accessibilityRole="button"
                accessibilityState={{ disabled: isOnAdventure || locked }}
                testID={`adv-start-${locId}`}
                style={[
                  styles.startBtn,
                  {
                    backgroundColor: isOnAdventure || locked
                      ? theme.colors.surfaceAlt
                      : theme.colors.accent,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isOnAdventure || locked
                      ? theme.colors.textSecondary
                      : theme.colors.onAccent,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {isOnAdventure ? '⏳' : locked ? '🔒' : '▶ Bắt đầu'}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function HistoryTab({ history }: { history: AdventureHistoryEntry[] }) {
  const theme = useTheme();
  if (history.length === 0) {
    return (
      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text style={{ fontSize: 40 }}>📜</Text>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          Chưa có chuyến thám hiểm nào.
        </Text>
      </View>
    );
  }

  return (
    <View testID="adv-history-tab">
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Lịch sử ({history.length})
      </Text>
      {history.map((entry, idx) => (
        <View
          key={`${entry.startedAt}-${idx}`}
          testID={`adv-history-${idx}`}
          style={[
            styles.historyCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: 12,
              marginBottom: 8,
              opacity: entry.success ? 1 : 0.6,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>{entry.locationEmoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locName, { color: theme.colors.text }]}>
                {entry.locationName}
              </Text>
              <Text style={[styles.locDesc, { color: theme.colors.textSecondary }]}>
                {entry.success ? '✅ Hoàn thành' : '❌ Đã hủy'} · +{entry.xpEarned} XP
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                🎁 {entry.rewards.length}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                ✨ {entry.encounters.length}
              </Text>
            </View>
          </View>
          {entry.rewards.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {entry.rewards.map((r, ri) => (
                <View
                  key={ri}
                  style={[
                    styles.rewardChip,
                    {
                      backgroundColor: rarityColor(r.rarity) + '22',
                      borderColor: rarityColor(r.rarity),
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 10, color: rarityColor(r.rarity) }}>
                    {r.itemId}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  body: { padding: 16 },

  activeCard: { borderWidth: 1, marginBottom: 16 },
  activeHeader: { flexDirection: 'row', alignItems: 'center' },
  activeTitle: { fontSize: 16, fontWeight: '700' },
  activeSub: { fontSize: 12, marginTop: 2 },
  activeStats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  activeStat: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 10 },
  eventLine: { fontSize: 12, marginTop: 4 },

  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  locationLeft: { position: 'relative' },
  lockBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 999,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locName: { fontSize: 15, fontWeight: '700' },
  locDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  locMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  locMetaText: { fontSize: 11 },
  startBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  emptyText: { fontSize: 13, marginTop: 8 },
  historyCard: { borderWidth: 1 },
  rewardChip: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
});
