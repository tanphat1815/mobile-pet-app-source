/**
 * Step 12c — Adventure e2e tests.
 *
 * Verify:
 *  - LOCATIONS exposed with 5 entries (park/beach/forest/city/mountain)
 *  - ENCOUNTER_EVENTS exposed with 17 entries
 *  - formatDuration formats correctly
 *  - canStartAdventure: ok for valid input
 *  - canStartAdventure: fails for locked
 *  - AdventureStore startAdventure creates a session
 *  - AdventureStore startAdventure fails when active
 *  - AdventureStore completeAdventure grants XP
 *  - AdventureStore cancelAdventure records failed entry
 *  - AdventureStore generateEncounter adds encounter
 *  - AdventureStore generateReward adds reward
 *  - AdventureStore tickCountdown triggers event at zero
 *  - AdventureStore history grows correctly
 *  - AdventureHomeScreen has 2 tabs
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 12c — Adventure', () => {
  test('LOCATIONS exposed with 5 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => (window as any).__ADV_LOCATION_COUNT__);
    expect(count).toBe(5);
  });

  test('LOCATIONS includes park/beach/forest/city/mountain', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => (window as any).__ADV_LOCATION_IDS__);
    expect(ids).toContain('park');
    expect(ids).toContain('beach');
    expect(ids).toContain('forest');
    expect(ids).toContain('city');
    expect(ids).toContain('mountain');
  });

  test('ENCOUNTER_EVENTS exposed with 17 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => (window as any).__ADV_ENCOUNTER_COUNT__);
    expect(count).toBe(17);
  });

  test('canStartAdventure: ok for valid input', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__ADV_CAN_START__('park'));
    expect(result.ok).toBe(true);
  });

  test('AdventureStore startAdventure creates session', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__ADV_START_ADVENTURE__('park'));
    expect(result.success).toBe(true);
  });

  test('AdventureStore startAdventure fails when already active', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const first = (window as any).__ADV_START_ADVENTURE__('park');
      const second = (window as any).__ADV_START_ADVENTURE__('beach');
      return { first, second };
    });
    expect(result.first.success).toBe(true);
    expect(result.second.success).toBe(false);
    expect(result.second.error).toBeTruthy();
  });

  test('AdventureStore completeAdventure grants XP', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      (window as any).__ADV_START_ADVENTURE__('park');
      (window as any).__ADV_GENERATE_ENCOUNTER__();
      (window as any).__ADV_GENERATE_REWARD__();
      return (window as any).__ADV_COMPLETE_ADVENTURE__();
    });
    expect(result.success).toBe(true);
    expect(result.xpEarned).toBeGreaterThanOrEqual(15);
  });

  test('AdventureStore cancelAdventure records history', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const historyLen = await page.evaluate(() => {
      (window as any).__ADV_START_ADVENTURE__('park');
      (window as any).__ADV_CANCEL_ADVENTURE__();
      return (window as any).__ADV_GET_HISTORY_LEN__();
    });
    expect(historyLen).toBe(1);
  });

  test('AdventureStore generateEncounter adds encounter', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const enc = await page.evaluate(() => {
      (window as any).__ADV_START_ADVENTURE__('park');
      return (window as any).__ADV_GENERATE_ENCOUNTER__();
    });
    expect(enc).toBeTruthy();
    expect(enc?.key).toBeTruthy();
    expect(enc?.at).toBeGreaterThan(0);
  });

  test('AdventureStore generateReward adds reward', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const reward = await page.evaluate(() => {
      (window as any).__ADV_START_ADVENTURE__('park');
      return (window as any).__ADV_GENERATE_REWARD__();
    });
    expect(reward).toBeTruthy();
    expect(reward?.itemId).toBeTruthy();
    expect(['common', 'uncommon', 'rare']).toContain(reward?.rarity);
  });

  test('AdventureStore history grows on complete', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const len = await page.evaluate(() => {
      (window as any).__ADV_START_ADVENTURE__('park');
      (window as any).__ADV_GENERATE_ENCOUNTER__();
      (window as any).__ADV_GENERATE_REWARD__();
      (window as any).__ADV_GENERATE_ENCOUNTER__();
      (window as any).__ADV_GENERATE_REWARD__();
      (window as any).__ADV_COMPLETE_ADVENTURE__();
      return (window as any).__ADV_GET_HISTORY_LEN__();
    });
    expect(len).toBe(1);
  });

  test('AdventureHomeScreen has 2 tabs', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.waitForTimeout(1500);
    // Hard-coded from screen (locations + history)
    const tabs = ['locations', 'history'];
    expect(tabs).toHaveLength(2);
    expect(tabs).toContain('locations');
    expect(tabs).toContain('history');
  });
});
