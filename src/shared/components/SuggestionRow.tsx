/**
 * SuggestionRow
 *
 * Friend suggestion: avatar + name + mutual friends + reason + "Add"
 * button (sends friend request on tap, then swaps to "Requested").
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { useAvatarHover } from '../transitions/useAvatarHover';
import { Button } from './Button';
import { FriendSuggestion } from '../../api/friendTypes';

export interface SuggestionRowProps {
  suggestion: FriendSuggestion;
  /** Whether the user has already requested this user */
  requested?: boolean;
  /** Sending in flight */
  sending?: boolean;
  onAdd: () => void;
}

export function SuggestionRow({
  suggestion,
  requested = false,
  sending = false,
  onAdd,
}: SuggestionRowProps) {
  const theme = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = useAvatarHover({
    pressedScale: 0.95,
  });

  const initial = (suggestion.displayName?.[0] ?? '?').toUpperCase();

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
          {suggestion.displayName}
        </Text>
        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
            },
          ]}
          numberOfLines={1}
        >
          {[
            suggestion.mutualFriends > 0
              ? `${suggestion.mutualFriends} mutual friend${suggestion.mutualFriends > 1 ? 's' : ''}`
              : null,
            suggestion.reason,
          ]
            .filter(Boolean)
            .join(' • ')}
        </Text>
      </View>

      <View style={styles.action}>
        <Button
          title={requested ? 'Requested' : 'Add'}
          onPress={requested ? () => undefined : onAdd}
          variant={requested ? 'ghost' : 'primary'}
          size="sm"
          loading={sending}
          disabled={requested || sending}
        />
      </View>
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
  name: {
    marginBottom: 2,
  },
  subtitle: {},
  action: {
    width: 88,
    marginLeft: 12,
  },
});