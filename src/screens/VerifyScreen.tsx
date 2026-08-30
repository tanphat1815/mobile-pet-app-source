/**
 * Verify Screen
 *
 * Step 2 of the email OTP auth flow.
 * - Displays the email being verified
 * - 6-digit OTP input with auto-focus on mount
 * - Resend countdown timer (60s cooldown)
 * - Calls AuthStore.verifyOtp()
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { useInputShake } from '../shared/transitions/useInputShake';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Verify'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function VerifyScreen({ navigation }: Props) {
  const theme = useTheme();
  const { status, email, error, verifyOtp, sendOtp, clearError } = useAuthStore();

  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);
  const { animatedStyle, shake } = useInputShake();

  const isLoading = status === 'verifying';
  const hasError = !!error;

  // Auto-focus the OTP input when screen mounts
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  // Shake the input container when the store reports an error
  useEffect(() => {
    if (error) shake();
  }, [error, shake]);

  // Countdown timer for resend
  useEffect(() => {
    if (status !== 'otp_sent') return;
    setCooldown(RESEND_COOLDOWN);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Navigate back to Login if we somehow end up here without an email
  useEffect(() => {
    if (status === 'unauthenticated' && !email) {
      navigation.replace('Login');
    }
  }, [status, email, navigation]);

  const handleCodeChange = (text: string) => {
    // Strip non-digits, cap at OTP_LENGTH
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
    clearError();
    if (digits.length === OTP_LENGTH) {
      // Auto-submit when all 6 digits are entered
      handleVerify(digits);
    }
  };

  const handleVerify = async (overrideCode?: string) => {
    const c = overrideCode ?? code;
    if (c.length < OTP_LENGTH) return;
    try {
      await verifyOtp(c);
    } catch {
      // Error is set in the store
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    clearError();
    setCode('');
    try {
      await sendOtp(email);
    } catch {
      // Error is set in the store
    }
  };

  const handleBack = () => {
    clearError();
    navigation.replace('Login');
  };

  const digitWidth = (SCREEN_WIDTH - 48 - 24 - (OTP_LENGTH - 1) * 8) / OTP_LENGTH;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.topSpacer} />

      {/* Back button */}
      <Pressable onPress={handleBack} style={styles.backRow}>
        <Text style={{ color: theme.colors.accent, fontSize: 15, fontWeight: '500' }}>
          ← Change email
        </Text>
      </Pressable>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
          ]}
        >
          Check your inbox
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, fontSize: 15, marginTop: 8 },
          ]}
        >
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{email}</Text>
        </Text>

        <View style={{ height: 40 }} />

        {/* OTP input row */}
        <Animated.View style={[styles.otpRow, animatedStyle]}>
          {Array.from({ length: OTP_LENGTH }, (_, i) => {
            const filled = code.length > i;
            const focused = code.length === i;
            return (
              <View
                key={i}
                style={[
                  styles.digitBox,
                  {
                    width: digitWidth,
                    borderRadius: theme.radius.md,
                    borderWidth: focused || hasError ? 2 : 1,
                    borderColor: hasError
                      ? theme.colors.danger
                      : focused
                      ? theme.colors.accent
                      : theme.colors.border,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.digitText,
                    {
                      color: theme.colors.text,
                      fontSize: 22,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {filled ? code[i] : ''}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Hidden native input that collects the actual digits */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleCodeChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus={false}
          textContentType="oneTimeCode"
          style={styles.hiddenInput}
          importantForAutofill="no"
        />

        {hasError ? (
          <Text
            style={[
              styles.errorText,
              { color: theme.colors.danger, fontSize: theme.typography.size.footnote },
            ]}
          >
            {error}
          </Text>
        ) : null}

        <View style={{ height: 32 }} />

        <Button
          title={isLoading ? 'Verifying...' : 'Verify code'}
          onPress={() => handleVerify()}
          loading={isLoading}
          disabled={code.length < OTP_LENGTH || isLoading}
        />

        <View style={{ height: 24 }} />

        <View style={styles.resendRow}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 14 }}>
            Didn't get it?
          </Text>
          <Pressable onPress={handleResend} disabled={cooldown > 0}>
            <Text
              style={{
                color: cooldown > 0 ? theme.colors.textTertiary : theme.colors.accent,
                fontSize: 14,
                fontWeight: '600',
                marginLeft: 6,
              }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSpacer: { height: 60 },
  backRow: { marginBottom: 24 },
  content: { alignItems: 'center' as const },
  title: { textAlign: 'center' as const },
  subtitle: { textAlign: 'center' as const },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  digitBox: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: { textAlign: 'center', width: '100%' },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  errorText: { marginTop: 12, textAlign: 'center' as const },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});