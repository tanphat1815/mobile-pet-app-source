/**
 * Login Screen
 *
 * Step 1 of the email OTP auth flow.
 * - Accepts an email address
 * - Validates format
 * - Calls AuthStore.sendOtp()
 * - Navigates to VerifyScreen on success
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useAuthStore } from '../stores/AuthStore';
import { TextField } from '../shared/components/TextField';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { status, email, error, sendOtp, clearError } = useAuthStore();

  const [localEmail, setLocalEmail] = useState(email);
  const [localError, setLocalError] = useState<string | undefined>();
  const inputRef = useRef(null);

  const isLoading = status === 'sending';

  const handleSendOtp = async () => {
    clearError();
    setLocalError(undefined);

    const trimmed = localEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    try {
      await sendOtp(trimmed);
    } catch {
      // Error is set in the store
    }
  };

  // Navigate to Verify once OTP is sent
  React.useEffect(() => {
    if (status === 'otp_sent') {
      navigation.replace('Verify');
    }
  }, [status, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.root, { backgroundColor: theme.colors.bg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSpacer} />

        {/* Brand */}
        <View style={styles.brandSection}>
          <Text
            style={[
              styles.logoText,
              { color: theme.colors.accent, fontSize: 56, fontWeight: '800' },
            ]}
          >
            MP
          </Text>
          <Text
            style={[
              styles.appName,
              { color: theme.colors.text, fontSize: 28, fontWeight: '700' },
            ]}
          >
            Mobile Pet
          </Text>
          <Text
            style={[
              styles.tagline,
              { color: theme.colors.textSecondary, fontSize: 15 },
            ]}
          >
            Sign in to check on your pet
          </Text>
        </View>

        {/* Form */}
        <Card style={styles.form}>
          <Text
            style={[
              styles.formTitle,
              { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
            ]}
          >
            Sign In
          </Text>

          <View style={{ height: theme.spacing.lg }} />

          <TextField
            ref={inputRef}
            label="Email address"
            placeholder="you@example.com"
            value={localEmail}
            onChangeText={(text) => {
              setLocalEmail(text);
              setLocalError(undefined);
              clearError();
            }}
            error={localError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={handleSendOtp}
            shakeOnError={true}
          />

          {(error && !localError) ? (
            <Text
              style={[
                styles.serverError,
                { color: theme.colors.danger, fontSize: theme.typography.size.footnote },
              ]}
            >
              {error}
            </Text>
          ) : null}

          <View style={{ height: theme.spacing.lg }} />

          <Button
            title={isLoading ? 'Sending...' : 'Send verification code'}
            onPress={handleSendOtp}
            loading={isLoading}
            disabled={isLoading}
          />
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  root: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topSpacer: { height: 60 },
  brandSection: { alignItems: 'center' as const, marginBottom: 40 },
  logoText: { letterSpacing: 4, marginBottom: 8 },
  appName: { letterSpacing: 0.3, marginBottom: 8 },
  tagline: { textAlign: 'center' as const },
  form: { paddingHorizontal: 4, paddingVertical: 24 },
  formTitle: { textAlign: 'center' as const, marginBottom: 4 },
  serverError: { marginTop: 8, textAlign: 'center' as const },
  bottomSpacer: { height: 40 },
};