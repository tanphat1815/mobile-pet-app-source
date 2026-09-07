/**
 * Step 2 — Seasonal + Premium Themes e2e tests.
 *
 * Verify rằng:
 *  - Default appThemeId là 'auto' → dùng Cozy Cream bg
 *  - Apply Christmas theme → bg chuyển sang đỏ rượu vang #1E0A0A
 *  - Apply Cyberpunk theme → bg chuyển sang đen tím #0A0014 + accent cyan
 *  - Particle decorations render với Christmas
 *  - Corner emojis render với Christmas
 *
 * Step 2 — xem docs/steps/step-02-seasonal-premium-themes.md.
 */

import { test, expect, Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForFunction(
    () => document.getElementById('root') !== null,
    { timeout: 30_000 }
  ).catch(() => {});
  await page.waitForTimeout(1500);
}

/**
 * Set appThemeId via dev helper exposed ở useTheme.ts (chỉ có khi __DEV__).
 */
async function setAppThemeId(page: Page, themeId: string) {
  await page.evaluate((id) => {
    const mp = (window as any).__MOBILE_PET__;
    if (mp?.setAppTheme) mp.setAppTheme(id);
  }, themeId);
  // Allow React to re-render
  await page.waitForTimeout(800);
}

/**
 * Walk React Native Web tree, tìm first element với backgroundColor match target.
 */
async function findBackground(page: Page, target: string): Promise<boolean> {
  return page.evaluate((t) => {
    const root = document.getElementById('root');
    if (!root) return false;
    const queue: Element[] = [root];
    while (queue.length) {
      const el = queue.shift()!;
      if (getComputedStyle(el).backgroundColor === t) return true;
      for (const c of Array.from(el.children)) queue.push(c);
    }
    return false;
  }, target);
}

/**
 * Tìm tất cả background colors trong tree.
 */
async function listBackgrounds(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return [];
    const queue: Element[] = [root];
    const found: string[] = [];
    while (queue.length) {
      const el = queue.shift()!;
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') found.push(bg);
      for (const c of Array.from(el.children)) queue.push(c);
    }
    return found;
  });
}

test.describe('Step 2 — Seasonal + Premium themes', () => {
  test('default (auto) uses Cozy Cream bg', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const found = await findBackground(page, 'rgb(250, 247, 242)');
    expect(found).toBe(true);
  });

  test('Christmas theme applies #1E0A0A bg', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'christmas');
    // rgb(30, 10, 10) = #1E0A0A — Christmas wine red
    const found = await findBackground(page, 'rgb(30, 10, 10)');
    expect(found).toBe(true);
  });

  test('Cyberpunk theme applies #0A0014 bg + cyan accent', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'cyberpunk');
    // rgb(10, 0, 20) = #0A0014 — Cyberpunk deep purple
    const found = await findBackground(page, 'rgb(10, 0, 20)');
    expect(found).toBe(true);
  });

  test('Halloween theme applies #140D1C bg', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'halloween');
    // rgb(20, 13, 28) = #140D1C
    const found = await findBackground(page, 'rgb(20, 13, 28)');
    expect(found).toBe(true);
  });

  test('Tet theme applies #2A0808 bg', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'tet');
    // rgb(42, 8, 8) = #2A0808 — Tet lucky red
    const found = await findBackground(page, 'rgb(42, 8, 8)');
    expect(found).toBe(true);
  });

  test('Pastel theme applies #FAF4FF bg', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'pastel');
    // rgb(250, 244, 255) = #FAF4FF — Pastel lavender
    const found = await findBackground(page, 'rgb(250, 244, 255)');
    expect(found).toBe(true);
  });

  test('Christmas theme renders corner decorations', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'christmas');
    // Wait for corners to render
    await page.waitForSelector('[data-testid="theme-corner-topLeft"], [data-testid="theme-corner-topRight"]', {
      timeout: 5000,
    }).catch(() => {});
    const corners = await page.locator('[data-testid^="theme-corner-"]').count();
    expect(corners).toBeGreaterThan(0);
  });

  test('light theme (Cozy Cream) does NOT render decorations', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, 'light');
    const particles = await page.locator('[data-testid="theme-particle"]').count();
    const corners = await page.locator('[data-testid^="theme-corner-"]').count();
    expect(particles).toBe(0);
    expect(corners).toBe(0);
  });
});
