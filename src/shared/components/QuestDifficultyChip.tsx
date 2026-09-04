/**
 * QuestDifficultyChip
 *
 * Color-coded chip hiển thị quest difficulty (Easy/Medium/Hard/Epic).
 * Step 6 — xem docs/steps/step-06-quests-upgrade.md.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  QuestDifficulty,
  getDifficultyMeta,
} from '../../api/achievementTypes';

interface QuestDifficultyChipProps {
  difficulty: QuestDifficulty;
  size?: 'sm' | 'md';
}

export function QuestDifficultyChip({ difficulty, size = 'sm' }: QuestDifficultyChipProps) {
  const meta = getDifficultyMeta(difficulty);
  if (!meta) return null;
  return (
    <View
      testID={`quest-difficulty-${difficulty}`}
      style={[
        styles.chip,
        size === 'sm' ? styles.chipSm : styles.chipMd,
        { backgroundColor: meta.tint },
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: meta.textColor },
        ]}
      >
        {meta.emoji} {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  chipSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
