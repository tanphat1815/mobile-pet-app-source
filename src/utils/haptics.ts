/**
 * Haptics utility
 *
 * Thin wrapper over `expo-haptics` that:
 *   - safely no-ops if haptics aren't supported (web, simulators)
 *   - never throws - failures are swallowed
 *   - respects reduced-motion / accessibility settings (no haptics
 *     when Reduce Motion is enabled on iOS)
 *
 * Use the typed helpers instead of importing expo-haptics directly.
 */

import * as Haptics from 'expo-haptics';
import { AccessibilityInfo, Platform } from 'react-native';

// ----------------------------------------------------------------------------
// Capability detection
// ----------------------------------------------------------------------------

let cachedAvailable: boolean | null = null;
let cachedReduceMotion: boolean | null = null;

let reduceMotionSub: { remove: () => void } | null = null;

async function refreshReduceMotion(): Promise<void> {
  try {
    cachedReduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    cachedReduceMotion = false;
  }
}

/** Subscribe to Reduce Motion preference changes. Idempotent. */
export function initHapticsAccessibility(): () => void {
  if (Platform.OS === 'web') return () => {};
  if (reduceMotionSub) return reduceMotionSub.remove;
  refreshReduceMotion();
  try {
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        cachedReduceMotion = enabled;
      }
    );
    reduceMotionSub = sub;
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

function shouldHaptic(): boolean {
  // Web has no haptic support.
  if (Platform.OS === 'web') return false;
  if (cachedAvailable === null) {
    // Best-effort probe - assume available until told otherwise.
    cachedAvailable = true;
  }
  if (cachedReduceMotion) return false;
  return cachedAvailable;
}

// ----------------------------------------------------------------------------
// Typed helpers
// ----------------------------------------------------------------------------

/** Light tap - common UI confirmation. */
export async function hapticLight(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    cachedAvailable = false;
  }
}

/** Medium tap - selection change / button press. */
export async function hapticMedium(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    cachedAvailable = false;
  }
}

/** Heavy tap - significant action / impact. */
export async function hapticHeavy(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    cachedAvailable = false;
  }
}

/** Success notification - 2 quick taps. */
export async function hapticSuccess(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    cachedAvailable = false;
  }
}

/** Warning notification. */
export async function hapticWarning(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    cachedAvailable = false;
  }
}

/** Error notification. */
export async function hapticError(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    cachedAvailable = false;
  }
}

/** Selection tick (used by sliders / segmented controls). */
export async function hapticSelection(): Promise<void> {
  if (!shouldHaptic()) return;
  try {
    await Haptics.selectionAsync();
  } catch {
    cachedAvailable = false;
  }
}

// ----------------------------------------------------------------------------
// Typed enum surface
// ----------------------------------------------------------------------------

export const HapticStyle = {
  Light: 'light',
  Medium: 'medium',
  Heavy: 'heavy',
  Success: 'success',
  Warning: 'warning',
  Error: 'error',
  Selection: 'selection',
} as const;

export type HapticStyleName = (typeof HapticStyle)[keyof typeof HapticStyle];

export async function haptic(style: HapticStyleName): Promise<void> {
  switch (style) {
    case HapticStyle.Light:
      return hapticLight();
    case HapticStyle.Medium:
      return hapticMedium();
    case HapticStyle.Heavy:
      return hapticHeavy();
    case HapticStyle.Success:
      return hapticSuccess();
    case HapticStyle.Warning:
      return hapticWarning();
    case HapticStyle.Error:
      return hapticError();
    case HapticStyle.Selection:
      return hapticSelection();
  }
}