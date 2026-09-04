/**
 * SocialChips
 *
 * Social platform chips (Discord, Twitter, Instagram, TikTok, Twitch).
 * Tap → mở external URL.
 *
 * Step 7 — port từ desktop profile-view.html "social-chips".
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, Alert } from 'react-native';
import {
  SocialHandles,
  SocialPlatform,
  SOCIAL_PLATFORMS,
} from '../../api/profileTypes';
import { useTheme } from '../../utils/useTheme';
import { hapticLight } from '../../utils/haptics';

export interface SocialChipsProps {
  socials: SocialHandles | undefined;
  testID?: string;
}

export function SocialChips({ socials, testID }: SocialChipsProps) {
  const theme = useTheme();
  if (!socials) return null;

  const present: { id: SocialPlatform; handle: string; label: string; emoji: string; url: string }[] = [];
  for (const def of SOCIAL_PLATFORMS) {
    const handle = socials[def.id];
    if (handle && handle.trim().length > 0) {
      present.push({
        id: def.id,
        handle,
        label: def.label,
        emoji: def.emoji,
        url: def.baseUrl(handle),
      });
    }
  }

  if (present.length === 0) return null;

  const open = async (url: string) => {
    hapticLight();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Cannot open link', url);
    } catch {
      Alert.alert('Cannot open link', url);
    }
  };

  return (
    <View testID={testID ?? 'social-chips'} style={styles.row}>
      {present.map((p) => (
        <Pressable
          key={p.id}
          testID={`social-chip-${p.id}`}
          onPress={() => open(p.url)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: pressed
                ? theme.colors.surfaceMuted
                : theme.colors.surface2,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={styles.emoji}>{p.emoji}</Text>
          <Text
            style={[styles.label, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {p.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 160,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
