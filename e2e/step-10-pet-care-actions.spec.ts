/**
 * Step 10 — Pet Care Actions e2e tests.
 *
 * Verify:
 *  - PET_CARE_EFFECTS has 7 actions
 *  - getCareEffect / applyCareEffect / cooldownRemaining / isActionAvailable
 *    / actionDisabledReason / cooldownLabel all exposed
 *  - cleanliness + health stats in mock pet
 *  - bath/medicine/vitamin stats effects
 *  - medicine precondition (health < 70)
 *  - bath has 8h cooldown
 *  - vitamin has 6h cooldown
 *  - applyCareEffect → cooldownRemaining > 0 immediately
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 10 — Pet Care Actions', () => {
  test('PET_CARE_EFFECTS has 7 actions', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__PET_CARE_EFFECTS_COUNT__;
    });
    expect(count).toBe(7);
  });

  test('PET_CARE_EFFECTS includes bath/medicine/vitamin', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const actions = await page.evaluate(() => {
      const w = window as any;
      return w.__PET_CARE_ACTIONS__ ?? [];
    });
    expect(actions).toContain('bath');
    expect(actions).toContain('medicine');
    expect(actions).toContain('vitamin');
    expect(actions).toContain('feed');
    expect(actions).toContain('play');
    expect(actions).toContain('sleep');
    expect(actions).toContain('pet');
  });

  test('bath has 8h cooldown', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const cd = await page.evaluate(() => {
      const w = window as any;
      return w.__PET_CARE_COOLDOWN_HOURS__('bath');
    });
    expect(cd).toBe(8);
  });

  test('vitamin has 6h cooldown', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const cd = await page.evaluate(() => {
      const w = window as any;
      return w.__PET_CARE_COOLDOWN_HOURS__('vitamin');
    });
    expect(cd).toBe(6);
  });

  test('medicine has 0 cooldown (precondition only)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const cd = await page.evaluate(() => {
      const w = window as any;
      return w.__PET_CARE_COOLDOWN_HOURS__('medicine');
    });
    expect(cd).toBe(0);
  });

  test('isActionAvailable exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const fn = await page.evaluate(() => {
      const w = window as any;
      return typeof w.__PET_CARE_IS_AVAILABLE__;
    });
    expect(fn).toBe('function');
  });

  test('isActionAvailable returns true when healthy enough', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const pet = {
        id: 'p', ownerId: 'o', name: 'n', species: 'cat', mood: 'idle',
        stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1,
                 cleanliness: 50, health: 50 },
        cooldowns: {}, updatedAt: 0, emoji: '🐱',
      };
      return w.__PET_CARE_IS_AVAILABLE__(pet, 'medicine');
    });
    expect(result).toBe(true);
  });

  test('isActionAvailable returns false when health >= 70', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const pet = {
        id: 'p', ownerId: 'o', name: 'n', species: 'cat', mood: 'idle',
        stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1,
                 cleanliness: 50, health: 80 },
        cooldowns: {}, updatedAt: 0, emoji: '🐱',
      };
      return w.__PET_CARE_IS_AVAILABLE__(pet, 'medicine');
    });
    expect(result).toBe(false);
  });

  test('applyCareEffect increases cleanliness by 40', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const pet = {
        id: 'p', ownerId: 'o', name: 'n', species: 'cat', mood: 'idle',
        stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1,
                 cleanliness: 30, health: 80 },
        cooldowns: {}, updatedAt: 0, emoji: '🐱',
      };
      const next = w.__PET_CARE_APPLY__(pet, 'bath');
      return { cleanliness: next.stats.cleanliness, happiness: next.stats.happiness };
    });
    expect(result.cleanliness).toBe(70); // 30 + 40
    expect(result.happiness).toBe(55); // 50 + 5
  });

  test('applyCareEffect applies cooldown timestamp', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const now = Date.now();
      const pet = {
        id: 'p', ownerId: 'o', name: 'n', species: 'cat', mood: 'idle',
        stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1,
                 cleanliness: 50, health: 80 },
        cooldowns: {}, updatedAt: 0, emoji: '🐱',
      };
      const next = w.__PET_CARE_APPLY__(pet, 'bath');
      return {
        cd: next.cooldowns?.bath,
        remaining: w.__PET_CARE_COOLDOWN_REMAINING__(next, 'bath', now + 1000),
      };
    });
    expect(result.cd).toBeGreaterThan(0);
    // remaining should be very close to 8h - 1s ≈ 28_799_000
    expect(result.remaining).toBeGreaterThan(28_790_000);
    expect(result.remaining).toBeLessThanOrEqual(8 * 60 * 60 * 1000);
  });

  test('cooldownRemaining returns 0 for actions without cooldown', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const pet = {
        id: 'p', ownerId: 'o', name: 'n', species: 'cat', mood: 'idle',
        stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1,
                 cleanliness: 50, health: 80 },
        cooldowns: {}, updatedAt: 0, emoji: '🐱',
      };
      return w.__PET_CARE_COOLDOWN_REMAINING__(pet, 'feed');
    });
    expect(result).toBe(0);
  });

  test('cooldownLabel formats correctly', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const fn = await page.evaluate(() => {
      const w = window as any;
      return {
        s: w.__PET_CARE_COOLDOWN_LABEL__(5000),
        m: w.__PET_CARE_COOLDOWN_LABEL__(60_000),
        h: w.__PET_CARE_COOLDOWN_LABEL__(2 * 60 * 60_000),
        empty: w.__PET_CARE_COOLDOWN_LABEL__(0),
      };
    });
    expect(fn.s).toBe('5s');
    expect(fn.m).toBe('1m');
    expect(fn.h).toBe('2h');
    expect(fn.empty).toBe('');
  });
});
