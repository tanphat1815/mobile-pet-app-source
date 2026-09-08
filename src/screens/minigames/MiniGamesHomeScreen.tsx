/**
 * MiniGamesHomeScreen — Step 12g
 *
 * Lobby for mini-games showing:
 *  - 2 game cards (Catch Fall + Timing) with high scores
 *  - Total games played/won across both games
 *  - Recent plays list
 *  - Tap card → push to CatchFallScreen / TimingGameScreen
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight } from '../../utils/haptics';
import { GAME_IDS, type GameMeta, type GameScore } from '../../api/miniGames';
import { useMiniGamesStore } from '../../stores/MiniGamesStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'MiniGamesHome'>;

export function MiniGamesHomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const hydrate = useMiniGamesStore((s) => s.hydrate);
  const games = useMiniGamesStore((s) => s.selectAllGames());
  const totalPlayed = useMiniGamesStore((s) => s.selectTotalPlayed());
  const totalWins = useMiniGamesStore((s) => s.selectTotalWins());
  const recent = useMiniGamesStore((s) => s.selectRecent(undefined, 8));

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const handleGamePress = (gameId: string) => {
    hapticLight();
    if (gameId === GAME_IDS.CATCH_FALL) {
      navigation.navigate('CatchFall');
    } else {
      navigation.navigate('TimingGame');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 16 + insets.top, backgroundColor: theme.colors.surface2 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>🎯 Mini-games</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {totalPlayed} đã chơi · {totalWins} thắng · Ghi điểm đua cùng Competitions
          </Text>
        </View>

        {/* Game cards */}
        <View style={styles.section}>
          {games.map((meta) => (
            <GameCard
              key={meta.id}
              meta={meta}
              highScore={useMiniGamesStore.getState().selectHighScore(meta.id)}
              onPress={() => handleGamePress(meta.id)}
            />
          ))}
        </View>

        {/* Recent scores */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📊 Lịch sử gần đây</Text>
        {recent.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={{ fontSize: 32 }}>🎮</Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Chưa chơi ván nào. Bấm vào game trên để bắt đầu!
            </Text>
          </View>
        ) : (
          recent.map((r, i) => (
            <RecentRow key={`${r.date}-${i}`} record={r} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

interface CardProps {
  meta: GameMeta;
  highScore: number;
  onPress: () => void;
}

function GameCard({ meta, highScore, onPress }: CardProps) {
  const theme = useTheme();
  return (
    <Pressable
      testID={`mg-card-${meta.id}`}
      onPress={onPress}
      style={[
        styles.gameCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={styles.gameIcon}>{meta.icon}</Text>
      <Text style={[styles.gameName, { color: theme.colors.text }]}>{meta.name}</Text>
      <Text style={[styles.gameDesc, { color: theme.colors.textSecondary }]}>{meta.description}</Text>
      <View style={styles.gameMeta}>
        <View style={[styles.chip, { backgroundColor: theme.colors.accent + '15' }]}>
          <Text style={[styles.chipText, { color: theme.colors.accent }]}>
            🏆 High: {highScore}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: theme.colors.surfaceMuted }]}>
          <Text style={[styles.chipText, { color: theme.colors.textSecondary }]}>
            {meta.duration ? `⏱ ${meta.duration}s` : `🎯 ${10} rounds`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function RecentRow({ record }: { record: GameScore }) {
  const theme = useTheme();
  const meta = useMiniGamesStore.getState().selectMeta(record.gameId);
  return (
    <View
      testID={`mg-recent-${record.gameId}-${record.date}`}
      style={[styles.recentRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Text style={{ fontSize: 22 }}>{meta?.icon ?? '🎮'}</Text>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={[styles.recentName, { color: theme.colors.text }]}>{meta?.name ?? record.gameId}</Text>
        <Text style={[styles.recentMeta, { color: theme.colors.textSecondary }]}>
          {new Date(record.date).toLocaleDateString('vi-VN')} · {record.durationSec}s
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.recentScore, { color: theme.colors.accent }]}>{record.score}</Text>
        <Text style={[styles.recentBadge, { color: record.success ? theme.colors.success : theme.colors.textTertiary }]}>
          {record.success ? '✓ Win' : '✗ Lose'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },

  section: { paddingHorizontal: 16, paddingTop: 16 },
  gameCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    marginBottom: 12,
  },
  gameIcon: { fontSize: 44 },
  gameName: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  gameDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  gameMeta: { flexDirection: 'row', marginTop: 12, gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },

  emptyCard: {
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  emptyText: { fontSize: 13, marginTop: 8, textAlign: 'center' },

  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 6,
  },
  recentName: { fontSize: 14, fontWeight: '600' },
  recentMeta: { fontSize: 12, marginTop: 2 },
  recentScore: { fontSize: 18, fontWeight: '700' },
  recentBadge: { fontSize: 11, fontWeight: '600' },
});
