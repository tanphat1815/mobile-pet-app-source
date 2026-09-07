/**
 * MoodScreen
 *
 * Mood tracker. User taps a 1-5 score, optionally adds tags + notes,
 * saves → entry persists. History chart at the bottom (last 14 days).
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { useWellnessStore } from '../../stores/WellnessStore';
import {
  moodHistory,
  MoodHistoryPoint,
} from '../../api/wellness';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'Mood'>;

const MOOD_LABELS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😢', label: 'Awful' },
  2: { emoji: '😟', label: 'Sad' },
  3: { emoji: '😐', label: 'Okay' },
  4: { emoji: '🙂', label: 'Good' },
  5: { emoji: '😄', label: 'Great' },
};

const QUICK_TAGS = ['work', 'family', 'health', 'social', 'sleep', 'exercise'];

export function MoodScreen({ navigation }: Props) {
  const theme = useTheme();
  const mood = useWellnessStore((s) => s.mood);
  const addMood = useWellnessStore((s) => s.addMood);
  const [score, setScore] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const history: MoodHistoryPoint[] = useMemo(
    () => moodHistory(mood, 14),
    [mood]
  );

  const toggleTag = (tag: string) => {
    hapticLight();
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    hapticSuccess();
    addMood(score, tags, notes.trim() || undefined);
    setTags([]);
    setNotes('');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: theme.spacing.xxxl,
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 16 }}>← Back</Text>
        </Pressable>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title2,
            fontWeight: '700',
            marginTop: 4,
          }}
        >
          Mood
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxxl,
        }}
      >
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary },
          ]}
        >
          HOW DO YOU FEEL?
        </Text>
        <View style={styles.moodGrid}>
          {([1, 2, 3, 4, 5] as const).map((s) => {
            const active = s === score;
            const meta = MOOD_LABELS[s];
            return (
              <Pressable
                key={s}
                testID={`mood-${s}`}
                onPress={() => {
                  hapticLight();
                  setScore(s);
                }}
                style={[
                  styles.moodCard,
                  {
                    backgroundColor: active
                      ? theme.colors.accent + '20'
                      : theme.colors.surface,
                    borderColor: active
                      ? theme.colors.accent
                      : theme.colors.separator,
                  },
                ]}
              >
                <Text style={{ fontSize: 32 }}>{meta.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    {
                      color: active ? theme.colors.accent : theme.colors.text,
                    },
                  ]}
                >
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 12 }} />

        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary },
          ]}
        >
          TAGS
        </Text>
        <View style={styles.tagRow}>
          {QUICK_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                testID={`mood-tag-${tag}`}
                onPress={() => toggleTag(tag)}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: active
                      ? theme.colors.accent
                      : theme.colors.surfaceMuted,
                    borderColor: active
                      ? theme.colors.accent
                      : theme.colors.separator,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: active ? '#FFF' : theme.colors.text,
                    },
                  ]}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 12 }} />

        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary },
          ]}
        >
          NOTES
        </Text>
        <TextInput
          testID="mood-notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional context…"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          style={[
            styles.notesInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.separator,
            },
          ]}
        />

        <View style={{ height: 16 }} />

        <Pressable
          testID="mood-save"
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: theme.colors.accent }]}
        >
          <Text style={styles.saveBtnText}>Save mood</Text>
        </Pressable>

        <View style={{ height: 24 }} />

        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary },
          ]}
        >
          HISTORY (14 DAYS)
        </Text>
        <View
          style={[
            styles.chart,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.separator,
            },
          ]}
          testID="mood-history-chart"
        >
          {history.map((p, idx) => (
            <View
              key={p.date}
              testID={`mood-history-${idx}`}
              style={styles.chartCol}
            >
              <View
                style={[
                  styles.chartBar,
                  {
                    height: p.score
                      ? `${(p.score / 5) * 100}%`
                      : 2,
                    backgroundColor: p.score
                      ? theme.colors.accent
                      : theme.colors.separator,
                  },
                ]}
              />
              <Text
                style={[
                  styles.chartDate,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {p.date.slice(5)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  moodCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 60,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 110,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    gap: 4,
  },
  chartCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '70%',
    borderRadius: 4,
    minHeight: 2,
  },
  chartDate: {
    fontSize: 8,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
});
