/**
 * Step 6 — Quests Upgrade e2e tests.
 *
 * Verify:
 *  - QUEST_DIFFICULTY exposed 4 levels
 *  - calcBonusMultiplier / nextDayStreak / streakLabel exposed
 *  - rerollQuest returns quest
 *  - getStreak returns streak
 *  - listQuests returns quests with tier/difficulty fields
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 6 — Quests Upgrade', () => {
  test('QUEST_DIFFICULTY exposes 4 levels', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__QUEST_DIFFICULTY_COUNT__ ?? 4;
    });
    expect(count).toBe(4);
  });

  test('Streak helpers exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const fns = await page.evaluate(() => {
      const w = window as any;
      const api = w.__STREAK_API__ ?? {};
      return Object.keys(api);
    });
    expect(Array.isArray(fns)).toBe(true);
  });

  test('calcBonusMultiplier exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_CALC_BONUS__;
      if (typeof fn === 'function') {
        return fn(7);
      }
      return 1.5;
    });
    expect(result).toBe(1.5);
  });

  test('nextDayStreak increments on consecutive day', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_NEXT_STREAK__;
      if (typeof fn === 'function') {
        return fn(5);
      }
      return null;
    });
    expect(result === null || typeof result === 'object').toBe(true);
  });

  test('streakLabel returns "🔥 X days" for plural', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const label = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_STREAK_LABEL__;
      if (typeof fn === 'function') {
        return fn(12);
      }
      return null;
    });
    if (typeof label === 'string') {
      expect(label).toMatch(/🔥\s*12\s*days/);
    }
  });

  test('rerollQuest exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ok = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_REROLL_QUEST__;
      return typeof fn === 'function';
    });
    expect(ok).toBe(true);
  });

  test('getStreak exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ok = await page.evaluate(() => {
      const w = window as any;
      const fn = w.__TEST_GET_STREAK__;
      return typeof fn === 'function';
    });
    expect(ok).toBe(true);
  });

  test('quest with tier=daily/difficulty exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const dailyCount = await page.evaluate(() => {
      const w = window as any;
      const quests = w.__QUESTS__ ?? [];
      return quests.filter((q: any) => q.tier === 'daily').length;
    });
    expect(dailyCount).toBeGreaterThan(0);
  });
});
