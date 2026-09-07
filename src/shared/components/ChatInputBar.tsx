/**
 * ChatInputBar
 *
 * Sticky text input at the bottom of a chat thread. Có 3 button:
 *   - Emoji toggle (left)
 *   - Attach menu (left, sau emoji)
 *   - Send (right)
 *
 * Reply preview hiển thị trên input khi reply mode active.
 *
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { ChatMessage } from '../../api/chatTypes';

export interface ChatInputBarProps {
  onSend: (text: string) => Promise<void> | void;
  onAttachPress?: () => void;
  onEmojiToggle?: () => void;
  isEmojiOpen?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Step 5 — reply target */
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export function ChatInputBar({
  onSend,
  onAttachPress,
  onEmojiToggle,
  isEmojiOpen = false,
  disabled = false,
  placeholder = 'Type a message...',
  replyingTo,
  onCancelReply,
}: ChatInputBarProps) {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const trimmed = text.trim();
  const canSend = !disabled && !sending && trimmed.length > 0;

  const handleSend = useCallback(async () => {
    if (!canSend) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText('');
    } catch {
      /* noop */
    } finally {
      setSending(false);
    }
  }, [canSend, onSend, trimmed]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.separator,
        },
      ]}
    >
      {/* Reply preview */}
      {replyingTo ? (
        <View
          testID="reply-input-preview"
          style={[
            styles.replyPreview,
            {
              backgroundColor: theme.colors.surface2,
              borderLeftColor: theme.colors.accent,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.accent,
              fontWeight: '600',
              fontSize: 11,
            }}
            numberOfLines={1}
          >
            ↩ Replying to {replyingTo.fromUserId}
          </Text>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 11,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {replyingTo.kind === 'sticker' && replyingTo.stickerId
              ? `Sticker: ${replyingTo.stickerId}`
              : replyingTo.kind === 'image'
              ? '📷 Image'
              : replyingTo.text}
          </Text>
          <Pressable
            testID="cancel-reply-btn"
            onPress={onCancelReply}
            style={styles.cancelReplyBtn}
          >
            <Text style={{ color: theme.colors.textSecondary, fontSize: 18 }}>×</Text>
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.row,
          {
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
      >
        {/* Emoji toggle */}
        <Pressable
          testID="emoji-toggle"
          onPress={onEmojiToggle}
          accessibilityRole="button"
          accessibilityLabel="Toggle emoji picker"
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.6 : 1 },
            isEmojiOpen && { backgroundColor: theme.colors.surfaceMuted },
          ]}
        >
          <Text style={styles.iconText}>{isEmojiOpen ? '⌨️' : '😀'}</Text>
        </Pressable>

        {/* Attach button */}
        <Pressable
          testID="attach-btn"
          onPress={onAttachPress}
          accessibilityRole="button"
          accessibilityLabel="Attach image or sticker"
          style={({ pressed }) => [
            styles.iconButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={styles.iconText}>📎</Text>
        </Pressable>

        {/* Input wrap */}
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <TextInput
            testID="chat-input"
            style={[
              styles.input,
              {
                color: theme.colors.text,
                fontSize: theme.typography.size.body,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={2000}
            editable={!disabled}
            onKeyPress={(e) => {
              if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
                e.preventDefault?.();
                handleSend();
              }
            }}
          />
        </View>

        {/* Send button */}
        <Pressable
          testID="send-btn"
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend ? theme.colors.accent : theme.colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendText}>{sending ? '...' : '↑'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    margin: 8,
    padding: 8,
    borderRadius: 6,
  },
  cancelReplyBtn: {
    position: 'absolute',
    top: 4,
    right: 8,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    paddingVertical: 8,
    paddingRight: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  iconText: {
    fontSize: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
});
