/**
 * Auth Placeholder Screen
 *
 * Temporary auth screen for Step M-1. Will be replaced by full AuthScreens in Step M-4.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../utils/useTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthPlaceholderScreen(_props: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Sign In (Placeholder)
      </Text>
      <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
        The full auth flow with email OTP will be implemented in Step M-4.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
