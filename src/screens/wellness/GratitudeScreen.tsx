/**
 * GratitudeScreen
 *
 * Daily gratitude journal. User types entries → save → list grouped by
 * date. Entries persist via WellnessStore (AsyncStorage).
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
import { groupGratitudeByDate } from '../../api/wellness';
import { hapticLight, hapticSuccess } from '../../utils/haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { WellnessStackParamList } from '../../navigation/wellnessTypes';

type Props = NativeStackScreenProps<WellnessStackParamList, 'Gratitude'>;

export function GratitudeScreen({ navigation }: Props) {
  const theme = useTheme();
  const gratitude = useWellnessStore((s) => s.gratitude);
  const addGratitude = useWellnessStore((s) => s.addGratitude);
  const removeGratitude = useWellnessStore((s) => s.removeGratitude);
  const [draft, setDraft] = useState('');

  const grouped = useMemo(() => groupGratitudeByDate(gratitude), [gratitude]);
  const dates = useMemo(
    () =>
      Object.keys(grouped).sort((a, b) =>
        a < b ? 1 : -1
      ),
    [grouped]
  );

  const handleSave = () => {
    const text = draft.trim();
    if (!text) return;
    hapticSuccess();
    addGratitude(text);
    setDraft('');
  };

  const handleRemove = (id: string) => {
    hapticLight();
    removeGratitude(id);
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
          Gratitude
        </Text>
      </View>

      {/* Input */}
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <View
          style={[
            styles.inputCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.separator,
            },
          ]}
        >
          <TextInput
            testID="gratitude-input"
            value={draft}
            onChangeText={setDraft}
            placeholder="I'm grateful for…"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontSize: theme.typography.size.body,
              },
            ]}
          />
          <Pressable
            testID="gratitude-save"
            onPress={handleSave}
            disabled={draft.trim().length === 0}
            style={[
              styles.saveBtn,
              {
                backgroundColor:
                  draft.trim().length === 0
                    ? theme.colors.surfaceMuted
                    : theme.colors.accent,
              },
            ]}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
        }}
      >
        {dates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>💌</Text>
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Your journal is empty.
            </Text>
          </View>
        ) : (
          dates.map((date) => (
            <View key={date} style={styles.dateGroup}>
              <Text
                style={[
                  styles.dateLabel,
                  { color: theme.colors.textSecondary },
                ]}
                testID={`gratitude-date-${date}`}
              >
                {date}
              </Text>
              {grouped[date].map((entry) => (
                <View
                  key={entry.id}
                  testID={`gratitude-entry-${entry.id}`}
                  style={[
                    styles.entryCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.separator,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.entryContent,
                      { color: theme.colors.text },
                    ]}
                  >
                    {entry.content}
                  </Text>
                  <Pressable
                    testID={`gratitude-delete-${entry.id}`}
                    onPress={() => handleRemove(entry.id)}
                    hitSlop={12}
                  >
                    <Text
                      style={[
                        styles.deleteIcon,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ✕
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {},
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingVertical: 8,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  dateGroup: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  entryContent: {
    flex: 1,
    fontSize: 14,
  },
  deleteIcon: {
    fontSize: 16,
    marginLeft: 12,
  },
});
