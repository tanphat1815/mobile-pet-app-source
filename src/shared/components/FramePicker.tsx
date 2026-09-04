/**
 * FramePicker
 *
 * Grid avatar frames cho edit modal. Hiển thị locked vs unlocked.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  AVATAR_FRAMES,
  rarityColor,
  defaultUnlockedFrameIds,
} from '../../api/avatarFrames';
import { useTheme } from '../../utils/useTheme';
import { AvatarFrame } from './AvatarFrame';
import { hapticLight } from '../../utils/haptics';

export interface FramePickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function FramePicker({ selected, onSelect }: FramePickerProps) {
  const theme = useTheme();
  const unlocked = defaultUnlockedFrameIds();

  return (
    <View testID="frame-picker" style={styles.grid}>
      {AVATAR_FRAMES.map((frame) => {
        const isUnlocked = unlocked.has(frame.id);
        const isSelected = frame.id === selected;
        return (
          <Pressable
            key={frame.id}
            testID={`frame-picker-${frame.id}`}
            disabled={!isUnlocked}
            onPress={() => {
              hapticLight();
              onSelect(frame.id);
            }}
            style={({ pressed }) => [
              styles.cell,
              {
                borderColor: isSelected
                  ? theme.colors.accent
                  : theme.colors.border,
                backgroundColor: pressed
                  ? theme.colors.surfaceMuted
                  : theme.colors.surface,
                opacity: isUnlocked ? 1 : 0.45,
              },
            ]}
          >
            <AvatarFrame frame={frame} size={44} />
            <View style={styles.cellLabel}>
              <Text
                style={[
                  styles.cellName,
                  { color: theme.colors.text },
                ]}
              >
                {frame.name}
              </Text>
              <Text
                style={[
                  styles.cellRarity,
                  { color: rarityColor(frame.rarity) },
                ]}
              >
                {frame.rarity.toUpperCase()}
              </Text>
              {!isUnlocked && (
                <Text style={styles.lockedLabel}>🔒 {frame.price} 🪙</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    gap: 10,
  },
  cellLabel: {
    flex: 1,
  },
  cellName: {
    fontSize: 13,
    fontWeight: '700',
  },
  cellRarity: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  lockedLabel: {
    fontSize: 10,
    marginTop: 2,
    color: '#9CA3AF',
  },
});
