/**
 * BiometricLoginScreen
 *
 * Shown on app launch when:
 *   - the user has a stored session (token + user) AND
 *   - biometric login is enabled (`biometricEnabled === true`) AND
 *   - the device actually has biometrics available.
 *
 * It auto-prompts the system biometric API on mount. The user can
 * tap "Use password instead" to fall back to the OTP login flow.
 *
 * Layout:
 *   ┌────────────────────────────┐
 *   │                            │
 *   │       Pet Avatar           │
 *   │                            │
 *   │    Welcome back!           │
 *   │    Sign in with Face ID    │
 *   │                            │
 *   │   [   Biometric Icon   ]   │
 *   │                            │
 *   │   [ Use password instead ] │
 *   └────────────────────────────┘
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { useBiometricAuth } from '../hooks/useBiometricAuth';
import { biometryLabel, biometryIcon } from '../api/biometric';
import { hapticSuccess, hapticLight } from '../utils/haptics';
import { Button } from '../shared/components/Button';

export interface BiometricLoginScreenProps {
  /** Called when biometric auth succeeds - drop into the main stack. */
  onAuthenticated: () => void;
  /** Called when user falls back to the password / OTP flow. */
  onUsePassword: () => void;
}

/**
 * Bypass biometrics - mark the user as authenticated directly.
 * (In a real app this would require a server-signed token from
 * a /biometric-redeem endpoint to exchange the device-bound key.)
 */
function biometricBypassSignIn(setStatus: (s: 'authenticated') => void) {
  setStatus('authenticated');
}

export function BiometricLoginScreen({
  onAuthenticated,
  onUsePassword,
}: BiometricLoginScreenProps) {
  const theme = useTheme();
  const { capability, authenticating, authenticate } = useBiometricAuth();
  const setStatus = useAuthStore((s) => (status: 'authenticated') => status);

  // Auto-prompt on first mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!capability || !capability.isAvailable) return;
      const res = await authenticate(`Use ${biometryLabel(capability.biometryType)} to sign in`);
      if (cancelled) return;
      if (res.success) {
        hapticSuccess();
        biometricBypassSignIn(setStatus);
        onAuthenticated();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capability?.isAvailable, capability?.biometryType]);

  // Pulse animation on the biometric icon
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, {
        duration: 900,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Entry spring for the content card
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, {
      damping: theme.easing.spring.damping,
      stiffness: theme.easing.spring.stiffness,
    });
  }, [opacity, translateY, theme.easing.spring]);
  const entryStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleRetry = async () => {
    hapticLight();
    if (!capability) return;
    const res = await authenticate(
      `Use ${biometryLabel(capability.biometryType)} to sign in`
    );
    if (res.success) {
      hapticSuccess();
      biometricBypassSignIn(setStatus);
      onAuthenticated();
    }
  };

  const handleUsePassword = () => {
    hapticLight();
    onUsePassword();
  };

  const bioLabel = capability
    ? biometryLabel(capability.biometryType)
    : 'Biometric';
  const bioIcon = capability ? biometryIcon(capability.biometryType) : '🔒';

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.bg, paddingTop: theme.spacing.xxxl },
      ]}
    >
      <Animated.View style={[styles.content, entryStyle]}>
        {/* Avatar circle */}
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.isDark ? '#1C1C1E' : '#F2F2F7',
              borderRadius: 80,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text style={{ fontSize: 72 }}>🐶</Text>
        </View>

        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.typography.size.title2,
            fontWeight: '700',
            marginTop: 24,
            textAlign: 'center',
          }}
        >
          Welcome back!
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.subhead,
            marginTop: 8,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {capability?.isAvailable
            ? `Sign in with ${bioLabel}`
            : 'Biometric authentication is not available on this device'}
        </Text>

        {/* Big biometric button */}
        <Animated.View style={[styles.bioCircle, pulseStyle]}>
          <Pressable
            onPress={handleRetry}
            disabled={!capability?.isAvailable || authenticating}
            accessibilityRole="button"
            accessibilityLabel={`Authenticate with ${bioLabel}`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={[
                styles.bioInner,
                {
                  backgroundColor: theme.colors.accent,
                  borderRadius: 56,
                },
              ]}
            >
              <Text style={{ fontSize: 48 }}>{bioIcon}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {authenticating ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.size.subhead,
              marginTop: 16,
            }}
          >
            Authenticating...
          </Text>
        ) : capability && !capability.isAvailable ? (
          <Text
            style={{
              color: theme.colors.warning,
              fontSize: theme.typography.size.caption1,
              marginTop: 16,
              paddingHorizontal: 32,
              textAlign: 'center',
            }}
          >
            Please sign in with your password.
          </Text>
        ) : null}

        <View style={{ height: 48 }} />

        <Button
          title="Use password instead"
          onPress={handleUsePassword}
          variant="ghost"
          size="md"
        />

        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.size.caption2,
            marginTop: 24,
            paddingHorizontal: 32,
            textAlign: 'center',
          }}
        >
          Tip: tap the {bioLabel} icon to retry.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
  },
  avatar: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  bioCircle: {
    marginTop: 32,
  },
  bioInner: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
});