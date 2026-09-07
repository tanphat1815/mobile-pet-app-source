/**
 * AchievementShareSheet
 *
 * Share options after unlocking an achievement:
 *  - Twitter (tweet with achievement name + app link)
 *  - Facebook (share link)
 *  - Copy link to clipboard
 *
 * Step 8 — xem docs/steps/step-08-achievements-parity.md.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { Achievement } from '../../api/achievementTypes';
import { hapticLight } from '../../utils/haptics';
import { copyToClipboard } from '../../utils/clipboard';

export interface AchievementShareSheetProps {
  achievement: Achievement;
  onClose: () => void;
}

const SHARE_TEXT = (title: string) =>
  `🎉 I just unlocked "${title}" in Pet App! 🐾 Join me and start your own pet adventure!`;

const SHARE_URL = 'https://petapp.example.com';

function twitterUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text,
    url,
    hashtags: 'PetApp,MobilePets',
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function fbUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function AchievementShareSheet({
  achievement,
  onClose,
}: AchievementShareSheetProps) {
  const theme = useTheme();
  const text = SHARE_TEXT(achievement.title);

  const openExternal = useCallback(async (url: string) => {
    hapticLight();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert('Cannot open link', url);
    } catch {
      Alert.alert('Cannot open link', url);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    hapticLight();
    const msg = `${text}\n\n${SHARE_URL}`;
    const ok = await copyToClipboard(msg);
    if (ok) {
      Alert.alert('Copied!', 'Share text copied to clipboard.');
    }
    onClose();
  }, [text, onClose]);

  const handleShare = useCallback(async () => {
    hapticLight();
    try {
      await Share.share({ message: `${text}\n\n${SHARE_URL}` });
    } catch {
      /* user cancelled */
    }
    onClose();
  }, [text, onClose]);

  return (
    <View style={styles.root}>
      <Text style={[styles.heading, { color: theme.colors.text }]}>
        Share achievement
      </Text>
      <Text
        style={[styles.preview, { color: theme.colors.textSecondary }]}
        numberOfLines={2}
      >
        "{achievement.title}"
      </Text>

      <Pressable
        testID="share-twitter"
        onPress={() => openExternal(twitterUrl(text, SHARE_URL))}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? '#1DA1F2cc' : '#1DA1F2' },
        ]}
      >
        <Text style={styles.btnEmoji}>🐦</Text>
        <Text style={styles.btnLabel}>Share on Twitter</Text>
      </Pressable>

      <Pressable
        testID="share-facebook"
        onPress={() => openExternal(fbUrl(SHARE_URL))}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: pressed ? '#1877F2cc' : '#1877F2' },
        ]}
      >
        <Text style={styles.btnEmoji}>📘</Text>
        <Text style={styles.btnLabel}>Share on Facebook</Text>
      </Pressable>

      <Pressable
        testID="share-copy"
        onPress={handleCopy}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: pressed
              ? theme.colors.surfaceMuted
              : theme.colors.surface2,
            borderWidth: 1,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={styles.btnEmoji}>🔗</Text>
        <Text style={[styles.btnLabel, { color: theme.colors.text }]}>
          Copy link
        </Text>
      </Pressable>

      <Pressable
        testID="share-close"
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeBtn,
          { borderColor: theme.colors.border },
        ]}
      >
        <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
          Close
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 20,
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  btnEmoji: {
    fontSize: 18,
  },
  btnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
});
