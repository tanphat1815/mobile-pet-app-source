/**
 * Theme Tokens
 *
 * Verifies that the design tokens exposed by `utils/theme.ts` contain
 * every key the rest of the app relies on, and that dark mode swaps
 * in the expected values for the brand / surface / text tokens.
 */

import { describe, it, expect } from 'vitest';
import {
  lightTheme,
  darkTheme,
  typography,
  spacing,
  spacingGrid,
  radius,
  easing,
  duration,
  shadows,
  layout,
} from '@/utils/theme';

const REQUIRED_COLOR_KEYS = [
  'accent',
  'accentMuted',
  'success',
  'danger',
  'warning',
  'info',
  'bg',
  'surface',
  'surface2',
  'surfaceElevated',
  'text',
  'textSecondary',
  'textTertiary',
  'textInverse',
  'border',
  'separator',
  'overlay',
  'scrim',
  'statHappiness',
  'statHunger',
  'statEnergy',
  'statHealth',
];

const REQUIRED_SHADOW_KEYS = ['elevation1', 'elevation2', 'elevation3', 'elevation4'];

describe('theme tokens', () => {
  it('light theme exposes all required color tokens', () => {
    for (const k of REQUIRED_COLOR_KEYS) {
      expect(lightTheme.colors[k]).toBeTypeOf('string');
      expect(lightTheme.colors[k].length).toBeGreaterThan(0);
    }
  });

  it('dark theme exposes all required color tokens', () => {
    for (const k of REQUIRED_COLOR_KEYS) {
      expect(darkTheme.colors[k]).toBeTypeOf('string');
      expect(darkTheme.colors[k].length).toBeGreaterThan(0);
    }
  });

  it('dark theme differs from light theme on the swapped tokens', () => {
    // Accent, bg, surface, text should change between modes.
    expect(lightTheme.colors.accent).not.toEqual(darkTheme.colors.accent);
    expect(lightTheme.colors.bg).not.toEqual(darkTheme.colors.bg);
    expect(lightTheme.colors.surface).not.toEqual(darkTheme.colors.surface);
    expect(lightTheme.colors.text).not.toEqual(darkTheme.colors.text);
  });

  it('isDark flag is correct', () => {
    expect(lightTheme.isDark).toBe(false);
    expect(darkTheme.isDark).toBe(true);
  });

  it('exposes typography tokens', () => {
    expect(typography.size.body).toBe(17);
    expect(typography.size.title1).toBe(28);
    expect(typography.lineHeight.normal).toBeCloseTo(1.4);
    expect(Object.keys(typography.weight)).toEqual(
      expect.arrayContaining(['regular', 'medium', 'semibold', 'bold', 'heavy'])
    );
  });

  it('exposes spacing on the 4pt grid', () => {
    for (const v of Object.values(spacing)) {
      expect(v % 4).toBe(0);
    }
    expect(spacing.none).toBe(0);
    expect(spacing.xs).toBe(4);
    expect(spacing.lg).toBe(16);
    expect(spacingGrid.length).toBe(9);
  });

  it('exposes radius tokens', () => {
    expect(radius.none).toBe(0);
    expect(radius.pill).toBe(9999);
    expect(Object.keys(radius)).toEqual(
      expect.arrayContaining(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill'])
    );
  });

  it('exposes shadow tokens for each elevation level', () => {
    for (const k of REQUIRED_SHADOW_KEYS) {
      expect(shadows[k as keyof typeof shadows]).toBeDefined();
      expect(shadows[k as keyof typeof shadows].shadowColor).toBe('#000');
    }
  });

  it('exposes easing + duration tokens', () => {
    expect(easing.standard).toHaveLength(4);
    expect(easing.spring.damping).toBeGreaterThan(0);
    expect(easing.spring.stiffness).toBeGreaterThan(0);
    expect(duration.fast).toBeLessThan(duration.base);
    expect(duration.base).toBeLessThan(duration.slow);
  });

  it('exposes layout tokens', () => {
    expect(layout.minTapTarget).toBeGreaterThanOrEqual(44);
  });
});