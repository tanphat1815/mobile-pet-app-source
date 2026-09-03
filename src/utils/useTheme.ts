/**
 * useTheme Hook
 *
 * Returns the appropriate theme based on:
 *   1. appThemeId from SettingsStore (nếu user chọn seasonal/premium theme)
 *   2. system color scheme (mặc định light/dark từ OS)
 *
 * Usage:
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.colors.bg }} />
 */

import { useColorScheme, ColorSchemeName } from 'react-native';
import { lightTheme, darkTheme, Theme } from './theme';
import { APP_THEMES, ThemeId } from './appThemes';
import { useSettingsStore } from '../stores/SettingsStore';

export function useTheme(): Theme {
  const colorScheme = useColorScheme();
  const appThemeId = useSettingsStore((s) => s.settings.appThemeId);
  return resolveAppTheme(appThemeId, colorScheme);
}

/**
 * Pure resolver — cũng dùng được ở ngoài React (tests, helpers).
 */
export function resolveAppTheme(
  selected: ThemeId | undefined,
  systemColorScheme: ColorSchemeName
): Theme {
  const id = selected ?? 'auto';
  const sysIsDark = systemColorScheme === 'dark';
  // Nếu user chọn auto/system → fallback về light/dark theo OS
  if (id === 'auto') {
    return sysIsDark ? darkTheme : lightTheme;
  }
  // Nếu user chọn 'light' hoặc 'dark' cụ thể → dùng theme đó (override OS)
  if (id === 'light' || id === 'dark') {
    return id === 'dark' ? darkTheme : lightTheme;
  }
  // Seasonal/premium → trả về theme với tokens của theme đó nhưng giữ
  // typography/spacing/radius/shadows/easing/duration/layout từ base theme.
  const appTheme = APP_THEMES[id];
  if (!appTheme) return lightTheme;
  const base = sysIsDark ? darkTheme : lightTheme;
  return {
    ...base,
    colors: { ...base.colors, ...appTheme.tokens },
  };
}

// ============================================================================
// Dev helpers (gated behind __DEV__) — dùng cho e2e tests qua window
// ============================================================================

declare global {
  interface Window {
    __MOBILE_PET__?: {
      setAppTheme?: (id: ThemeId) => void;
      getCurrentTheme?: () => ThemeId;
    };
  }
}

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  // Expose cho Playwright e2e tests
  (globalThis as any).__MOBILE_PET__ = {
    setAppTheme: (id: ThemeId) => {
      useSettingsStore.setState((s) => ({
        settings: { ...s.settings, appThemeId: id },
      }));
    },
    getCurrentTheme: () => useSettingsStore.getState().settings.appThemeId,
  };
  // Mirror lên window cho browser
  if (typeof window !== 'undefined') {
    (window as any).__MOBILE_PET__ = (globalThis as any).__MOBILE_PET__;
  }
}

