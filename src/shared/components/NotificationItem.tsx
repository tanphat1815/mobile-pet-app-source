/**
 * NotificationItem
 *
 * Single notification row in the NotificationCenter.
 *
 * Step 9 — xem docs/steps/step-09-notification-center.md.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import type { NotificationItem as TNotificationItem } from '../../api/notificationCenter';
import { hapticLight } from '../../utils/haptics';

export interface NotificationItemProps {
  item: TNotificationItem;
  onPress: (item: TNotificationItem) => void;
  testID?: string;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(isoString).toLocaleDateString();
}

export function NotificationItemRow({
  item,
  onPress,
  testID,
}: NotificationItemProps) {
  const theme = useTheme();
  const unread = item.readAt === null;

  const handlePress = useCallback(() => {
    hapticLight();
    onPress(item);
  }, [item, onPress]);

  return (
    <Pressable
      testID={testID ?? `notification-item-${item.id}`}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: unread
            ? theme.isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.03)'
            : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.iconEmoji} ${item.title}, ${unread ? 'unread' : 'read'}`}
    >
      <Text style={styles.icon}>{item.iconEmoji}</Text>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontWeight: unread ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.body ? (
          <Text
            style={[
              styles.body,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        ) : null}
      </View>
      <View style={styles.meta}>
        {unread && (
          <View
            style={[styles.dot, { backgroundColor: theme.colors.accent }]}
          />
        )}
        <Text
          style={[
            styles.time,
            { color: theme.colors.textSecondary },
          ]}
        >
          {timeAgo(item.receivedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
  },
  body: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  meta: {
    alignItems: 'flex-end',
    marginLeft: 8,
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  time: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
