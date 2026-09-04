/**
 * NotificationBell
 *
 * Bell icon + unread badge count. Used in Home header.
 *
 * Step 9 — xem docs/steps/step-09-notification-center.md.
 */

import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  useNotificationStore,
  selectUnreadCount,
} from '../../stores/NotificationStore';
import { hapticLight } from '../../utils/haptics';

export interface NotificationBellProps {
  onPress: () => void;
  testID?: string;
}

export function NotificationBell({
  onPress,
  testID,
}: NotificationBellProps) {
  const theme = useTheme();
  const unread = useNotificationStore(selectUnreadCount);

  const handlePress = useCallback(() => {
    hapticLight();
    onPress();
  }, [onPress]);

  return (
    <Pressable
      testID={testID ?? 'notification-bell'}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Notifications, ${unread} unread`}
      hitSlop={12}
      style={({ pressed }) => [
        styles.root,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={styles.icon}>🔔</Text>
      {unread > 0 && (
        <View
          testID="bell-badge"
          style={[
            styles.badge,
            { backgroundColor: theme.colors.danger ?? '#FF3B30' },
          ]}
        >
          <Text
            style={styles.badgeText}
            numberOfLines={1}
            testID="bell-badge-text"
          >
            {unread > 99 ? '99+' : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: 'relative',
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
