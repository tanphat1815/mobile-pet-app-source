/**
 * useReducedMotion Hook
 *
 * Detects the user's reduced motion preference (iOS: Settings > Accessibility > Motion,
 * Android: Settings > Accessibility > Remove animations).
 *
 * Returns true when reduced motion is enabled.
 *
 * Usage in transition hooks:
 *   const reducedMotion = useReducedMotion();
 *   const duration = reducedMotion ? 1 : theme.duration.base;
 */

import { AccessibilityInfo, useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Initial check
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReducedMotion(enabled);
      }
    });

    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReducedMotion(enabled);
      }
    );

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return reducedMotion;
}

// Re-export useColorScheme for convenience
export { useColorScheme };
