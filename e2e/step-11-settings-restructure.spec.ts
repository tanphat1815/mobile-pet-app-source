/**
 * Step 11 — Settings Restructure e2e tests.
 *
 * Verify:
 *  - SETTINGS_GROUPS has 4 expected groups
 *  - filterRows('theme') returns matching rows
 *  - filterRows('premium') returns rows via keywords
 *  - filterRows('') returns full tree
 *  - matchCount reflects filter result
 *  - DEFAULT_EXPANDED_GROUPS.GENERAL = true
 *  - GROUP_ORDER has 4 groups in expected order
 *  - every row in the tree has icon + label
 *  - buildSearchIndex exposed
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 11 — Settings Restructure', () => {
  test('SETTINGS_GROUPS has 4 groups', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_GROUP_COUNT__;
    });
    expect(count).toBe(4);
  });

  test('SETTINGS_GROUPS has expected group IDs', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_GROUP_IDS__ ?? [];
    });
    expect(ids).toContain('GENERAL');
    expect(ids).toContain('PET');
    expect(ids).toContain('SOCIAL');
    expect(ids).toContain('ADVANCED');
  });

  test('filterRows returns matching rows for "theme"', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => {
      const w = window as any;
      const result = w.__SETTINGS_FILTER__('theme');
      const out: string[] = [];
      for (const g of result) for (const s of g.sections) for (const r of s.rows) out.push(r.id);
      return out;
    });
    expect(ids).toContain('appearance-theme');
    expect(ids).toContain('appearance-app-theme');
  });

  test('filterRows returns rows via keywords', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => {
      const w = window as any;
      const result = w.__SETTINGS_FILTER__('premium');
      const out: string[] = [];
      for (const g of result) for (const s of g.sections) for (const r of s.rows) out.push(r.id);
      return out;
    });
    expect(ids).toContain('appearance-app-theme');
  });

  test('filterRows returns full tree on empty query', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_FILTER__('').length;
    });
    expect(count).toBe(4);
  });

  test('filterRows returns empty for non-matching query', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_FILTER__('xyz-no-match-1234').length;
    });
    expect(count).toBe(0);
  });

  test('matchCount reflects filter result', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const counts = await page.evaluate(() => {
      const w = window as any;
      return {
        total: w.__SETTINGS_MATCH_COUNT__(''),
        theme: w.__SETTINGS_MATCH_COUNT__('theme'),
      };
    });
    expect(counts.total).toBeGreaterThan(counts.theme);
    expect(counts.theme).toBeGreaterThan(0);
  });

  test('DEFAULT_EXPANDED_GROUPS has GENERAL = true', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const expected = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_DEFAULT_EXPANDED__;
    });
    expect(expected.GENERAL).toBe(true);
    expect(expected.PET).toBe(false);
    expect(expected.SOCIAL).toBe(false);
    expect(expected.ADVANCED).toBe(false);
  });

  test('GROUP_ORDER has 4 group ids in expected order', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const order = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_GROUP_ORDER__;
    });
    expect(order).toEqual(['GENERAL', 'PET', 'SOCIAL', 'ADVANCED']);
  });

  test('every row in tree has icon and label', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ok = await page.evaluate(() => {
      const w = window as any;
      const groups = w.__SETTINGS_GROUPS__;
      for (const g of groups) {
        for (const s of g.sections) {
          for (const r of s.rows) {
            if (!r.icon || !r.label) return false;
          }
        }
      }
      return true;
    });
    expect(ok).toBe(true);
  });

  test('buildSearchIndex returns non-empty map', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const size = await page.evaluate(() => {
      const w = window as any;
      return w.__SETTINGS_SEARCH_INDEX_SIZE__;
    });
    expect(size).toBeGreaterThan(0);
  });
});
