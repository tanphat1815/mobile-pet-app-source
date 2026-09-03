/**
 * ChatInputBar
 *
 * Sticky text input at the bottom of a chat thread. Supports multi-line
 * input with Enter-to-send (web/desktop) and a Send button on mobile.
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../utils/useTheme';

export interface ChatInputBarProps {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInputBar({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
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
      /* noop - caller surfaces error */
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
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
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
            // Submit on Enter (web / desktop with hardware keyboard)
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter') {
              e.preventDefault?.();
              handleSend();
            }
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            {
              backgroundColor: canSend
                ? theme.colors.accent
                : theme.colors.border,
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
  inputWrap: {
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
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendText: {
    color: '#FFFFFF', // on-accent white, intentional — both themes
    fontWeight: '700',
    fontSize: 18,
  },
});