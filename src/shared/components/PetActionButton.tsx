/**
 * PetActionButton
 *
 * Square tappable card for pet actions (Feed, Play, Sleep, Pet).
 * Shows an emoji icon and label. Shows a small spinner when pending.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../utils/useTheme';
import type { PetAction } from '../../api/petTypes';

export interface PetActionButtonProps {
  action: PetAction;
  label: string;
  emoji: string;
  onPress: () => void;
  disabled?: boolean;
  pending?: boolean;
}

export function PetActionButton({
  action,
  label,
  emoji,
  onPress,
  disabled = false,
  pending = false,
}: PetActionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || pending}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.separator,
          opacity: disabled ? 0.4 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {pending ? (
        <ActivityIndicator color={theme.colors.accent} />
      ) : (
        <Text style={{ fontSize: 32 }}>{emoji}</Text>
      )}
      <Text
        style={[
          styles.label,
          {
            color: theme.colors.text,
            fontSize: theme.typography.size.subhead,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  label: {
    marginTop: 8,
  },
});