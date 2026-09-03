/**
 * StickerPanel
 *
 * Grid sticker cho 1 sticker pack. Có horizontal tab để switch packs.
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
import { STICKER_PACKS } from '../../api/stickerPacks';
import { hapticLight } from '../../utils/haptics';

interface StickerPanelProps {
  onSelect: (stickerId: string, packId: string) => void;
  height?: number;
}

export function StickerPanel({ onSelect, height = 280 }: StickerPanelProps) {
  const theme = useTheme();
  const [activePackId, setActivePackId] = useState(STICKER_PACKS[0].id);
  const activePack = STICKER_PACKS.find((p) => p.id === activePackId);

  return (
    <View
      testID="sticker-panel"
      style={[
        styles.root,
        {
          height,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {/* Pack tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}
        style={{ borderBottomColor: theme.colors.border, borderBottomWidth: 1 }}
      >
        {STICKER_PACKS.map((pack) => {
          const isActive = pack.id === activePackId;
          return (
            <Pressable
              key={pack.id}
              testID={`sticker-pack-tab-${pack.id}`}
              onPress={() => {
                hapticLight();
                setActivePackId(pack.id);
              }}
              style={[
                styles.packTab,
                {
                  backgroundColor: isActive ? pack.tint : 'transparent',
                  borderColor: isActive ? pack.tint : theme.colors.border,
                },
              ]}
            >
              <Text style={styles.packTabText}>{pack.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sticker grid */}
      <ScrollView
        testID="sticker-grid"
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {activePack?.stickers.map((sticker) => (
          <Pressable
            key={sticker.id}
            testID={`sticker-${activePack.id}-${sticker.id}`}
            onPress={() => {
              hapticLight();
              onSelect(sticker.id, activePack.id);
            }}
            style={({ pressed }) => [
              styles.stickerBtn,
              {
                backgroundColor: pressed
                  ? theme.colors.surfaceMuted
                  : 'transparent',
              },
            ]}
          >
            <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontSize: 9,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {sticker.label}
            </Text>
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
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  packTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  packTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  stickerBtn: {
    width: '20%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 4,
  },
  stickerEmoji: {
    fontSize: 32,
  },
});
