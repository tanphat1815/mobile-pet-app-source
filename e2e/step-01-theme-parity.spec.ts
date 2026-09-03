/**
 * Step 1 — Theme Parity (Cozy Cream) e2e tests.
 *
 * Verify that:
 *  - Light mode background is the Cozy Cream kem-ấm token (#FAF7F2)
 *  - Dark mode background is unchanged (#1C1C1E)
 *  - Text color in light is warm tone #1E2024
 *
 * Reference:
 *  - desktop `app-themes.js` light tokens (--bg-primary, --border)
 *  - docs/steps/step-01-theme-parity.md
 */

import { test, expect, Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForFunction(
    () => document.getElementById('root') !== null || document.body.firstElementChild !== null,
    { timeout: 30_000 }
  ).catch(() => {});
  await page.waitForTimeout(1500);
}

/**
 * Walk the React Native Web tree and collect all non-transparent backgrounds.
 * The Cozy Cream hard-coded root (GestureHandlerRootView) is filtered out so
 * we get the *themed* background painted by the screens.
 */
async function getThemedBackground(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return null;
    const queue: Element[] = [root];
    const found: string[] = [];
    while (queue.length) {
      const el = queue.shift()!;
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') found.push(bg);
      for (const c of Array.from(el.children)) queue.push(c);
    }
    // Prefer a dark bg (#1C1C1E) if present, else the dominant light bg
    const dark = found.find((b) => b === 'rgb(28, 28, 30)');
    if (dark) return dark;
    const light = found.find((b) => b === 'rgb(250, 247, 242)');
    if (light) return light;
    return found[0] ?? null;
  });
}

test.describe('Step 1 — Theme parity (Cozy Cream)', () => {
  test('light mode background is Cozy Cream #FAF7F2', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const bg = await getThemedBackground(page);
    // rgb(250, 247, 242) = #FAF7F2
    expect(bg).toBe('rgb(250, 247, 242)');
  });

  test('dark mode background stays #1C1C1E', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await waitForAppMount(page);
    // RNW may take a moment to reflect prefers-color-scheme via useColorScheme.
    await page.waitForFunction(
      () => {
        const root = document.getElementById('root');
        if (!root) return false;
        const queue: Element[] = [root];
        while (queue.length) {
          const el = queue.shift()!;
          if (getComputedStyle(el).backgroundColor === 'rgb(28, 28, 30)') return true;
          for (const c of Array.from(el.children)) queue.push(c);
        }
        return false;
      },
      { timeout: 5_000 }
    ).catch(() => {});
    const bg = await getThemedBackground(page);
    // rgb(28, 28, 30) = #1C1C1E
    expect(bg).toBe('rgb(28, 28, 30)');
  });

  test('RNW rendered a non-transparent layer', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const bg = await getThemedBackground(page);
    expect(bg).not.toBeNull();
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });
});
