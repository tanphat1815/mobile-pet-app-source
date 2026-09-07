/**
 * ChatBubble
 *
 * Single chat message bubble. Aligned left for incoming, right for
 * outgoing. Status indicator for outgoing messages (pending/failed).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { ChatMessage, MessageStatus } from '../../api/chatTypes';

export interface ChatBubbleProps {
  message: ChatMessage;
  isOutgoing: boolean;
  showSender?: boolean;
}

function statusGlyph(status: MessageStatus): string {
  switch (status) {
    case 'pending':
      return '🕒';
    case 'sent':
      return '✓';
    case 'delivered':
      return '✓✓';
    case 'read':
      return '✓✓';
    case 'failed':
      return '⚠';
  }
}

function formatClock(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ChatBubble({ message, isOutgoing, showSender = false }: ChatBubbleProps) {
  const theme = useTheme();
  const bubbleBg = isOutgoing
    ? theme.colors.accent
    : theme.isDark
    ? theme.colors.surface
    : theme.colors.surfaceMuted;
  const textColor = isOutgoing ? theme.colors.textInverse : theme.colors.text;
  const subTextColor = isOutgoing ? 'rgba(255,255,255,0.75)' : theme.colors.textSecondary;

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isOutgoing ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBg,
            borderRadius: theme.radius.lg,
            maxWidth: '78%',
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${message.text}`}
      >
        {showSender && !isOutgoing && (
          <Text
            style={[
              styles.sender,
              {
                color: theme.colors.accent,
                fontSize: theme.typography.size.caption2,
                fontWeight: '600',
              },
            ]}
          >
            {message.fromUserId}
          </Text>
        )}
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: theme.typography.size.body,
            },
          ]}
        >
          {message.text}
        </Text>
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.time,
              {
                color: subTextColor,
                fontSize: theme.typography.size.caption2,
              },
            ]}
          >
            {formatClock(message.ts)}
          </Text>
          {isOutgoing && (
            <Text
              style={[
                styles.status,
                {
                  color: subTextColor,
                  fontSize: theme.typography.size.caption2,
                },
              ]}
            >
              {' '}
              {statusGlyph(message.status)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 3,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sender: {
    marginBottom: 4,
  },
  text: {
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  time: {},
  status: {},
});