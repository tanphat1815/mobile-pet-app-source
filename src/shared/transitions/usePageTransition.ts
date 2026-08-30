/**
 * usePageTransition Hook
 *
 * Horizontal slide transition for onboarding/page-style navigation.
 * Drives the X position of pages relative to a target index.
 *
 * Usage:
 *   const { containerStyle } = usePageTransition({ pageIndex, totalPages });
 *   <Animated.View style={containerStyle}>...</Animated.View>
 */

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { theme as defaultTheme } from '../../utils/theme';

export interface PageTransitionOptions {
  pageIndex: number;
  totalPages: number;
  screenWidth: number;
}

export function usePageTransition({ pageIndex, totalPages, screenWidth }: PageTransitionOptions) {
  const translateX = useSharedValue(-pageIndex * screenWidth);

  useEffect(() => {
    translateX.value = withSpring(-pageIndex * screenWidth, {
      damping: defaultTheme.easing.spring.damping,
      stiffness: defaultTheme.easing.spring.stiffness,
      mass: defaultTheme.easing.spring.mass,
    });
  }, [pageIndex, screenWidth, translateX]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: totalPages * screenWidth,
  }));

  return {
    containerStyle,
    progress: { translateX },
  };
}