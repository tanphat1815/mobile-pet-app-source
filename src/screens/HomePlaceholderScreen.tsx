/**
 * Home Placeholder Screen
 *
 * Temporary home screen for Step M-1. Will be replaced by full HomeScreen in Step M-6.
 * Verifies that theme tokens render correctly across light/dark modes.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../utils/useTheme';
import { useReducedMotion } from '../utils/useReducedMotion';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomePlaceholderScreen({ navigation }: Props) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Mobile Pet App
      </Text>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            ...theme.shadows.elevation2,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Step M-1 - Scaffold + Theme Foundation
        </Text>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Apple HIG design tokens are loaded correctly.
        </Text>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Current mode: {theme.isDark ? 'Dark' : 'Light'}
        </Text>
        <Text style={[styles.cardBody, { color: theme.colors.textSecondary }]}>
          Reduced motion: {reducedMotion ? 'On' : 'Off'}
        </Text>
      </View>

      <View style={styles.spacer} />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.pill,
            opacity: pressed ? 0.8 : 1,
            ...theme.shadows.elevation1,
          },
        ]}
        onPress={() => navigation.navigate('Auth')}
      >
        <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
          Go to Auth (placeholder)
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: 0.4,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardBody: {
    fontSize: 15,
    marginBottom: 6,
    lineHeight: 21,
  },
  spacer: {
    height: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
