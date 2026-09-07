/**
 * TitleBadge
 *
 * Hiển thị title rank ("Legendary Pet Parent") dưới display name.
 *
 * Step 7 — port từ desktop profile-view.html "title-badge".
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { hapticLight } from '../../utils/haptics';
import { Pressable } from 'react-native';

export interface TitleBadgeProps {
  title: string;
  testID?: string;
  onPress?: () => void;
}

const RANK_COLOR: Record<string, string> = {
  Bronze: '#A16207',
  Silver: '#9CA3AF',
  Gold: '#F59E0B',
  Diamond: '#7DD3FC',
  Legendary: '#F97316',
};

function pickAccent(title: string): string {
  for (const [k, v] of Object.entries(RANK_COLOR)) {
    if (title.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '#7C3AED';
}

export function TitleBadge({ title, testID, onPress }: TitleBadgeProps) {
  const theme = useTheme();
  if (!title) return null;
  const accent = pickAccent(title);

  const Inner = (
    <View
      testID={testID ?? 'profile-title-badge'}
      style={[
        styles.badge,
        { backgroundColor: accent + '22', borderColor: accent },
      ]}
    >
      <Text style={styles.icon}>🏷️</Text>
      <Text style={[styles.text, { color: accent }]}>{title}</Text>
    </View>
  );

  if (!onPress) return Inner;

  return (
    <Pressable
      onPress={() => {
        hapticLight();
        onPress();
      }}
    >
      {Inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'center',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
