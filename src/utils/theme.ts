/**
 * Apple HIG Design Tokens (Theme)
 *
 * This file is the SINGLE SOURCE OF TRUTH for all design tokens.
 * All UI components must import from here using `theme.colors.*`, `theme.spacing.*`,
 * `theme.radius.*`, `theme.shadows.*`, `theme.typography.*`, `theme.easing.*`, `theme.duration.*`.
 *
 * DO NOT hard-code hex colors, pixel values, or animation timing anywhere else.
 *
 * Dark mode tokens are applied automatically via useTheme() based on system color scheme.
 * Reduced motion durations are applied automatically via useReducedMotion().
 */

import { Platform, ViewStyle } from 'react-native';

// ============================================================================
// Color Tokens
// ============================================================================

const lightColors: Record<string, string> = {
  // Brand — Cozy Cream accent (warmer, paired with cream surfaces)
  accent: '#007AFF',
  accentMuted: '#5AC8FA',

  // Semantic
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  info: '#5856D6',

  // Surfaces — Cozy Cream palette (port từ desktop `app-themes.js` light)
  //   --bg-primary: #FAF7F2 (kem ấm, nền app)
  //   --bg-secondary: #FFFDF9 (kem sáng, surface 2)
  //   --bg-tertiary: #F2EDE4 (kem đậm, surface 3)
  //   --bg-elevated: #FFFFFF (trắng, card nổi)
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surface2: '#FFFDF9',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F2EDE4',

  // Text — warm tone (port từ desktop text-primary: #1E2024, secondary: #686E78, tertiary: #989EA8)
  text: '#1E2024',
  textSecondary: '#686E78',
  textTertiary: '#989EA8',
  textInverse: '#FFFFFF',

  // Borders & dividers — be ấm (port từ desktop --border: #EAE4D9, --border-strong: #D8D0C2)
  border: '#EAE4D9',
  borderStrong: '#D8D0C2',
  separator: 'rgba(30, 32, 36, 0.08)',

  // Overlay
  overlay: 'rgba(30, 32, 36, 0.4)',
  scrim: 'rgba(30, 32, 36, 0.2)',

  // Pet stats
  statHappiness: '#FF9500',
  statHunger: '#34C759',
  statEnergy: '#5856D6',
  statHealth: '#FF2D55',
};

// Dark mode — giữ nguyên giá trị desktop (`--bg-primary: #1C1C1E`, ...).
// Chỉ update shadowColor từ '#000' sang '#1E2024' để đồng bộ bento warmth với light mode.
const darkColors: Record<string, string> = {
  accent: '#0A84FF',
  accentMuted: '#64D2FF',

  success: '#30D158',
  danger: '#FF453A',
  warning: '#FF9F0A',
  info: '#5E5CE6',

  bg: '#1C1C1E',
  surface: '#2C2C2E',
  surface2: '#2C2C2E',
  surfaceElevated: '#2C2C2E',
  surfaceMuted: '#3A3A3C',

  text: '#F2F2F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#8E8E93',
  textInverse: '#000000',

  border: '#38383A',
  borderStrong: '#48484A',
  separator: 'rgba(84, 84, 88, 0.65)',

  overlay: 'rgba(0, 0, 0, 0.6)',
  scrim: 'rgba(0, 0, 0, 0.4)',

  statHappiness: '#FF9F0A',
  statHunger: '#30D158',
  statEnergy: '#5E5CE6',
  statHealth: '#FF375F',
};

// ============================================================================
// Typography Tokens (Apple HIG)
// ============================================================================

export const typography = {
  // Sizes aligned to Apple HIG scale
  size: {
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subhead: 15,
    callout: 16,
    body: 17,
    headline: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },
  // Line height multiplier
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  // Font family (system fonts: iOS = SF Pro, Android = Roboto)
  fontFamily: {
    system: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    rounded: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  // Font weights
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },
} as const;

export type TypographyTokens = typeof typography;

// ============================================================================
// Spacing Tokens (4pt grid - Apple HIG)
// ============================================================================

export const spacing = {
  none: 0,
  xs: 4,   // 1 unit
  sm: 8,   // 2 units
  md: 12,  // 3 units
  lg: 16,  // 4 units
  xl: 20,  // 5 units
  xxl: 24, // 6 units
  xxxl: 32, // 8 units
  huge: 40,
  giant: 48,
} as const;

// Numeric index for spacing[1..8] (4pt grid)
export const spacingGrid = [0, 4, 8, 12, 16, 20, 24, 32, 40] as const;

export type SpacingTokens = typeof spacing;

// ============================================================================
// Radius Tokens
// ============================================================================

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 9999,
} as const;

export type RadiusTokens = typeof radius;

// ============================================================================
// Shadow / Elevation Tokens (Bento-style — warm tone, soft blur)
// ============================================================================
// Port từ desktop `tokens.css` bento canvas: shadow tinh tế, blur rộng, opacity thấp,
// shadowColor dùng warm tone (#1E2024) để phù hợp Cozy Cream palette thay vì đen lạnh.
export const shadows: Record<'elevation1' | 'elevation2' | 'elevation3' | 'elevation4', ViewStyle> = {
  elevation1: {
    shadowColor: '#1E2024',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  elevation2: {
    shadowColor: '#1E2024',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevation3: {
    shadowColor: '#1E2024',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  elevation4: {
    shadowColor: '#1E2024',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

// ============================================================================
// Motion Tokens (Easing + Duration)
// ============================================================================

export const easing = {
  // Apple-style easing curves
  standard: [0.4, 0.0, 0.2, 1] as const,     // Material standard
  decelerate: [0.0, 0.0, 0.2, 1] as const,   // Slow-out
  accelerate: [0.4, 0.0, 1, 1] as const,     // Slow-in
  spring: { damping: 15, stiffness: 150, mass: 1 } as const,
} as const;

export const duration = {
  fast: 150,
  base: 220,
  slow: 360,
  verySlow: 500,
} as const;

export type DurationTokens = typeof duration;

// ============================================================================
// Component Tokens
// ============================================================================

export const layout = {
  // Apple HIG: minimum tap target 44pt x 44pt
  minTapTarget: 44,
  // Safe area insets
  safeAreaTop: 47,
  safeAreaBottom: 34,
  // Screen widths
  breakpointTablet: 768,
  breakpointDesktop: 1024,
} as const;

// ============================================================================
// Theme Object (Light + Dark)
// ============================================================================

export interface Theme {
  colors: Record<string, string>;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  spacingGrid: typeof spacingGrid;
  radius: RadiusTokens;
  shadows: typeof shadows;
  easing: typeof easing;
  duration: DurationTokens;
  layout: typeof layout;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  typography,
  spacing,
  spacingGrid,
  radius,
  shadows,
  easing,
  duration,
  layout,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  typography,
  spacing,
  spacingGrid,
  radius,
  shadows,
  easing,
  duration,
  layout,
  isDark: true,
};

// ============================================================================
// Default export (light theme as fallback)
// ============================================================================

export const theme = lightTheme;
