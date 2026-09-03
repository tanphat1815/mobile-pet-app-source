/**
 * MessageActionSheet
 *
 * Long-press message → bottom sheet với actions: Edit/Delete/Reply/React.
 * Step 5 — xem docs/steps/step-05-chat-enrichment.md.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { EmojiPicker } from './EmojiPicker';
import { useTheme } from '../../utils/useTheme';
import { ChatMessage, totalReactionCount } from '../../api/chatTypes';
import { REACTION_QUICK_EMOJIS } from '../../api/emojiData';
import { hapticLight } from '../../utils/haptics';

interface MessageActionSheetProps {
  visible: boolean;
  message: ChatMessage | null;
  isOutgoing: boolean;
  currentUserId: string;
  onClose: () => void;
  onEdit?: (msg: ChatMessage) => void;
  onDelete?: (msg: ChatMessage) => void;
  onReply?: (msg: ChatMessage) => void;
  onReact?: (msg: ChatMessage, emoji: string) => void;
}

export function MessageActionSheet({
  visible,
  message,
  isOutgoing,
  currentUserId,
  onClose,
  onEdit,
  onDelete,
  onReply,
  onReact,
}: MessageActionSheetProps) {
  const theme = useTheme();
  const [showReactions, setShowReactions] = useState(false);

  if (!message) return null;

  const deleted = !!message.deletedAt;

  const handleAction = (cb: (() => void) | undefined) => {
    hapticLight();
    cb?.();
    onClose();
  };

  const handleReact = (emoji: string) => {
    hapticLight();
    onReact?.(message, emoji);
    setShowReactions(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      title="Message actions"
      contentStyle={{ maxWidth: 480, width: '100%' }}
    >
      <View style={{ padding: 4 }}>
        {deleted ? (
          <Text
            testID="message-deleted-notice"
            style={{
              color: theme.colors.textTertiary,
              fontStyle: 'italic',
              textAlign: 'center',
              paddingVertical: 12,
            }}
          >
            Message deleted — actions unavailable
          </Text>
        ) : (
          <>
            {/* Quick reactions row */}
            <View style={styles.section}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Quick reactions
              </Text>
              <EmojiPicker
                quickMode
                quickEmojis={REACTION_QUICK_EMOJIS}
                onSelect={handleReact}
              />
              {totalReactionCount(message) > 0 ? (
                <Text
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {totalReactionCount(message)} reaction
                  {totalReactionCount(message) > 1 ? 's' : ''} on this message
                </Text>
              ) : null}
            </View>

            {/* Actions */}
            <View style={[styles.section, { borderTopColor: theme.colors.border, borderTopWidth: 1 }]}>
              {onReply ? (
                <ActionRow
                  testID="message-action-reply"
                  icon="↩️"
                  label="Reply"
                  onPress={() => handleAction(() => onReply(message))}
                />
              ) : null}

              {isOutgoing && onEdit ? (
                <ActionRow
                  testID="message-action-edit"
                  icon="✏️"
                  label="Edit"
                  onPress={() => handleAction(() => onEdit(message))}
                />
              ) : null}

              {isOutgoing && onDelete ? (
                <ActionRow
                  testID="message-action-delete"
                  icon="🗑️"
                  label="Delete"
                  destructive
                  onPress={() =>
                    handleAction(() => {
                      Alert.alert(
                        'Delete message?',
                        'This cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => onDelete(message),
                          },
                        ]
                      );
                    })
                  }
                />
              ) : null}

              <ActionRow
                testID="message-action-close"
                icon="❌"
                label="Cancel"
                onPress={onClose}
              />
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
  testID,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        {
          backgroundColor: pressed ? theme.colors.surfaceMuted : 'transparent',
        },
      ]}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text
        style={{
          color: destructive ? theme.colors.danger : theme.colors.text,
          fontSize: 15,
          fontWeight: '500',
          flex: 1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 12,
  },
  actionIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
});
