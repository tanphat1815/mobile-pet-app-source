/**
 * Badge Component
 *
 * Pill-shaped badge with count or text.
 * Uses usePopAnimation for entry animation.
 */

import React, { useEffect } from 'react';
import { Text, ViewStyle, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '../../utils/useTheme';
import { usePopAnimation } from '../transitions/usePopAnimation';

interface BadgeProps {
  count?: number;
  label?: string;
  variant?: 'primary' | 'success' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  autoAnimate?: boolean;
}

export function Badge({
  count,
  label,
  variant = 'danger',
  size = 'md',
  style,
  autoAnimate = true,
}: BadgeProps) {
  const theme = useTheme();
  const { containerStyle: popStyle, trigger } = usePopAnimation();

  useEffect(() => {
    if (autoAnimate) {
      trigger();
    }
  }, [autoAnimate, trigger]);

  const palette = (() => {
    switch (variant) {
      case 'primary':
        return { bg: theme.colors.accent, text: theme.colors.textInverse };
      case 'success':
        return { bg: theme.colors.success, text: theme.colors.textInverse };
      case 'danger':
        return { bg: theme.colors.danger, text: theme.colors.textInverse };
      case 'warning':
        return { bg: theme.colors.warning, text: theme.colors.textInverse };
      case 'neutral':
        return { bg: theme.colors.border, text: theme.colors.text };
    }
  })();

  const sizeMap = {
    sm: { v: 2, h: 8, font: theme.typography.size.caption2, minW: 18 },
    md: { v: 4, h: 10, font: theme.typography.size.footnote, minW: 22 },
  };
  const sz = sizeMap[size];

  const display = count !== undefined && count > 99 ? '99+' : label ?? (count !== undefined ? String(count) : '');

  const containerStyle: ViewStyle = {
    backgroundColor: palette.bg,
    paddingVertical: sz.v,
    paddingHorizontal: sz.h,
    borderRadius: theme.radius.pill,
    minWidth: sz.minW,
    minHeight: sz.minW,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: TextStyle = {
    color: palette.text,
    fontSize: sz.font,
    fontWeight: theme.typography.weight.semibold,
  };

  return (
    <Animated.View style={[containerStyle, popStyle, style]}>
      {display ? <Text style={textStyle}>{display}</Text> : null}
    </Animated.View>
  );
}