/**
 * TricksScreen — Step 12e
 *
 * Pet training UI:
 *  - Stats bar (level, treats, total performed, learned count)
 *  - Tabs: Thư viện | Đang học | Đã thuần thục
 *  - Trick cards (emoji + name + difficulty + master state)
 *  - Training modal with practice buttons + treat toggle
 *  - Command input (e.g. "sit", "dance", "shake")
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';
import {
  useTricksStore,
  selectLearned,
  selectAvailable,
  selectCurrentTraining,
  selectTreats,
  selectTotalPerformed,
  selectCooldownRemaining,
} from '../../stores/TricksStore';
import {
  TRICK_CATEGORIES,
  TRICK_CATEGORY_LABELS,
  STAGE_LABELS,
  PERFORM_COOLDOWN_MS,
  type AvailableTrick,
  type TrickDef,
} from '../../api/tricks';
import { Button } from '../../shared/components/Button';
import { CustomSlider } from '../../shared/components/CustomSlider';
// Side-effect: install dev exposes
import '../../api/tricksDev';

type Tab = 'library' | 'training' | 'learned';

export function TricksScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('library');
  const [trainingTrickId, setTrainingTrickId] = useState<string | null>(null);
  const [commandDraft, setCommandDraft] = useState('');

  const learned = useTricksStore(selectLearned);
  const available = useTricksStore(selectAvailable);
  const currentTraining = useTricksStore(selectCurrentTraining);
  const treats = useTricksStore(selectTreats);
  const totalPerformed = useTricksStore(selectTotalPerformed);
  const cooldownMs = useTricksStore(selectCooldownRemaining);

  const learnAction = useTricksStore((s) => s.learnTrickAction);
  const practiceAction = useTricksStore((s) => s.practiceTrickAction);
  const performAction = useTricksStore((s) => s.performTrickAction);
  const performCommand = useTricksStore((s) => s.performCommandAction);
  const cancelTraining = useTricksStore((s) => s.cancelTraining);
  const addTreats = useTricksStore((s) => s.addTreats);
  const hydrate = useTricksStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Auto-open training modal when starting a new training
  useEffect(() => {
    if (currentTraining) setTrainingTrickId(currentTraining.trickId);
  }, [currentTraining?.trickId]);

  const handlePractice = (useTreat: boolean) => {
    if (!currentTraining) return;
    hapticLight();
    const result = practiceAction(currentTraining.trickId, useTreat);
    if (result.mastered) {
      hapticSuccess();
      Alert.alert('🎉 Thuần thục!', result.message, [
        { text: 'OK', onPress: () => setTrainingTrickId(null) },
      ]);
    } else if (!result.success) {
      hapticError();
      Alert.alert('Chưa thành công', result.message);
    }
  };

  const handlePerform = (trickId: string) => {
    hapticLight();
    const result = performAction(trickId);
    if (result.success) {
      hapticSuccess();
      Alert.alert('🌟 Biểu diễn xuất sắc!', result.message);
    } else {
      hapticError();
      Alert.alert('Không thể', result.message);
    }
  };

  const handleCommand = () => {
    const cmd = commandDraft.trim();
    if (!cmd) return;
    hapticLight();
    const result = performCommand(cmd);
    if (result.success) {
      hapticSuccess();
      Alert.alert(`✨ "${cmd}"`, result.message);
      setCommandDraft('');
    } else {
      hapticError();
      Alert.alert('Không thực hiện được', result.message);
    }
  };

  const cooldownSec = Math.ceil(cooldownMs / 1000);

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
        <Text style={[styles.title, { color: theme.colors.text }]}>🎓 Huấn luyện Trick</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {learned.length} thuần thục · {totalPerformed} biểu diễn · {treats} treats 🍖
        </Text>

        {cooldownMs > 0 && (
          <View style={[styles.cooldownPill, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>
              ⏳ Cooldown {cooldownSec}s
            </Text>
          </View>
        )}
      </View>

      {/* Command input */}
      <View
        style={[
          styles.cmdRow,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
            paddingHorizontal: 12,
          },
        ]}
      >
        <TextInput
          value={commandDraft}
          onChangeText={setCommandDraft}
          placeholder='Lệnh: "sit", "dance", "shake"…'
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleCommand}
          testID="tricks-command-input"
          style={[
            styles.cmdInput,
            {
              backgroundColor: theme.colors.surfaceAlt,
              color: theme.colors.text,
              borderRadius: theme.radius.lg,
              borderColor: theme.colors.border,
            },
          ]}
        />
        <Pressable
          onPress={handleCommand}
          disabled={!commandDraft.trim()}
          accessibilityRole="button"
          testID="tricks-command-send"
          style={[
            styles.cmdSend,
            {
              backgroundColor: commandDraft.trim() ? theme.colors.accent : theme.colors.surfaceAlt,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Text style={{ color: commandDraft.trim() ? theme.colors.onAccent : theme.colors.textSecondary, fontSize: 18 }}>➤</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: theme.colors.border }]}>
        {([
          { id: 'library', label: '📚 Thư viện' },
          { id: 'training', label: '🎯 Đang học' },
          { id: 'learned', label: '⭐ Thuần thục' },
        ] as { id: Tab; label: string }[]).map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => { hapticLight(); setTab(t.id); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`tricks-tab-${t.id}`}
              style={[
                styles.tab,
                { borderBottomColor: active ? theme.colors.accent : 'transparent' },
              ]}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? '700' : '500',
                  color: active ? theme.colors.accent : theme.colors.textSecondary,
                }}
              >
                {t.label}
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
        {tab === 'library' && (
          <LibraryTab
            available={available}
            onLearn={(id) => {
              hapticLight();
              const r = learnAction(id);
              if (!r.success) {
                hapticError();
                Alert.alert('Không thể học', r.error || 'Lỗi');
              } else {
                hapticSuccess();
                setTrainingTrickId(id);
              }
            }}
          />
        )}
        {tab === 'training' && (
          <TrainingTab
            currentTraining={currentTraining}
            available={available}
            onPractice={handlePractice}
            onCancel={() => {
              Alert.alert('Hủy huấn luyện?', 'Tiến độ sẽ bị reset.', [
                { text: 'Không', style: 'cancel' },
                { text: 'Hủy', style: 'destructive', onPress: () => { cancelTraining(); setTrainingTrickId(null); } },
              ]);
            }}
            onOpenModal={(id) => setTrainingTrickId(id)}
          />
        )}
        {tab === 'learned' && (
          <LearnedTab
            learned={learned}
            cooldownMs={cooldownMs}
            onPerform={handlePerform}
            onAddTreats={addTreats}
          />
        )}
      </ScrollView>

      {/* Training modal */}
      <TrainingModal
        visible={!!trainingTrickId && !!currentTraining}
        trickId={trainingTrickId}
        currentTraining={currentTraining}
        available={available}
        treats={treats}
        onPractice={handlePractice}
        onClose={() => setTrainingTrickId(null)}
        onAddTreats={addTreats}
      />
    </View>
  );
}

// ─── Sub-views ─────────────────────────────────────────────────

function LibraryTab({
  available,
  onLearn,
}: {
  available: AvailableTrick[];
  onLearn: (id: string) => void;
}) {
  const theme = useTheme();
  return (
    <View testID="tricks-library-tab">
      {TRICK_CATEGORIES.map((cat) => {
        const tricks = available.filter((t) => t.category === cat);
        if (!tricks.length) return null;
        return (
          <View key={cat} style={{ marginBottom: 16 }}>
            <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>
              {TRICK_CATEGORY_LABELS[cat]} ({tricks.length})
            </Text>
            {tricks.map((trick) => (
              <TrickCard
                key={trick.id}
                trick={trick}
                onLearn={() => onLearn(trick.id)}
                theme={theme}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function TrainingTab({
  currentTraining,
  available,
  onPractice,
  onCancel,
  onOpenModal,
}: {
  currentTraining: ReturnType<typeof selectCurrentTraining>;
  available: AvailableTrick[];
  onPractice: (useTreat: boolean) => void;
  onCancel: () => void;
  onOpenModal: (id: string) => void;
}) {
  const theme = useTheme();

  if (!currentTraining) {
    return (
      <View testID="tricks-training-empty">
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceAlt }]}>
          <Text style={{ fontSize: 36 }}>🎯</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Chưa có buổi huấn luyện nào
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
            Vào tab Thư viện để bắt đầu học trick cho bé pet nhé!
          </Text>
        </View>
      </View>
    );
  }

  const trick = available.find((t) => t.id === currentTraining.trickId);
  if (!trick) return null;

  return (
    <View testID="tricks-training-tab">
      <Pressable
        onPress={() => onOpenModal(trick.id)}
        style={[
          styles.bigCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.accent,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Text style={{ fontSize: 56 }}>{trick.emoji}</Text>
        <Text style={[styles.bigCardTitle, { color: theme.colors.text }]}>
          {trick.displayName}
        </Text>
        <Text style={[styles.bigCardDesc, { color: theme.colors.textSecondary }]}>
          {trick.description}
        </Text>
        <View style={styles.trickMetaRow}>
          <Text style={[styles.trickMeta, { color: theme.colors.textSecondary }]}>
            ⚡ Độ khó {trick.difficulty}/5
          </Text>
          <Text style={[styles.trickMeta, { color: theme.colors.textSecondary }]}>
            🎯 Lv.{trick.unlockLevel}
          </Text>
          <Text style={[styles.trickMeta, { color: theme.colors.textSecondary }]}>
            🏷 {TRICK_CATEGORY_LABELS[trick.category]}
          </Text>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <Button
            title="❌ Hủy huấn luyện"
            onPress={onCancel}
            variant="ghost"
            size="md"
            testID="tricks-cancel"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="🎯 Luyện tập"
            onPress={() => onOpenModal(trick.id)}
            variant="primary"
            size="md"
            testID="tricks-open-modal"
          />
        </View>
      </View>
    </View>
  );
}

function LearnedTab({
  learned,
  cooldownMs,
  onPerform,
  onAddTreats,
}: {
  learned: (TrickDef & { masteryLevel: number; successCount: number })[];
  cooldownMs: number;
  onPerform: (id: string) => void;
  onAddTreats: (n: number) => void;
}) {
  const theme = useTheme();
  if (!learned.length) {
    return (
      <View testID="tricks-learned-empty" style={{ alignItems: 'center', marginTop: 32 }}>
        <Text style={{ fontSize: 36 }}>⭐</Text>
        <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary, marginTop: 8 }]}>
          Bé pet chưa thuần thục trick nào.
        </Text>
      </View>
    );
  }
  return (
    <View testID="tricks-learned-tab">
      <View style={[styles.helpCard, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.lg }]}>
        <Text style={[styles.helpTitle, { color: theme.colors.text }]}>🍖 Thêm treats</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          {[1, 3, 5].map((n) => (
            <Button
              key={n}
              title={`+${n}`}
              variant="secondary"
              size="sm"
              onPress={() => { hapticLight(); onAddTreats(n); }}
              testID={`tricks-add-treats-${n}`}
            />
          ))}
        </View>
      </View>

      {learned.map((trick) => {
        const isLearned = true;
        const mastery = Math.round((trick.masteryLevel || 1) * 10);
        return (
          <Pressable
            key={trick.id}
            testID={`tricks-learned-${trick.id}`}
            onPress={() => onPerform(trick.id)}
            disabled={cooldownMs > 0}
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                opacity: cooldownMs > 0 ? 0.5 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 32 }}>{trick.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
                {trick.displayName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <CustomSlider
                    value={mastery / 100}
                    onChange={() => {}}
                    fillColor={theme.colors.accent}
                    trackColor={theme.colors.border}
                    height={6}
                  />
                </View>
                <Text style={[styles.masteryText, { color: theme.colors.textSecondary }]}>
                  Mastery {mastery}%
                </Text>
              </View>
              <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>
                Đã biểu diễn {trick.successCount} lần
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: theme.colors.accent }}>▶</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TrickCard({
  trick,
  onLearn,
  theme,
}: {
  trick: AvailableTrick;
  onLearn: () => void;
  theme: any;
}) {
  return (
    <View
      testID={`trick-${trick.id}`}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: trick.isLearned ? theme.colors.accent : theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: trick.canLearn || trick.isLearned ? 1 : 0.55,
        },
      ]}
    >
      <Text style={{ fontSize: 28 }}>{trick.emoji}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]}>
            {trick.displayName}
          </Text>
          {trick.isLearned && (
            <Text style={{ marginLeft: 6, fontSize: 12 }}>⭐</Text>
          )}
          {!trick.levelMet && (
            <Text style={{ marginLeft: 6, fontSize: 10, color: theme.colors.textSecondary }}>
              🔒 Lv.{trick.unlockLevel}
            </Text>
          )}
          {!trick.stageMet && (
            <Text style={{ marginLeft: 6, fontSize: 10, color: theme.colors.textSecondary }}>
              🔒 {STAGE_LABELS[trick.unlockStage]}
            </Text>
          )}
        </View>
        <Text style={[styles.rowSub, { color: theme.colors.textSecondary }]}>
          {trick.description}
        </Text>
        <Text style={[styles.trickMeta, { color: theme.colors.textSecondary, marginTop: 2 }]}>
          ⚡ {trick.difficulty}/5 · 🎯 Lv.{trick.unlockLevel} · 💬 "{trick.command}"
        </Text>
      </View>
      {!trick.isLearned && (
        <Pressable
          onPress={trick.canLearn ? onLearn : undefined}
          disabled={!trick.canLearn}
          testID={`trick-learn-${trick.id}`}
          style={[
            styles.learnBtn,
            {
              backgroundColor: trick.canLearn ? theme.colors.accent : theme.colors.surfaceAlt,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <Text
            style={{
              color: trick.canLearn ? theme.colors.onAccent : theme.colors.textSecondary,
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {trick.canLearn ? 'Học' : '🔒'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function TrainingModal({
  visible,
  trickId,
  currentTraining,
  available,
  treats,
  onPractice,
  onClose,
  onAddTreats,
}: {
  visible: boolean;
  trickId: string | null;
  currentTraining: ReturnType<typeof selectCurrentTraining>;
  available: AvailableTrick[];
  treats: number;
  onPractice: (useTreat: boolean) => void;
  onClose: () => void;
  onAddTreats: (n: number) => void;
}) {
  const theme = useTheme();
  const trick = available.find((t) => t.id === trickId);
  if (!trick || !currentTraining) return null;

  const progress = Math.min(1, currentTraining.attempts / (trick.difficulty * 3));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 64 }}>{trick.emoji}</Text>
            <Text style={[styles.bigCardTitle, { color: theme.colors.text }]}>
              {trick.displayName}
            </Text>
            <Text style={[styles.bigCardDesc, { color: theme.colors.textSecondary }]}>
              {trick.description}
            </Text>
          </View>

          {/* Progress bar */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
                Tiến độ
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {currentTraining.attempts} / {trick.difficulty * 3}
              </Text>
            </View>
            <CustomSlider
              value={progress}
              onChange={() => {}}
              fillColor={theme.colors.accent}
              trackColor={theme.colors.border}
              height={10}
              testID="tricks-modal-progress"
            />
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="🥕 Luyện không Treat"
                onPress={() => onPractice(false)}
                variant="secondary"
                size="md"
                testID="tricks-modal-practice"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={`🍖 Dùng Treat (${treats})`}
                onPress={() => treats > 0 && onPractice(true)}
                variant="primary"
                size="md"
                disabled={treats <= 0}
                testID="tricks-modal-treat"
              />
            </View>
          </View>

          {/* Treats info */}
          <View
            style={[
              styles.treatsBar,
              { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md },
            ]}
          >
            <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
              🍖 {treats} treats còn lại
            </Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[1, 3, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => { hapticLight(); onAddTreats(n); }}
                  accessibilityRole="button"
                  testID={`tricks-modal-add-treats-${n}`}
                  hitSlop={6}
                  style={[
                    styles.treatAddBtn,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11, color: theme.colors.text, fontWeight: '600' }}>
                    +{n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={onClose}
            style={{ alignItems: 'center', marginTop: 16 }}
          >
            <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
              Đóng
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  cooldownPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 6,
  },

  cmdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  cmdInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    fontSize: 14,
  },
  cmdSend: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2 },
  body: { padding: 16 },

  categoryTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  trickMeta: { fontSize: 11 },
  trickMetaRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  masteryText: { fontSize: 11, marginLeft: 8 },

  learnBtn: { paddingHorizontal: 12, paddingVertical: 6 },

  bigCard: {
    alignItems: 'center',
    padding: 18,
    borderWidth: 2,
  },
  bigCardTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  bigCardDesc: { fontSize: 12, marginTop: 4, textAlign: 'center', lineHeight: 17 },

  emptyCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptyDesc: { fontSize: 12, marginTop: 4, textAlign: 'center', lineHeight: 17, paddingHorizontal: 12 },

  helpCard: { padding: 12, marginBottom: 12 },
  helpTitle: { fontSize: 13, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    padding: 20,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  treatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginTop: 12,
  },
  treatAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
});
