/**
 * BlurHeader Component
 *
 * iOS-style blurred header (vibrancy effect).
 * Falls back to solid color on Android (expo-blur compatibility).
 * Supports left/right action slots.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import { layout } from '../../utils/theme';

interface BlurHeaderProps {
  title?: string;
  subtitle?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  tint?: 'light' | 'dark';
  style?: ViewStyle;
}

/**
 * NOTE: This is a fallback implementation using solid surface background.
 * The full iOS vibrancy effect requires expo-blur; that package currently has
 * a build incompatibility with Expo SDK 57 + Node 22 (see package.json comments).
 * When expo-blur is re-added in a future step, swap the inner View for
 * <BlurView intensity={80} tint={tint === 'dark' ? 'dark' : 'light'} />.
 */
export function BlurHeader({
  title,
  subtitle,
  leading,
  trailing,
  tint,
  style,
}: BlurHeaderProps) {
  const theme = useTheme();

  // Determine tint from theme if not specified
  const effectiveTint = tint ?? (theme.isDark ? 'dark' : 'light');

  const containerStyle: ViewStyle = {
    backgroundColor:
      effectiveTint === 'dark' ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: Platform.OS === 'ios' ? layout.safeAreaTop + 44 : 56,
  };

  return (
    <View style={[containerStyle, style]}>
      <View style={styles.side}>{leading}</View>
      <View style={styles.center}>
        {title ? (
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.typography.size.headline,
              fontWeight: theme.typography.weight.semibold,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.footnote,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{trailing}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  side: {
    minWidth: 80,
    alignItems: 'flex-start',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
});