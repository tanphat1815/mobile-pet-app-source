/**
 * ConversationRow
 *
 * One row in the conversation list. Shows the other participant, their
 * online status, the last message, an unread count badge, and a relative
 * timestamp.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { Conversation, otherParticipant, formatRelativeTime } from '../../api/chatTypes';
import { Badge } from './Badge';

export interface ConversationRowProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
  reducedMotion?: boolean;
}

export function ConversationRow({
  conversation,
  currentUserId,
  onPress,
  reducedMotion = false,
}: ConversationRowProps) {
  const theme = useTheme();
  const other = otherParticipant(conversation, currentUserId);
  const initial = (other.displayName?.[0] ?? '?').toUpperCase();
  const lastText = conversation.lastMessage?.text ?? 'No messages yet';
  const ts = conversation.lastMessage?.ts ?? conversation.updatedAt;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
          borderBottomColor: theme.colors.separator,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${other.displayName}`}
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
        {other.online && (
          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: theme.colors.success,
                borderColor: theme.colors.surface,
              },
            ]}
          />
        )}
      </View>
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
            {other.displayName}
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
            {formatRelativeTime(ts)}
          </Text>
        </View>
        <View style={styles.subRow}>
          <Text
            style={[
              styles.preview,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.size.subhead,
                fontWeight: conversation.unreadCount > 0 ? '600' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {lastText}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={{ marginLeft: 8 }}>
              <Badge
                label={String(conversation.unreadCount)}
                variant="primary"
                size="sm"
              />
            </View>
          )}
        </View>
      </View>
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
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  time: {},
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
  },
});