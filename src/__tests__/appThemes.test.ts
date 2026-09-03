/**
 * App Theme Registry
 *
 * Verify rằng:
 *  - 13 themes được khai báo (12 + auto)
 *  - Mỗi theme có tokens required (bg, surface, text, accent, border)
 *  - Decorations structure đúng cho từng theme
 *  - isThemeUnlocked() đúng cho free vs premium
 *  - resolveThemeId() map auto → light/dark theo system
 *  - resolveAppTheme() trả về Theme hợp lệ
 *
 * Step 2 — xem docs/steps/step-02-seasonal-premium-themes.md.
 */

import { describe, it, expect } from 'vitest';
import {
  APP_THEMES,
  ALL_THEME_IDS,
  THEMES_BY_GROUP,
  isThemeUnlocked,
  getThemeMeta,
  resolveThemeId,
} from '@/utils/appThemes';
import { resolveAppTheme } from '@/utils/useTheme';
import { lightTheme, darkTheme } from '@/utils/theme';

describe('appThemes registry', () => {
  it('declares all 13 themes', () => {
    expect(ALL_THEME_IDS).toHaveLength(13);
    expect(ALL_THEME_IDS).toEqual(
      expect.arrayContaining([
        'auto', 'light', 'dark', 'dev',
        'christmas', 'halloween', 'birthday', 'new_year', 'tet', 'valentine',
        'cyberpunk', 'pastel', 'monochrome',
      ])
    );
  });

  it('every theme has required color tokens', () => {
    const REQUIRED = ['bg', 'surface', 'surface2', 'surfaceMuted', 'text', 'textSecondary', 'accent', 'border', 'borderStrong'];
    for (const id of ALL_THEME_IDS) {
      const t = APP_THEMES[id];
      for (const key of REQUIRED) {
        expect(t.tokens[key as keyof typeof t.tokens]).toBeTruthy();
      }
    }
  });

  it('free themes unlock with 0 coins', () => {
    expect(isThemeUnlocked('auto', 0)).toBe(true);
    expect(isThemeUnlocked('light', 0)).toBe(true);
    expect(isThemeUnlocked('dark', 0)).toBe(true);
    expect(isThemeUnlocked('dev', 0)).toBe(true);
    expect(isThemeUnlocked('christmas', 0)).toBe(true);
    expect(isThemeUnlocked('halloween', 0)).toBe(true);
    expect(isThemeUnlocked('birthday', 0)).toBe(true);
    expect(isThemeUnlocked('new_year', 0)).toBe(true);
    expect(isThemeUnlocked('tet', 0)).toBe(true);
    expect(isThemeUnlocked('valentine', 0)).toBe(true);
  });

  it('premium themes require enough coins', () => {
    expect(isThemeUnlocked('cyberpunk', 999)).toBe(false);
    expect(isThemeUnlocked('cyberpunk', 1000)).toBe(true);
    expect(isThemeUnlocked('pastel', 299)).toBe(false);
    expect(isThemeUnlocked('pastel', 300)).toBe(true);
    expect(isThemeUnlocked('monochrome', 499)).toBe(false);
    expect(isThemeUnlocked('monochrome', 500)).toBe(true);
  });

  it('groups are organized Core / Seasonal / Premium', () => {
    expect(THEMES_BY_GROUP).toHaveLength(3);
    expect(THEMES_BY_GROUP[0].group).toBe('Core');
    expect(THEMES_BY_GROUP[1].group).toBe('Seasonal');
    expect(THEMES_BY_GROUP[2].group).toBe('Premium');
    expect(THEMES_BY_GROUP[0].themes).toContain('auto');
    expect(THEMES_BY_GROUP[1].themes).toContain('christmas');
    expect(THEMES_BY_GROUP[2].themes).toContain('cyberpunk');
  });

  it('decorations declare particle kind + optional corners', () => {
    expect(APP_THEMES.light.decorations.particles).toBe('none');
    expect(APP_THEMES.dark.decorations.particles).toBe('none');
    expect(APP_THEMES.christmas.decorations.particles).toBe('snowflakes');
    expect(APP_THEMES.halloween.decorations.particles).toBe('ghost');
    expect(APP_THEMES.new_year.decorations.particles).toBe('fireworks');
    expect(APP_THEMES.valentine.decorations.particles).toBe('hearts');
    expect(APP_THEMES.cyberpunk.decorations.particles).toBe('matrix');
    expect(APP_THEMES.christmas.decorations.corners).toEqual([
      '🎅', '🎄', '🎁', '⛄',
    ]);
  });
});

describe('theme meta + resolver', () => {
  it('getThemeMeta returns id/name/icon/price/flags', () => {
    const m = getThemeMeta('cyberpunk');
    expect(m.id).toBe('cyberpunk');
    expect(m.icon).toBe('🤖');
    expect(m.price).toBe(1000);
    expect(m.isPremium).toBe(true);
    expect(m.isSeasonal).toBeUndefined();
  });

  it('resolveThemeId maps auto → light/dark', () => {
    expect(resolveThemeId('auto', 'light')).toBe('light');
    expect(resolveThemeId('auto', 'dark')).toBe('dark');
    expect(resolveThemeId('light', 'dark')).toBe('light');
    expect(resolveThemeId('dark', 'light')).toBe('dark');
    expect(resolveThemeId('christmas', 'light')).toBe('christmas');
  });
});

describe('resolveAppTheme', () => {
  it('auto + light system → light theme', () => {
    const t = resolveAppTheme('auto', 'light');
    expect(t.colors.bg).toBe(lightTheme.colors.bg);
  });

  it('auto + dark system → dark theme', () => {
    const t = resolveAppTheme('auto', 'dark');
    expect(t.colors.bg).toBe(darkTheme.colors.bg);
  });

  it('explicit light overrides dark system', () => {
    const t = resolveAppTheme('light', 'dark');
    expect(t.colors.bg).toBe(lightTheme.colors.bg);
  });

  it('christmas overrides system with seasonal tokens', () => {
    const t = resolveAppTheme('christmas', 'light');
    // Christmas bg = #1E0A0A (đỏ rượu vang)
    expect(t.colors.bg).toBe('#1E0A0A');
    expect(t.colors.accent).toBe('#D42426');
  });

  it('cyberpunk overrides with neon tokens', () => {
    const t = resolveAppTheme('cyberpunk', 'light');
    expect(t.colors.bg).toBe('#0A0014');
    expect(t.colors.accent).toBe('#00FFFF');
  });

  it('invalid theme id falls back to light', () => {
    // @ts-expect-error testing invalid input
    const t = resolveAppTheme('not_a_theme', 'light');
    expect(t.colors.bg).toBe(lightTheme.colors.bg);
  });
});
