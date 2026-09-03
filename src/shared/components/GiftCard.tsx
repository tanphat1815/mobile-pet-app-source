/**
 * GiftCard
 *
 * Render 1 gift entry cho gift history list. Hiển thị icon, from/to, message, timestamp.
 * Step 4 — xem docs/steps/step-04-friends-advanced.md.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import {
  FriendGift,
  getGiftTypeMeta,
  formatLastSeen,
} from '../../api/friendTypes';
import { hapticLight } from '../../utils/haptics';

interface GiftCardProps {
  gift: FriendGift;
  /** The current userId, để biết direction. */
  currentUserId?: string;
  onAcknowledge?: (gift: FriendGift) => void;
}

export function GiftCard({ gift, currentUserId = 'me', onAcknowledge }: GiftCardProps) {
  const theme = useTheme();
  const meta = getGiftTypeMeta(gift.giftType);
  // Direction relative to current user
  const isIncoming = gift.toUserId === currentUserId;
  const otherParty = isIncoming ? gift.fromDisplayName : gift.toDisplayName;
  const tint = meta?.tint ?? theme.colors.surface2;

  return (
    <Pressable
      testID={`gift-card-${gift.id}`}
      onPress={
        !gift.acknowledged && isIncoming && onAcknowledge
          ? () => {
              hapticLight();
              onAcknowledge(gift);
            }
          : undefined
      }
      accessibilityRole={!gift.acknowledged && isIncoming ? 'button' : 'text'}
      accessibilityLabel={`${isIncoming ? 'Received' : 'Sent'} ${meta?.label} ${isIncoming ? 'from' : 'to'} ${otherParty}`}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: gift.acknowledged || !isIncoming ? theme.colors.border : theme.colors.accent,
          borderWidth: 1,
          opacity: gift.acknowledged ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Text style={styles.iconText}>{meta?.icon ?? '🎁'}</Text>
        {gift.quantity > 1 ? (
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>×{gift.quantity}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text
          style={{
            color: theme.colors.text,
            fontWeight: '600',
            fontSize: theme.typography.size.subhead,
          }}
          numberOfLines={1}
        >
          {isIncoming ? `${otherParty} sent you a ${meta?.label}` : `You sent ${meta?.label} to ${otherParty}`}
        </Text>
        {gift.message ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.footnote,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            "{gift.message}"
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text
            style={{
              color: theme.colors.textTertiary,
              fontSize: theme.typography.size.caption1,
            }}
          >
            {formatLastSeen(gift.sentAt)}
          </Text>
          {!gift.acknowledged && isIncoming ? (
            <Text
              testID={`gift-unack-${gift.id}`}
              style={{
                color: theme.colors.accent,
                fontSize: theme.typography.size.caption1,
                fontWeight: '700',
                marginLeft: 8,
              }}
            >
              Tap to acknowledge
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  qtyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 4,
    minWidth: 16,
    alignItems: 'center',
  },
  qtyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
