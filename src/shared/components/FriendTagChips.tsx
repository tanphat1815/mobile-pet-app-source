/**
 * FriendTagChips
 *
 * Display + add/remove tag chips cho 1 friend. Read-only mode khi `editable=false`.
 * Step 4 — xem docs/steps/step-04-friends-advanced.md.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  FriendTag,
  FRIEND_TAGS,
  getFriendTagMeta,
} from '../../api/friendTypes';
import { hapticLight } from '../../utils/haptics';

interface FriendTagChipsProps {
  tags: FriendTag[];
  /** Show all + add button */
  editable?: boolean;
  onAdd?: (tag: FriendTag) => void;
  onRemove?: (tag: FriendTag) => void;
  /** Max visible. Overflow → +N chip. */
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export function FriendTagChips({
  tags,
  editable = false,
  onAdd,
  onRemove,
  maxVisible = 3,
  size = 'sm',
}: FriendTagChipsProps) {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const visibleTags = tags.slice(0, maxVisible);
  const overflow = tags.length - visibleTags.length;

  const chipStyle = size === 'sm' ? styles.chipSm : styles.chipMd;
  const textStyle = size === 'sm' ? styles.chipTextSm : styles.chipTextMd;

  return (
    <View
      style={styles.row}
      accessibilityLabel={`Friend tags: ${tags.join(', ') || 'none'}`}
    >
      {visibleTags.map((tagId) => {
        const meta = getFriendTagMeta(tagId);
        if (!meta) return null;
        return (
          <Pressable
            key={tagId}
            testID={`friend-tag-${tagId}`}
            onPress={
              editable && onRemove
                ? () => {
                    hapticLight();
                    onRemove(tagId);
                  }
                : undefined
            }
            accessibilityRole={editable ? 'button' : 'text'}
            style={[
              styles.chip,
              chipStyle,
              { backgroundColor: meta.tint },
            ]}
          >
            <Text style={[textStyle, { color: meta.textColor }]}>
              {meta.icon} {meta.label}
              {editable ? ' ✕' : ''}
            </Text>
          </Pressable>
        );
      })}
      {overflow > 0 ? (
        <View
          testID="friend-tag-overflow"
          style={[
            styles.chip,
            chipStyle,
            { backgroundColor: theme.colors.surfaceMuted },
          ]}
        >
          <Text style={[textStyle, { color: theme.colors.textSecondary }]}>
            +{overflow}
          </Text>
        </View>
      ) : null}
      {editable && onAdd ? (
        <Pressable
          testID="add-tag-btn"
          onPress={() => {
            hapticLight();
            setPickerOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Add tag"
          style={[
            styles.chip,
            chipStyle,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderWidth: 1,
              borderStyle: 'dashed',
            },
          ]}
        >
          <Text style={[textStyle, { color: theme.colors.accent }]}>+ Add</Text>
        </Pressable>
      ) : null}

      {/* Picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          testID="tag-picker-backdrop"
          style={styles.modalBackdrop}
          onPress={() => setPickerOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.lg,
                padding: theme.spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.text,
                fontSize: theme.typography.size.title3,
                fontWeight: '700',
                marginBottom: theme.spacing.md,
              }}
            >
              Pick a tag
            </Text>
            <View style={styles.pickerGrid}>
              {FRIEND_TAGS.map((meta) => {
                const hasTag = tags.includes(meta.id);
                return (
                  <Pressable
                    key={meta.id}
                    testID={`tag-pick-${meta.id}`}
                    onPress={() => {
                      hapticLight();
                      if (hasTag) {
                        onRemove?.(meta.id);
                      } else {
                        onAdd?.(meta.id);
                      }
                      setPickerOpen(false);
                    }}
                    style={[
                      styles.pickerChip,
                      {
                        backgroundColor: hasTag ? meta.tint : theme.colors.surface2,
                        borderColor: hasTag ? meta.textColor : theme.colors.border,
                        opacity: hasTag ? 1 : 0.85,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                    <Text
                      style={{
                        color: hasTag ? meta.textColor : theme.colors.text,
                        fontWeight: hasTag ? '700' : '500',
                        marginLeft: 6,
                      }}
                    >
                      {meta.label}
                    </Text>
                    {hasTag ? (
                      <Text style={{ marginLeft: 6, color: meta.textColor }}>
                        ✓
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSm: {
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  chipMd: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipTextSm: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextMd: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
});
