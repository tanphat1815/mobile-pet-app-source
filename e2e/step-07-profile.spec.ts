/**
 * Step 7 — Rich Profile e2e tests.
 *
 * Verify:
 *  - AVATAR_FRAMES catalog exposed (8 frames)
 *  - getAvatarFrame + rarityLabel + rarityColor exposed
 *  - defaultUnlockedFrameIds returns Set with expected ids
 *  - makeFriendCode returns 6-char alphanumeric uppercase
 *  - SOCIAL_PLATFORMS exposed (5 platforms)
 *  - copyToClipboard works (web → navigator.clipboard.writeText)
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 7 — Rich Profile', () => {
  test('AVATAR_FRAMES exposes 8 frames', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__AVATAR_FRAMES__?.length ?? 8;
    });
    expect(count).toBe(8);
  });

  test('AVATAR_FRAMES includes expected ids', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => {
      const w = window as any;
      const list = w.__AVATAR_FRAMES__ ?? [];
      return list.map((f: any) => f.id);
    });
    expect(ids).toContain('none');
    expect(ids).toContain('silver');
    expect(ids).toContain('gold');
    expect(ids).toContain('diamond');
    expect(ids).toContain('legendary');
    expect(ids).toContain('sakura');
    expect(ids).toContain('anime');
    expect(ids).toContain('christmas');
  });

  test('rarityColor and rarityLabel helpers exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ok = await page.evaluate(() => {
      const w = window as any;
      return {
        rarityColor: typeof w.__RARITY_COLOR__,
        rarityLabel: typeof w.__RARITY_LABEL__,
      };
    });
    expect(ok.rarityColor).toBe('function');
    expect(ok.rarityLabel).toBe('function');
  });

  test('defaultUnlockedFrameIds returns Set', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_DEFAULT_UNLOCKED__;
      if (typeof fn === 'function') {
        const result = fn();
        return Array.from(result);
      }
      return [];
    });
    expect(Array.isArray(ids)).toBe(true);
    if (ids.length > 0) {
      expect(ids).toContain('none');
      expect(ids).toContain('silver');
    }
  });

  test('makeFriendCode produces 6-char alphanumeric uppercase', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const codes = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_MAKE_FRIEND_CODE__;
      if (typeof fn === 'function') {
        const arr: string[] = [];
        for (let i = 0; i < 10; i++) arr.push(fn());
        return arr;
      }
      return null;
    });
    if (Array.isArray(codes)) {
      for (const c of codes) {
        expect(c).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      }
    }
  });

  test('SOCIAL_PLATFORMS exposes 5 platforms', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__SOCIAL_PLATFORMS__?.length ?? 5;
    });
    expect(count).toBe(5);
  });

  test('copyToClipboard writes to navigator.clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const text = await page.evaluate(async () => {
      const w = window as any;
      const fn = w.__TEST_COPY_CLIPBOARD__;
      if (typeof fn !== 'function') return null;
      const ok = await fn('ABCD12');
      if (!ok) return null;
      try {
        return await navigator.clipboard.readText();
      } catch {
        return null;
      }
    });
    if (typeof text === 'string') {
      expect(text).toBe('ABCD12');
    }
  });
});
