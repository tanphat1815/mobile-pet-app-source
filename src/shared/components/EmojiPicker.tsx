/**
 * EmojiPicker
 *
 * Bottom sheet emoji grid với 8 categories. Tap emoji → gọi callback.
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { EMOJI_GROUPS, EmojiCategory } from '../../api/emojiData';
import { hapticLight } from '../../utils/haptics';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  /** Optional height limit */
  height?: number;
  /** Show quick reactions row at top (for MessageActionSheet) */
  quickMode?: boolean;
  quickEmojis?: string[];
}

export function EmojiPicker({
  onSelect,
  height = 280,
  quickMode = false,
  quickEmojis,
}: EmojiPickerProps) {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('smileys');

  const activeGroup = EMOJI_GROUPS.find((g) => g.id === activeCategory);
  const emojis = activeGroup?.emojis ?? [];

  if (quickMode) {
    return (
      <View
        testID="emoji-quick-row"
        style={[styles.quickRow, { borderColor: theme.colors.border }]}
      >
        {(quickEmojis ?? EMOJI_GROUPS[0].emojis.slice(0, 6)).map((emoji) => (
          <Pressable
            key={emoji}
            testID={`emoji-quick-${emoji}`}
            onPress={() => {
              hapticLight();
              onSelect(emoji);
            }}
            style={({ pressed }) => [
              styles.quickEmoji,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.quickEmojiText}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View
      testID="emoji-picker"
      style={[
        styles.root,
        {
          height,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {/* Category tabs (horizontal) */}
      <View
        style={[
          styles.tabBar,
          { borderBottomColor: theme.colors.border },
        ]}
      >
        {EMOJI_GROUPS.map((g) => (
          <Pressable
            key={g.id}
            testID={`emoji-tab-${g.id}`}
            onPress={() => {
              hapticLight();
              setActiveCategory(g.id);
            }}
            style={[
              styles.tabBtn,
              {
                borderBottomColor:
                  activeCategory === g.id
                    ? theme.colors.accent
                    : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.tabIcon,
                {
                  opacity: activeCategory === g.id ? 1 : 0.4,
                },
              ]}
            >
              {g.icon}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group label */}
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          paddingHorizontal: 12,
          paddingTop: 6,
          paddingBottom: 2,
        }}
      >
        {activeGroup?.label}
      </Text>

      {/* Grid */}
      <ScrollView
        testID="emoji-grid"
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {emojis.map((emoji) => (
          <Pressable
            key={emoji}
            testID={`emoji-${emoji}`}
            onPress={() => {
              hapticLight();
              onSelect(emoji);
            }}
            style={({ pressed }) => [
              styles.emojiBtn,
              { backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent' },
            ]}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabIcon: {
    fontSize: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 4,
  },
  emojiBtn: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  emojiText: {
    fontSize: 22,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  quickEmoji: {
    padding: 4,
  },
  quickEmojiText: {
    fontSize: 28,
  },
});
