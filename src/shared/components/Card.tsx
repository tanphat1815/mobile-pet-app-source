/**
 * Card Component
 *
 * Surface card with rounded corners + elevation shadow.
 * Used for content grouping, list rows, modal sections.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../utils/useTheme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: number | 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', padding = 'md', style }: CardProps) {
  const theme = useTheme();

  const paddingMap = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.lg,
    lg: theme.spacing.xxl,
  };
  const padValue = typeof padding === 'number' ? padding : paddingMap[padding];

  const containerStyle: ViewStyle = {
    backgroundColor: variant === 'flat' ? theme.colors.surface2 : theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: padValue,
    // Bento style: dùng shadow tone ấm (#1E2024) + border be tinh tế
    borderWidth: variant === 'flat' ? 0 : 1,
    borderColor: theme.colors.border,
    ...(variant === 'elevated' ? theme.shadows.elevation3 : theme.shadows.elevation2),
  };

  return <View style={[styles.card, containerStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
  },
});