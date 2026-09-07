/**
 * PairingCodeDisplay
 *
 * Big 6-digit pairing code with auto-spacing (123-456). Also shows the
 * countdown until expiry and a progress bar.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import {
  formatPairingCode,
  secondsUntilExpiry,
  formatCountdown,
} from '../../api/pairingTypes';

export interface PairingCodeDisplayProps {
  code: string;
  expiresAt: number;
  /** Tick callback for re-renders (every second). */
  now: number;
}

export function PairingCodeDisplay({ code, expiresAt, now }: PairingCodeDisplayProps) {
  const theme = useTheme();
  const totalTtl = 5 * 60; // matches api/pairing.ts PAIRING_TTL_MS
  const remaining = secondsUntilExpiry(expiresAt, now);
  const progress = Math.max(0, Math.min(1, remaining / totalTtl));
  const isExpiring = remaining > 0 && remaining <= 60;

  const animatedProgress = useSharedValue(progress);
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 900,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, animatedProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.surface2,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.typography.size.caption1,
          fontWeight: '600',
          letterSpacing: 1,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        PAIRING CODE
      </Text>
      <Text
        style={[
          styles.code,
          {
            color: theme.colors.text,
            fontSize: 48,
          },
        ]}
        accessibilityLabel={`Pairing code ${code}`}
      >
        {formatPairingCode(code)}
      </Text>
      <Text
        style={{
          color: isExpiring ? theme.colors.danger : theme.colors.textSecondary,
          fontSize: theme.typography.size.subhead,
          marginTop: 4,
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        }}
      >
        {remaining > 0 ? `Expires in ${formatCountdown(remaining)}` : 'Expired'}
      </Text>
      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.border },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: isExpiring
                ? theme.colors.danger
                : theme.colors.accent,
            },
            progressStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  code: {
    fontWeight: '700',
    letterSpacing: 6,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
  },
});