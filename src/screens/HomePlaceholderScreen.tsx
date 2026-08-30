/**
 * Home Placeholder Screen
 *
 * Temporary home screen for Steps M-1 to M-3. Will be replaced by full
 * HomeScreen in Step M-6. Currently demonstrates:
 * - Theme tokens (light/dark)
 * - Reduced motion detection
 * - API client + storage (Step M-3)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useReducedMotion } from '../utils/useReducedMotion';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { pingApi, getApiError } from '../api/client';
import {
  storage,
  StorageKeys,
  getThemePreference,
  setThemePreference,
} from '../api/storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type PingState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; uuid: string }
  | { kind: 'error'; message: string };

export function HomePlaceholderScreen({ navigation }: Props) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  const [pingState, setPingState] = useState<PingState>({ kind: 'idle' });
  const [storedPref, setStoredPref] = useState<string>('-');
  const [writeValue, setWriteValue] = useState<string>('');
  const [readValue, setReadValue] = useState<string>('-');

  const runPing = async () => {
    setPingState({ kind: 'loading' });
    try {
      const ok = await pingApi();
      if (ok) {
        setPingState({ kind: 'ok', uuid: 'reachable' });
      } else {
        setPingState({ kind: 'error', message: 'Ping returned false' });
      }
    } catch (err) {
      const e = getApiError(err);
      setPingState({ kind: 'error', message: `${e.code}: ${e.message}` });
    }
  };

  const loadThemePref = async () => {
    const pref = await getThemePreference();
    setStoredPref(pref);
  };

  const toggleThemePref = async () => {
    const current = await getThemePreference();
    const next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    await setThemePreference(next);
    setStoredPref(next);
  };

  const writeTest = async () => {
    await storage.set(StorageKeys.OnboardingComplete, writeValue || 'written');
  };

  const readTest = async () => {
    const v = await storage.getString(StorageKeys.OnboardingComplete);
    setReadValue(v ?? '(empty)');
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.content}
    >
      <Card>
        <Text style={[styles.h1, { color: theme.colors.text }]}>Step M-3</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          API client + storage verification.
        </Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Theme: {theme.isDark ? 'Dark' : 'Light'} | Reduced motion:{' '}
          {reducedMotion ? 'On' : 'Off'}
        </Text>
      </Card>

      <View style={{ height: theme.spacing.lg }} />

      <Card>
        <Text style={[styles.h2, { color: theme.colors.text }]}>API Client</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Base URL: <Text style={styles.mono}>{process.env.EXPO_PUBLIC_API_BASE_URL ?? '(default)'}</Text>
        </Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Ping status:{' '}
          {pingState.kind === 'idle' && 'not yet'}
          {pingState.kind === 'loading' && 'loading...'}
          {pingState.kind === 'ok' && `ok (${pingState.uuid})`}
          {pingState.kind === 'error' && `error (${pingState.message})`}
        </Text>
        <View style={{ height: theme.spacing.md }} />
        <Button title="Ping API" onPress={runPing} loading={pingState.kind === 'loading'} />
      </Card>

      <View style={{ height: theme.spacing.lg }} />

      <Card>
        <Text style={[styles.h2, { color: theme.colors.text }]}>Storage</Text>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Theme preference: {storedPref}
        </Text>
        <View style={{ height: theme.spacing.sm }} />
        <Button title="Load theme pref" onPress={loadThemePref} variant="secondary" size="sm" />
        <View style={{ height: theme.spacing.xs }} />
        <Button title="Toggle theme pref" onPress={toggleThemePref} variant="secondary" size="sm" />

        <View style={{ height: theme.spacing.md }} />
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Read value: {readValue}
        </Text>
        <View style={{ height: theme.spacing.sm }} />
        <Button title="Write test" onPress={writeTest} variant="secondary" size="sm" />
        <View style={{ height: theme.spacing.xs }} />
        <Button title="Read test" onPress={readTest} variant="secondary" size="sm" />
      </Card>

      <View style={{ height: theme.spacing.lg }} />

      <Button title="Go to Auth (placeholder)" onPress={() => navigation.navigate('Auth')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    marginBottom: 4,
    lineHeight: 21,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
  },
});