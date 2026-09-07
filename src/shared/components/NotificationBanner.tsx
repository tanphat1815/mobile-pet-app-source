/**
 * NotificationBanner
 *
 * Top slide-down toast banner for in-app notifications (realtime).
 * Auto-dismiss sau 4s. Tap → navigate deeplink + mark read.
 *
 * Step 9 — xem docs/steps/step-09-notification-center.md.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../utils/useTheme';
import type { NotificationItem } from '../../api/notificationCenter';
import { useNotificationStore } from '../../stores/NotificationStore';
import { deeplinkFor } from '../../api/notificationCenter';
import { hapticLight } from '../../utils/haptics';

const AUTO_DISMISS_MS = 4000;
const SLIDE_IN_MS = 280;
const SLIDE_OUT_MS = 220;
const TOP_INSET = 40;

export interface NotificationBannerProps {
  item: NotificationItem;
  onDismiss: () => void;
}

export function NotificationBanner({
  item,
  onDismiss,
}: NotificationBannerProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const progress = useSharedValue(0);
  const progressWidth = useSharedValue(100);
  const markRead = useNotificationStore((s) => s.markRead);

  const dismiss = useCallback(() => {
    progress.value = withTiming(0, {
      duration: SLIDE_OUT_MS,
      easing: Easing.in(Easing.quad),
    });
    progressWidth.value = withTiming(0, {
      duration: AUTO_DISMISS_MS,
      easing: Easing.linear,
    });
    setTimeout(() => {
      runOnJS(onDismiss)();
    }, SLIDE_OUT_MS + 50);
  }, [onDismiss, progress, progressWidth]);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: SLIDE_IN_MS,
      easing: Easing.out(Easing.quad),
    });
    progressWidth.value = withTiming(0, {
      duration: AUTO_DISMISS_MS,
      easing: Easing.linear,
    });
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [dismiss, progress, progressWidth]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - progress.value) * -120 },
    ],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const handleTap = () => {
    hapticLight();
    // Mark read if unread
    if (item.readAt === null) markRead(item.id);
    // Navigate to deeplink
    const { screen } = deeplinkFor(item);
    try {
      navigation.navigate(screen);
    } catch {
      navigation.navigate('Home');
    }
    dismiss();
  };

  return (
    <Animated.View
      testID="notification-banner"
      style={[styles.container, containerStyle, { top: TOP_INSET }]}
    >
      <Pressable
        onPress={handleTap}
        style={[
          styles.toast,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.accent },
            progressBarStyle,
          ]}
        />

        <View style={styles.content}>
          <Text style={styles.icon}>{item.iconEmoji}</Text>
          <View style={styles.textBlock}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {item.body ? (
              <Text
                style={[
                  styles.body,
                  { color: theme.colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.body}
              </Text>
            ) : null}
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// NotificationBannerHost
// ============================================================================

/**
 * Root-level component that subscribes to the store's `bannerQueue`
 * and renders one banner at a time. Place at the app root (inside
 * NavigationContainer) so it is always mounted.
 */
export function NotificationBannerHost() {
  const bannerQueue = useNotificationStore((s) => s.bannerQueue);
  const popBanner = useNotificationStore((s) => s.popBanner);
  const currentRef = useRef<NotificationItem | undefined>(undefined);

  // Pick next banner when idle and queue has items
  if (bannerQueue.length > 0 && currentRef.current === undefined) {
    currentRef.current = popBanner();
  }

  const handleDismiss = useCallback(() => {
    currentRef.current = undefined;
  }, []);

  if (!currentRef.current) return null;

  return (
    <NotificationBanner
      item={currentRef.current}
      onDismiss={handleDismiss}
    />
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toast: {
    width: SCREEN_WIDTH - 24,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
    left: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 28,
    marginRight: 10,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontSize: 12,
    marginTop: 1,
  },
  arrow: {
    fontSize: 22,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});
