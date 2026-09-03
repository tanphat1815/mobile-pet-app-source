/**
 * SendGiftSheet
 *
 * Bottom sheet gửi quà cho friend. Pick gift type + optional message + send.
 * Step 4 — xem docs/steps/step-04-friends-advanced.md.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Modal } from './Modal';
import { useTheme } from '../../utils/useTheme';
import {
  FriendGiftType,
  FRIEND_GIFT_TYPES,
  getGiftTypeMeta,
} from '../../api/friendTypes';
import { hapticLight, hapticSuccess } from '../../utils/haptics';

interface SendGiftSheetProps {
  visible: boolean;
  onClose: () => void;
  toUserId: string;
  toDisplayName?: string;
  /** Wallet balance — nếu insufficient sẽ reject */
  coinsBalance?: number;
  onSend: (input: { giftType: FriendGiftType; message?: string }) => Promise<void>;
}

export function SendGiftSheet({
  visible,
  onClose,
  toUserId: _toUserId,
  toDisplayName,
  coinsBalance = 9999,
  onSend,
}: SendGiftSheetProps) {
  const theme = useTheme();
  const [picked, setPicked] = useState<FriendGiftType | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!picked) return;
    const meta = getGiftTypeMeta(picked);
    if (meta && meta.price > coinsBalance) {
      Alert.alert('Không đủ coin', `Quà này cần ${meta.price} coin, bạn chỉ có ${coinsBalance}.`);
      return;
    }
    setSending(true);
    try {
      await onSend({
        giftType: picked,
        message: message.trim() || undefined,
      });
      hapticSuccess();
      Alert.alert(
        'Gift sent! 🎁',
        `${toDisplayName ?? 'Friend'} sẽ nhận được ${meta?.label ?? 'gift'} của bạn.`,
        [{ text: 'OK', onPress: () => {
          setPicked(null);
          setMessage('');
          onClose();
        } }]
      );
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không gửi được quà');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      title={`Send a gift${toDisplayName ? ` to ${toDisplayName}` : ''}`}
      contentStyle={{ maxWidth: 480 }}
    >
      <View style={{ padding: 4 }}>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.caption1,
            marginBottom: theme.spacing.sm,
            textAlign: 'center',
          }}
        >
          Coins: {coinsBalance} 💰
        </Text>

        {/* Gift grid */}
        <View style={styles.grid}>
          {FRIEND_GIFT_TYPES.map((meta) => {
            const isPicked = picked === meta.id;
            const canAfford = coinsBalance >= meta.price;
            return (
              <Pressable
                key={meta.id}
                testID={`gift-${meta.id}`}
                onPress={() => {
                  hapticLight();
                  setPicked(meta.id);
                }}
                disabled={!canAfford}
                style={[
                  styles.giftCard,
                  {
                    backgroundColor: isPicked ? meta.tint : theme.colors.surface2,
                    borderColor: isPicked ? theme.colors.accent : theme.colors.border,
                    borderWidth: isPicked ? 2 : 1,
                    opacity: canAfford ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={styles.giftIcon}>{meta.icon}</Text>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontWeight: '600',
                    fontSize: 12,
                    marginTop: 4,
                  }}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
                <Text
                  style={{
                    color: isPicked ? theme.colors.accent : theme.colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: 2,
                  }}
                >
                  💰 {meta.price}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Optional message */}
        <TextInput
          testID="gift-message-input"
          placeholder="Lời nhắn (không bắt buộc)..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={140}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface2,
              color: theme.colors.text,
              borderColor: theme.colors.border,
            },
          ]}
          placeholderTextColor={theme.colors.textTertiary}
        />

        {/* Send button */}
        <Pressable
          testID="gift-send-confirm"
          onPress={handleSend}
          disabled={!picked || sending}
          style={[
            styles.sendButton,
            {
              backgroundColor: picked ? theme.colors.accent : theme.colors.surfaceMuted,
              opacity: sending ? 0.6 : 1,
            },
          ]}
        >
          <Text
            style={{
              color: picked ? theme.colors.textInverse : theme.colors.textSecondary,
              fontWeight: '700',
              fontSize: theme.typography.size.subhead,
            }}
          >
            {sending ? 'Sending…' : picked ? `Send ${getGiftTypeMeta(picked)?.label}` : 'Pick a gift first'}
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  giftCard: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftIcon: {
    fontSize: 28,
  },
  input: {
    minHeight: 60,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
