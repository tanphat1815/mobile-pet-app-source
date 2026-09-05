/**
 * CompetitionsScreen — Step 12f
 *
 * Pet competitions & tournaments UI:
 *  - Lobby tab: live + registration + upcoming competitions
 *  - History tab: completed competitions + results
 *  - Stats tab: played, wins, podiums, trophies
 *  - Per-competition card with countdown + register/quick-play actions
 *  - Bracket visualization for BRACKET type competitions
 *  - Leaderboard sheet with player rank + scores
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';
import {
  COMPETITION_STATUS,
  COMPETITION_TYPE_LABELS,
  COMPETITION_STATUS_LABELS,
  formatScore,
  formatTimeRemaining,
  prizeRewardsTotal,
  type Competition,
  type CompetitionResult,
  type LeaderboardEntry,
} from '../../api/competitions';
import {
  useCompetitionsStore,
  startCompetitionsAutoTick,
} from '../../stores/CompetitionsStore';
import { Button } from '../../shared/components/Button';
// Side-effect: install dev exposes
import '../../api/competitionsDev';

type Tab = 'lobby' | 'history' | 'stats';

// ============================================================================
// Main Screen
// ============================================================================

export function CompetitionsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('lobby');
  const [now, setNow] = useState(Date.now());
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  const state = useCompetitionsStore((s) => s.state);
  const hydrate = useCompetitionsStore((s) => s.hydrate);
  const tick = useCompetitionsStore((s) => s.tick);

  useEffect(() => {
    void hydrate();
    const stopTick = startCompetitionsAutoTick();
    return () => stopTick();
  }, [hydrate]);

  // Re-render every second when there is any live or registration comp
  const hasUrgent = useMemo(() => {
    return state.active.some(
      (c) => c.status === COMPETITION_STATUS.IN_PROGRESS || c.status === COMPETITION_STATUS.REGISTRATION
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.active.length, state.active.map((c) => c.instanceId).join('|')]);

  useEffect(() => {
    if (!hasUrgent) return;
    const id = setInterval(() => {
      setNow(Date.now());
      tick();
    }, 1000);
    return () => clearInterval(id);
  }, [hasUrgent, tick]);

  const live = state.active.filter((c) => c.status === COMPETITION_STATUS.IN_PROGRESS);
  const registration = state.active.filter((c) => c.status === COMPETITION_STATUS.REGISTRATION);
  const upcoming = state.active.filter((c) => c.status === COMPETITION_STATUS.UPCOMING);

  const selectedComp = selectedCompId
    ? state.active.find((c) => c.instanceId === selectedCompId) ?? state.history.find((c) => c.instanceId === selectedCompId) ?? null
    : null;

  const headerSubtitle =
    state.active.length === 0
      ? 'Chưa có giải đấu nào'
      : `${state.active.length} giải đang hoạt động · ${state.history.length} đã kết thúc`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 16 + insets.top, backgroundColor: theme.colors.surface2 }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>🏆 Competitions</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{headerSubtitle}</Text>
          <Text style={[styles.statsLine, { color: theme.colors.textTertiary }]}>
            {state.userStats.wins}W · {state.userStats.podiums} podiums · {state.userStats.totalCoinsEarned} 🪙 earned
          </Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { borderColor: theme.colors.border }]}>
          {(['lobby', 'history', 'stats'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              testID={`comp-tab-${t}`}
              style={[
                styles.tabItem,
                tab === t && { borderBottomColor: theme.colors.accent, borderBottomWidth: 2 },
              ]}
              onPress={() => {
                hapticLight();
                setTab(t);
              }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === t ? theme.colors.accent : theme.colors.textSecondary },
                ]}
              >
                {t === 'lobby' ? '🎮 Lobby' : t === 'history' ? '📜 Lịch sử' : '📊 Thống kê'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {tab === 'lobby' && (
          <View style={styles.section}>
            {live.length > 0 && (
              <Section title="🔥 Đang diễn ra" data={live} now={now} onSelect={setSelectedCompId} theme={theme} />
            )}
            {registration.length > 0 && (
              <Section title="📝 Đang mở đăng ký" data={registration} now={now} onSelect={setSelectedCompId} theme={theme} />
            )}
            {upcoming.length > 0 && (
              <Section title="⏳ Sắp mở" data={upcoming} now={now} onSelect={setSelectedCompId} theme={theme} />
            )}
            {state.active.length === 0 && (
              <EmptyState message="Chưa có giải đấu nào. Nhấn nút dưới để tạo!" theme={theme} />
            )}
          </View>
        )}

        {tab === 'history' && (
          <View style={styles.section}>
            {state.history.length === 0 ? (
              <EmptyState message="Chưa có lịch sử giải đấu" theme={theme} />
            ) : (
              state.history.map((c) => (
                <Pressable
                  key={c.instanceId}
                  testID={`comp-history-${c.instanceId}`}
                  onPress={() => {
                    hapticLight();
                    setSelectedCompId(c.instanceId);
                  }}
                  style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                    {c.icon} {c.name}
                  </Text>
                  <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
                    {c.results?.slice(0, 3).map((r) => `#${r.rank} ${r.petName} (${r.score})`).join(' · ') ?? 'Chưa có kết quả'}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        {tab === 'stats' && (
          <View style={styles.section}>
            <StatRow label="🎮 Số giải đã chơi" value={state.userStats.played.toString()} theme={theme} />
            <StatRow label="🥇 Số trận thắng" value={state.userStats.wins.toString()} theme={theme} />
            <StatRow label="🏅 Số lần Top 3" value={state.userStats.podiums.toString()} theme={theme} />
            <StatRow
              label="🪙 Tổng xu thắng"
              value={state.userStats.totalCoinsEarned.toString()}
              theme={theme}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 16 }]}>
              🏆 Trophies ({state.userStats.trophies.length})
            </Text>
            {state.userStats.trophies.length === 0 ? (
              <EmptyState message="Chưa có trophy nào" theme={theme} />
            ) : (
              state.userStats.trophies.map((t, i) => (
                <View
                  key={`${t.date}-${i}`}
                  style={[styles.trophyRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <Text style={{ fontSize: 20 }}>{t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : '🥉'}</Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t.name}</Text>
                    <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]}>
                      {t.compName} · #{t.rank}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Detail modal */}
      {selectedComp && (
        <CompetitionDetailModal
          comp={selectedComp}
          now={now}
          onClose={() => setSelectedCompId(null)}
        />
      )}
    </View>
  );
}

// ============================================================================
// Section
// ============================================================================

interface SectionProps {
  title: string;
  data: Competition[];
  now: number;
  onSelect: (id: string) => void;
  theme: ReturnType<typeof useTheme>;
}

function Section({ title, data, now, onSelect, theme }: SectionProps) {
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {data.map((c) => (
        <CompetitionCard key={c.instanceId} comp={c} now={now} onPress={() => onSelect(c.instanceId)} />
      ))}
    </View>
  );
}

// ============================================================================
// Competition card
// ============================================================================

interface CardProps {
  comp: Competition;
  now: number;
  onPress: () => void;
}

function CompetitionCard({ comp, now, onPress }: CardProps) {
  const theme = useTheme();
  const target = comp.status === COMPETITION_STATUS.REGISTRATION ? comp.startAt : comp.endAt;
  const remaining = formatTimeRemaining(target - now);
  const statusLabel = COMPETITION_STATUS_LABELS[comp.status];
  const typeLabel = COMPETITION_TYPE_LABELS[comp.type];
  const isLive = comp.status === COMPETITION_STATUS.IN_PROGRESS;
  const isReg = comp.status === COMPETITION_STATUS.REGISTRATION;

  const statusColor =
    isLive ? theme.colors.success : isReg ? theme.colors.accent : theme.colors.warning;
  const finalPrize = comp.prizePool[0]?.rewards ?? null;
  const totals = prizeRewardsTotal(finalPrize);

  return (
    <Pressable
      testID={`comp-card-${comp.instanceId}`}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{comp.icon} {comp.name}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={[styles.cardMeta, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {comp.description}
      </Text>

      <View style={styles.metaRow}>
        <MetaChip icon="🎯" label={typeLabel} />
        <MetaChip icon="👥" label={`${comp.currentPlayers}/${comp.maxPlayers}`} />
        <MetaChip icon="⏱" label={remaining} />
      </View>

      <View style={styles.prizeRow}>
        <Text style={[styles.prizeLabel, { color: theme.colors.textTertiary }]}>Top prize:</Text>
        <Text style={[styles.prizeValue, { color: theme.colors.text }]}>
          {totals.coins} 🪙 · {totals.xp} XP
          {totals.items > 0 ? ` · ${totals.items} 🎁` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: theme.colors.surfaceMuted }]}>
      <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
        {icon} {label}
      </Text>
    </View>
  );
}

// ============================================================================
// Detail modal
// ============================================================================

interface DetailProps {
  comp: Competition;
  now: number;
  onClose: () => void;
}

function CompetitionDetailModal({ comp, now, onClose }: DetailProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const register = useCompetitionsStore((s) => s.registerForCompetition);
  const submitScore = useCompetitionsStore((s) => s.submitScoreAction);
  const quickPlay = useCompetitionsStore((s) => s.quickPlayAction);
  const endComp = useCompetitionsStore((s) => s.endCompetitionAction);

  const target = comp.status === COMPETITION_STATUS.REGISTRATION ? comp.startAt : comp.endAt;
  const remaining = formatTimeRemaining(target - now);

  const participant = comp.participants.find((p) => p.userCode === 'player');
  const isPlayerIn = !!participant;

  const handleRegister = () => {
    hapticLight();
    const result = register(comp.instanceId, 'Bé Thú Cưng', 9999);
    if (result.success) {
      hapticSuccess();
      Alert.alert('🎉 Đăng ký thành công!', result.message);
    } else {
      hapticError();
      Alert.alert('Không thể', result.message);
    }
  };

  const handleQuickPlay = () => {
    hapticLight();
    const result = quickPlay(comp.instanceId, 'Bé Thú Cưng');
    if (result.success) {
      hapticSuccess();
    } else {
      hapticError();
      Alert.alert('Không thể', result.message ?? 'Lỗi');
    }
  };

  const handleSubmitTest = () => {
    hapticLight();
    const score = 100 + Math.floor(Math.random() * 900);
    const result = submitScore(comp.instanceId, score);
    if (result.success) {
      hapticSuccess();
      Alert.alert('🎯 Ghi điểm!', `+${score} điểm (cao nhất: ${result.highestScore})`);
    } else {
      hapticError();
      Alert.alert('Không thể', result.message ?? 'Lỗi');
    }
  };

  const handleEnd = () => {
    Alert.alert(
      'Kết thúc giải đấu?',
      'Giải sẽ được đưa vào lịch sử và trao giải thưởng.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Kết thúc',
          style: 'destructive',
          onPress: () => {
            const result = endComp(comp.instanceId);
            if (result) {
              hapticSuccess();
              Alert.alert(
                '🏁 Đã trao giải!',
                result.userPrize
                  ? `Bạn nhận: ${prizeRewardsTotal(result.userPrize).coins} 🪙 + ${prizeRewardsTotal(result.userPrize).xp} XP`
                  : 'Cảm ơn bạn đã tham gia!',
                [{ text: 'OK', onPress: onClose }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.bg, paddingBottom: 16 + insets.bottom }]}>
          <ScrollView>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{comp.icon} {comp.name}</Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>{comp.description}</Text>

            <View style={[styles.statusBar, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
              <Text style={[styles.statusLabel, { color: theme.colors.textTertiary }]}>
                {COMPETITION_STATUS_LABELS[comp.status]}
              </Text>
              <Text style={[styles.statusTimer, { color: theme.colors.text }]} testID={`comp-detail-timer`}>
                {remaining}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <MetaChip icon="🎯" label={COMPETITION_TYPE_LABELS[comp.type]} />
              <MetaChip icon="👥" label={`${comp.currentPlayers}/${comp.maxPlayers}`} />
              <MetaChip icon="💰" label={`${comp.entryFee} xu`} />
            </View>

            {/* Prize tiers */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🏆 Bảng giải thưởng</Text>
            {comp.prizePool.map((tier, idx) => {
              const totals = prizeRewardsTotal(tier.rewards);
              return (
                <View
                  key={`${tier.rank}-${idx}`}
                  testID={`comp-prize-tier-${tier.rank}`}
                  style={[styles.prizeRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.prizeRank, { color: theme.colors.text }]}>#{tier.rank}</Text>
                  <Text style={[styles.prizeValue, { color: theme.colors.text }]}>
                    {totals.coins} 🪙 · {totals.xp} XP{totals.items > 0 ? ` · ${totals.items} 🎁` : ''}
                  </Text>
                </View>
              );
            })}

            {/* Bracket if BRACKET */}
            {comp.type === 'bracket' && comp.bracket && comp.bracket.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 16 }]}>🎯 Cây đấu</Text>
                {comp.bracket.map((round) => (
                  <View key={round.round} style={styles.roundBlock}>
                    <Text style={[styles.roundName, { color: theme.colors.textSecondary }]}>{round.name}</Text>
                    {round.matches.map((m) => (
                      <View
                        key={m.matchId}
                        style={[styles.matchRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                      >
                        <Text style={[styles.matchName, { color: theme.colors.text }]}>
                          {m.player1?.petName ?? 'TBD'} ({m.score1})
                        </Text>
                        <Text style={[styles.matchName, { color: theme.colors.text }]}>
                          {m.player2?.petName ?? 'TBD'} ({m.score2})
                        </Text>
                        <Text style={[styles.matchWinner, { color: theme.colors.success }]}>
                          → {m.winner?.petName ?? '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}

            {/* Player status */}
            {isPlayerIn && (
              <View style={[styles.playerStatus, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🐾 Bé Thú Cưng</Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Highest: {participant.highestScore} · Total: {participant.totalScore} · Submissions: {participant.submissionCount}
                </Text>
              </View>
            )}

            {/* Results (if completed) */}
            {comp.status === COMPETITION_STATUS.COMPLETED && comp.results && (
              <>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 16 }]}>📊 Kết quả</Text>
                {comp.results.slice(0, 10).map((r) => (
                  <ResultRow key={`${r.userCode}-${r.rank}`} result={r} />
                ))}
              </>
            )}
          </ScrollView>

          {/* Action bar */}
          <View style={styles.actionBar}>
            {comp.status === COMPETITION_STATUS.REGISTRATION && !isPlayerIn && (
              <Button title="📝 Đăng ký" onPress={handleRegister} variant="primary" testID="comp-detail-register" />
            )}
            {comp.status === COMPETITION_STATUS.IN_PROGRESS && isPlayerIn && (
              <>
                <Button title="🎮 Quick Play" onPress={handleQuickPlay} variant="primary" testID="comp-detail-quick-play" />
                <View style={{ width: 8 }} />
                <Button title="🎯 Submit" onPress={handleSubmitTest} variant="secondary" testID="comp-detail-submit" />
              </>
            )}
            {comp.status !== COMPETITION_STATUS.COMPLETED && (
              <View style={{ width: 8 }} />
            )}
            <Button title="🏅 Bảng xếp hạng" onPress={() => setShowLeaderboard(true)} variant="ghost" testID="comp-detail-leaderboard" />
            <View style={{ width: 8 }} />
            <Button title="Kết thúc" onPress={handleEnd} variant="ghost" testID="comp-detail-end" />
            <View style={{ width: 8 }} />
            <Button title="Đóng" onPress={onClose} variant="ghost" testID="comp-detail-close" />
          </View>
        </View>
      </View>

      {showLeaderboard && (
        <LeaderboardSheet comp={comp} onClose={() => setShowLeaderboard(false)} />
      )}
    </Modal>
  );
}

// ============================================================================
// Leaderboard sheet
// ============================================================================

interface LeaderboardProps {
  comp: Competition;
  onClose: () => void;
}

function LeaderboardSheet({ comp, onClose }: LeaderboardProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const entries = useCompetitionsStore((s) =>
    s.selectLeaderboard(comp.instanceId, 'player')
  );

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.leaderboardSheet, { backgroundColor: theme.colors.bg, paddingBottom: 16 + insets.bottom }]}>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>🏅 Bảng xếp hạng</Text>
          <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>{comp.name}</Text>
          <ScrollView>
            {entries.length === 0 && <EmptyState message="Chưa có dữ liệu" theme={theme} />}
            {entries.map((e) => (
              <View
                key={`${e.userCode}-${e.rank}`}
                testID={`comp-leaderboard-entry-${e.rank}`}
                style={[
                  styles.leaderboardRow,
                  {
                    backgroundColor: e.isYou ? theme.colors.accent + '15' : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.rankBadge, { color: theme.colors.text }]}>#{e.rank}</Text>
                <Text style={{ fontSize: 18 }}>{e.avatar}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>
                    {e.petName} {e.isBot ? '🤖' : ''} {e.isYou ? '(Bạn)' : ''}
                  </Text>
                  <Text style={[styles.leaderboardScore, { color: theme.colors.textSecondary }]}>
                    High: {formatScore(e.highestScore)} · Total: {formatScore(e.totalScore)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <Button title="Đóng" onPress={onClose} variant="ghost" testID="comp-leaderboard-close" />
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Result row
// ============================================================================

function ResultRow({ result }: { result: CompetitionResult }) {
  const theme = useTheme();
  const totals = prizeRewardsTotal(result.prize);
  const rankColor = result.rank === 1 ? theme.colors.warning : result.rank === 2 ? theme.colors.textTertiary : theme.colors.textSecondary;
  return (
    <View
      testID={`comp-result-${result.rank}`}
      style={[styles.resultRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <Text style={[styles.resultRank, { color: rankColor }]}>#{result.rank}</Text>
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={[styles.leaderboardName, { color: theme.colors.text }]}>
          {result.petName} {result.isBot ? '🤖' : ''}
        </Text>
        <Text style={[styles.leaderboardScore, { color: theme.colors.textSecondary }]}>
          {result.score} điểm
          {totals.coins ? ` · ${totals.coins} 🪙` : ''}
          {totals.xp ? ` · ${totals.xp} XP` : ''}
          {totals.items > 0 ? ` · ${totals.items} 🎁` : ''}
        </Text>
      </View>
    </View>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function EmptyState({ message, theme }: { message: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.empty, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={{ fontSize: 32 }}>🎪</Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

function StatRow({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.statRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4 },
  statsLine: { fontSize: 13, marginTop: 4 },

  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabLabel: { fontSize: 14, fontWeight: '600' },

  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 8 },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  cardMeta: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  metaRow: { flexDirection: 'row', marginTop: 10, gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },

  prizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  prizeLabel: { fontSize: 12 },
  prizeValue: { fontSize: 13, fontWeight: '600' },

  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    height: '88%',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  modalSubtitle: { fontSize: 14, marginTop: 4 },

  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  statusLabel: { fontSize: 13 },
  statusTimer: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },

  prizeRank: { width: 50, fontSize: 14, fontWeight: '700' },

  roundBlock: { marginBottom: 10 },
  roundName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  matchRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  matchName: { fontSize: 13 },
  matchWinner: { fontSize: 12, marginTop: 4, fontWeight: '700' },

  playerStatus: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },

  actionBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  leaderboardSheet: {
    height: '70%',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  rankBadge: { fontSize: 14, fontWeight: '700', width: 36 },
  leaderboardName: { fontSize: 14, fontWeight: '600' },
  leaderboardScore: { fontSize: 12, marginTop: 2 },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  resultRank: { fontSize: 18, fontWeight: '700', width: 36 },

  empty: {
    padding: 24,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyText: { fontSize: 13, marginTop: 8, textAlign: 'center' },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 16, fontWeight: '700' },

  trophyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
});
