/**
 * ChatBubble
 *
 * Single chat message bubble. Renders text/sticker/image với reply preview,
 * reactions, status indicator. Long-press → parent opens MessageActionSheet.
 *
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  ChatMessage,
  MessageStatus,
  formatRelativeTime,
} from '../../api/chatTypes';
import { getStickerPackById, findSticker } from '../../api/stickerPacks';
import { ChatImageRenderer } from './ChatImageRenderer';

export interface ChatBubbleProps {
  message: ChatMessage;
  isOutgoing: boolean;
  showSender?: boolean;
  parent?: ChatMessage | null;
  onLongPress?: (msg: ChatMessage) => void;
}

function statusGlyph(status: MessageStatus): string {
  switch (status) {
    case 'pending': return '🕒';
    case 'sent': return '✓';
    case 'delivered': return '✓✓';
    case 'read': return '✓✓';
    case 'failed': return '⚠';
  }
}

function formatClock(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function ChatBubble({
  message,
  isOutgoing,
  showSender = false,
  parent,
  onLongPress,
}: ChatBubbleProps) {
  const theme = useTheme();

  // Soft-deleted bubble — show minimal placeholder
  if (message.deletedAt) {
    return (
      <View
        style={[
          styles.row,
          { justifyContent: isOutgoing ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          testID={`message-deleted-${message.id}`}
          style={[
            styles.bubble,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.lg,
              maxWidth: '78%',
              borderStyle: 'dashed',
              borderWidth: 1,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontStyle: 'italic',
              fontSize: theme.typography.size.footnote,
            }}
          >
            🗑️ Tin nhắn đã bị xoá
          </Text>
        </View>
      </View>
    );
  }

  const bubbleBg = isOutgoing
    ? theme.colors.accent
    : theme.isDark
    ? theme.colors.surface
    : theme.colors.surfaceMuted;
  const textColor = isOutgoing ? theme.colors.textInverse : theme.colors.text;
  const subTextColor = isOutgoing ? 'rgba(255,255,255,0.75)' : theme.colors.textSecondary;

  const pack = message.stickerPackId ? getStickerPackById(message.stickerPackId) : null;
  const sticker = pack ? findSticker(pack.id, message.stickerId ?? '') : null;

  const renderContent = () => {
    switch (message.kind) {
      case 'sticker':
        return (
          <View testID={`message-sticker-${message.id}`}>
            <Text style={styles.sticker}>{sticker?.emoji ?? '🌟'}</Text>
            {sticker?.label ? (
              <Text
                style={{
                  color: subTextColor,
                  fontSize: 10,
                  textAlign: 'center',
                  marginTop: 2,
                }}
              >
                {sticker.label}
              </Text>
            ) : null}
          </View>
        );
      case 'image':
        return message.mediaUrl ? (
          <View testID={`message-image-${message.id}`}>
            <ChatImageRenderer
              uri={message.mediaUrl}
              width={message.mediaWidth}
              height={message.mediaHeight}
            />
          </View>
        ) : null;
      case 'text':
      default:
        return (
          <Text
            testID={`message-text-${message.id}`}
            style={[
              styles.text,
              { color: textColor, fontSize: theme.typography.size.body },
            ]}
          >
            {message.text}
          </Text>
        );
    }
  };

  return (
    <View
      style={[
        styles.row,
        { justifyContent: isOutgoing ? 'flex-end' : 'flex-start' },
      ]}
    >
      <Pressable
        onLongPress={onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={250}
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBg,
            borderRadius: theme.radius.lg,
            maxWidth: '78%',
          },
        ]}
        accessibilityRole="text"
        accessibilityLabel={message.text || message.kind}
      >
        {/* Reply preview */}
        {parent && !parent.deletedAt ? (
          <View
            testID="reply-preview"
            style={[
              styles.replyPreview,
              {
                backgroundColor: isOutgoing
                  ? 'rgba(255,255,255,0.15)'
                  : theme.colors.surface2,
                borderLeftColor: theme.colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.accent,
                fontWeight: '600',
                fontSize: 11,
                marginBottom: 2,
              }}
              numberOfLines={1}
            >
              ↩ Replying to {parent.fromUserId}
            </Text>
            <Text
              style={{
                color: subTextColor,
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {parent.kind === 'sticker' && parent.stickerId
                ? `Sticker: ${parent.stickerId}`
                : parent.kind === 'image'
                ? '📷 Image'
                : parent.text}
            </Text>
          </View>
        ) : null}
        {parent?.deletedAt ? (
          <View
            testID="reply-preview-deleted"
            style={[
              styles.replyPreview,
              {
                backgroundColor: isOutgoing
                  ? 'rgba(255,255,255,0.15)'
                  : theme.colors.surface2,
                borderLeftColor: theme.colors.textTertiary,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontStyle: 'italic',
                fontSize: 11,
              }}
            >
              🗑️ Original message was deleted
            </Text>
          </View>
        ) : null}

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
        {renderContent()}
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
            {message.editedAt ? ' (edited)' : ''}
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

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 ? (
          <View style={styles.reactionsRow} testID={`reactions-${message.id}`}>
            {message.reactions.map((r) => (
              <View
                key={r.emoji}
                testID={`reaction-${r.emoji}`}
                style={[
                  styles.reactionChip,
                  {
                    backgroundColor: isOutgoing
                      ? 'rgba(255,255,255,0.2)'
                      : theme.colors.surface2,
                  },
                ]}
              >
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                {r.userIds.length > 1 ? (
                  <Text
                    style={{
                      color: subTextColor,
                      fontSize: 10,
                      fontWeight: '600',
                      marginLeft: 2,
                    }}
                  >
                    {r.userIds.length}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
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
  sticker: {
    fontSize: 56,
    textAlign: 'center',
  },
  replyPreview: {
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  time: {},
  status: {},
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
});
