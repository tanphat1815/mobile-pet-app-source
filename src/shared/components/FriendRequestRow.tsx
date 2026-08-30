/**
 * FriendRequestRow
 *
 * One row in the friend-requests list. Shows:
 *   - Avatar (press-in animated)
 *   - Display name + mutual friends
 *   - Optional message preview
 *   - Right side: Accept/Decline buttons (incoming) or Cancel button
 *     (outgoing)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useAvatarHover } from '../transitions/useAvatarHover';
import { Button } from './Button';
import { FriendRequest, formatLastSeen } from '../../api/friendTypes';

export interface FriendRequestRowProps {
  request: FriendRequest;
  isDeciding: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCancel?: () => void;
}

export function FriendRequestRow({
  request,
  isDeciding,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestRowProps) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useAvatarHover({
    pressedScale: 0.95,
  });

  const initial = (request.fromDisplayName?.[0] ?? '?').toUpperCase();
  const isIncoming = request.direction === 'incoming';

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.separator,
        },
      ]}
    >
      <Animated.View
        style={[styles.avatarWrap, animatedStyle]}
        onTouchStart={onPressIn}
        onTouchEnd={onPressOut}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.isDark ? '#2C2C2E' : '#E5E5EA',
              borderRadius: 24,
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: theme.colors.text }]}>{initial}</Text>
        </View>
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
            {request.fromDisplayName ?? request.fromUserId}
          </Text>
          <Text
            style={[
              styles.time,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.caption1,
              },
            ]}
          >
            {formatLastSeen(request.ts)}
          </Text>
        </View>
        {request.message && (
          <Text
            style={[
              styles.message,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                fontStyle: 'italic',
              },
            ]}
            numberOfLines={2}
          >
            "{request.message}"
          </Text>
        )}
      </View>

      {isIncoming ? (
        <View style={styles.actions}>
          <Button
            title="Decline"
            onPress={onDecline}
            variant="ghost"
            size="sm"
            disabled={isDeciding}
          />
          <View style={{ height: 4 }} />
          <Button
            title="Accept"
            onPress={onAccept}
            variant="primary"
            size="sm"
            loading={isDeciding}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onCancel ?? onDecline}
            variant="ghost"
            size="sm"
            disabled={isDeciding}
          />
        </View>
      )}
    </View>
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
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  time: {},
  message: {},
  actions: {
    width: 88,
    marginLeft: 12,
  },
});