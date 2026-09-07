/**
 * AchievementToast
 *
 * Slide-down notification khi unlock achievement mới. Auto-dismiss
 * sau 4s. Tap → navigate tới AchievementsScreen + scroll to achievement.
 *
 * Step 8 — xem docs/steps/step-08-achievements-parity.md.
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
import {
  Achievement,
  rarityColor,
  rarityLabel,
  rarityGlyph,
} from '../../api/achievementTypes';
import { useAchievementStore } from '../../stores/AchievementStore';
import { hapticLight } from '../../utils/haptics';

const AUTO_DISMISS_MS = 4000;
const SLIDE_IN_MS = 280;
const SLIDE_OUT_MS = 220;
const TOP_INSET = 40; // approx safe-area top

export interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const progress = useSharedValue(0);
  const progressWidth = useSharedValue(100);

  const dismiss = useCallback(() => {
    progress.value = withTiming(0, { duration: SLIDE_OUT_MS, easing: Easing.in(Easing.quad) });
    progressWidth.value = withTiming(0, {
      duration: AUTO_DISMISS_MS,
      easing: Easing.linear,
    });
    setTimeout(() => {
      runOnJS(onDismiss)();
    }, SLIDE_OUT_MS + 50);
  }, [onDismiss, progress, progressWidth]);

  useEffect(() => {
    // Slide in
    progress.value = withTiming(1, {
      duration: SLIDE_IN_MS,
      easing: Easing.out(Easing.quad),
    });
    // Start progress countdown
    progressWidth.value = withTiming(0, {
      duration: AUTO_DISMISS_MS,
      easing: Easing.linear,
    });
    // Auto-dismiss
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

  const rarityColorHex = rarityColor(achievement.rarity);

  const handleTap = () => {
    hapticLight();
    // Navigate to Achievements tab
    navigation.navigate('Achievements');
    dismiss();
  };

  return (
    <Animated.View
      testID="achievement-toast"
      style={[
        styles.container,
        containerStyle,
        { top: TOP_INSET },
      ]}
    >
      <Pressable
        onPress={handleTap}
        style={[
          styles.toast,
          {
            backgroundColor: theme.colors.surface,
            borderColor: rarityColorHex,
            shadowColor: rarityColorHex,
          },
        ]}
      >
        {/* Progress bar */}
        <Animated.View
          style={[
            styles.progressBar,
            { backgroundColor: rarityColorHex, left: 0 },
            progressBarStyle,
          ]}
        />

        <View style={styles.content}>
          <Text style={styles.icon}>{achievement.icon}</Text>
          <View style={styles.textBlock}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: rarityColorHex }]}>
                Achievement Unlocked!
              </Text>
              <Text style={styles.rarity}>
                {rarityGlyph(achievement.rarity)} {rarityLabel(achievement.rarity)}
              </Text>
            </View>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {achievement.title}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ============================================================================
// AchievementToastHost
// ============================================================================

/**
 * Root-level component that subscribes to the store's `unlockedQueue`
 * and renders one toast at a time. Place this at the root of the app
 * (e.g. inside NavigationContainer) so it is always mounted.
 */
export function AchievementToastHost() {
  const unlockedQueue = useAchievementStore((s) => s.unlockedQueue);
  const popToastAchievement = useAchievementStore((s) => s.popToastAchievement);
  const currentAchievementRef = useRef<Achievement | undefined>(undefined);

  // Pick the next achievement from queue when queue changes and we're idle
  if (
    unlockedQueue.length > 0 &&
    currentAchievementRef.current === undefined
  ) {
    currentAchievementRef.current = popToastAchievement();
  }

  const handleDismiss = useCallback(() => {
    currentAchievementRef.current = undefined;
  }, []);

  if (!currentAchievementRef.current) return null;

  return (
    <AchievementToast
      achievement={currentAchievementRef.current}
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
  },
  toast: {
    width: SCREEN_WIDTH - 24,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 10,
  },
  textBlock: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rarity: {
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 24,
    color: '#9CA3AF',
    marginLeft: 8,
  },
});
