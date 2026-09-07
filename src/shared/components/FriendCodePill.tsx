/**
 * FriendCodePill
 *
 * Hiển thị friend code 6-char với copy button. Tap → clipboard.
 * Step 7 — xem docs/steps/step-07-rich-profile.md.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { hapticSuccess, hapticLight } from '../../utils/haptics';
import { copyToClipboard } from '../../utils/clipboard';

export interface FriendCodePillProps {
  code: string;
  testID?: string;
}

export function FriendCodePill({ code, testID }: FriendCodePillProps) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    hapticLight();
    try {
      const ok = await copyToClipboard(code);
      if (ok) {
        hapticSuccess();
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      Alert.alert('Could not copy', 'Please try again');
    }
  }, [code]);

  return (
    <Pressable
      testID={testID ?? 'friend-code-copy'}
      onPress={handleCopy}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: pressed
            ? theme.colors.surfaceMuted
            : theme.colors.surface2,
          borderColor: theme.colors.border,
        },
      ]}
      accessibilityLabel={`Friend code ${code}. Tap to copy`}
    >
      <Text
        testID="friend-code-text"
        style={[
          styles.code,
          { color: theme.colors.text, fontFamily: 'monospace' },
        ]}
      >
        {code}
      </Text>
      <View
        style={[
          styles.divider,
          { backgroundColor: theme.colors.border },
        ]}
      />
      <Text style={[styles.copyLabel, { color: theme.colors.accent }]}>
        {copied ? '✓ Copied' : '📋 Copy'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  code: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  divider: {
    width: 1,
    height: 18,
    marginHorizontal: 10,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
