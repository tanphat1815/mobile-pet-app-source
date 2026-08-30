/**
 * StatBar
 *
 * Horizontal progress bar for a single pet stat (0..100).
 * Color shifts based on value (low = red, mid = amber, high = green)
 * using the theme tokens.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';

export interface StatBarProps {
  label: string;
  value: number; // 0..100
  inverse?: boolean; // true => low value is GOOD (e.g. hunger)
  reducedMotion?: boolean;
  trailingLabel?: string;
}

function valueColor(value: number, inverse: boolean, theme: ReturnType<typeof useTheme>): string {
  const score = inverse ? 100 - value : value;
  if (score >= 70) return theme.colors.success;
  if (score >= 40) return theme.colors.warning;
  return theme.colors.danger;
}

export function StatBar({
  label,
  value,
  inverse = false,
  reducedMotion = false,
  trailingLabel,
}: StatBarProps) {
  const theme = useTheme();
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.value = reducedMotion
      ? value
      : withTiming(value, { duration: 600 });
  }, [value, reducedMotion, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, progress.value))}%`,
  }));

  const color = valueColor(value, inverse, theme);
  const displayValue = Math.round(value);

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text
          style={[
            styles.label,
            { color: theme.colors.text, fontSize: theme.typography.size.subhead },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.value,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
            },
          ]}
        >
          {trailingLabel ?? `${displayValue}%`}
        </Text>
      </View>
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.isDark ? '#2C2C2E' : '#E5E5EA',
            borderRadius: theme.radius.sm,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: color, borderRadius: theme.radius.sm },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 12 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontWeight: '500' },
  value: {},
  track: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});