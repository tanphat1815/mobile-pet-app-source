/**
 * FriendRow
 *
 * One row in the friend list. Shows:
 *   - Avatar with animated press-in scale (useAvatarHover)
 *   - Online dot (green), away dot (orange), or hidden (offline)
 *   - Display name
 *   - Status message (italic, secondary text)
 *   - Right side: pet level badge, last-seen relative, or actions
 *
 * Designed to be flexible via the `right` prop so the same row can be
 * used in the Friends tab (with actions) and the Suggestions tab (with
 * "Add" button).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useAvatarHover } from '../transitions/useAvatarHover';
import { Friend, formatLastSeen } from '../../api/friendTypes';
import { Badge } from './Badge';

export interface FriendRowProps {
  friend: Friend;
  onPress?: () => void;
  onLongPress?: () => void;
  right?: React.ReactNode;
}

export function FriendRow({ friend, onPress, onLongPress, right }: FriendRowProps) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useAvatarHover({
    pressedScale: 0.95,
  });

  const initial = (friend.displayName?.[0] ?? '?').toUpperCase();

  const dotColor = (() => {
    if (friend.presence === 'online') return theme.colors.success;
    if (friend.presence === 'away') return theme.colors.warning;
    return null;
  })();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
          borderBottomColor: theme.colors.separator,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Friend ${friend.displayName}, ${friend.presence}`}
    >
      <Animated.View style={[styles.avatarWrap, animatedStyle]}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.isDark ? theme.colors.surface : theme.colors.surfaceMuted,
              borderRadius: 24,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: theme.colors.text }]}>{initial}</Text>
        </View>
        {dotColor && (
          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: dotColor,
                borderColor: theme.colors.surface,
              },
            ]}
          />
        )}
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.text,
                fontSize: theme.typography.size.headline,
                fontWeight: '600',
              },
            ]}
            numberOfLines={1}
          >
            {friend.displayName}
          </Text>
          {friend.petLevel !== undefined && (
            <View style={{ marginLeft: 8 }}>
              <Badge
                label={`Lv ${friend.petLevel}`}
                variant="neutral"
                size="sm"
              />
            </View>
          )}
        </View>
        {friend.statusMessage ? (
          <Text
            style={[
              styles.status,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                fontStyle: 'italic',
              },
            ]}
            numberOfLines={1}
          >
            {friend.statusMessage}
          </Text>
        ) : (
          <Text
            style={[
              styles.status,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
              },
            ]}
            numberOfLines={1}
          >
            {friend.presence === 'online'
              ? 'Online now'
              : `Last seen ${formatLastSeen(friend.lastSeen)}`}
          </Text>
        )}
      </View>

      {right && <View style={styles.right}>{right}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flexShrink: 1,
  },
  status: {},
  right: {
    marginLeft: 12,
  },
});