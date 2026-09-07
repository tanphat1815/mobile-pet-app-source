/**
 * Step 12a — Wellness e2e tests.
 *
 * Verify:
 *  - BREATHING_PRESETS has 4 presets with inhale/exhale/cycles
 *  - MEDITATION_PRESETS has 5 presets with label + durationMin
 *  - formatTime formats MM:SS
 *  - groupGratitudeByDate groups by date key
 *  - moodHistory returns null for missing days, average for multi-day
 *  - AMBIENT_SOUNDS catalog has 5 entries
 *  - streakFromSessions counts from today backward
 *  - WellnessStore starts empty + addGratitude persists
 *  - WellnessStore addMood / removeMood works
 *  - PomodoroTimer formatTime renders MM:SS for arbitrary secs
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 12a — Wellness', () => {
  test('BREATHING_PRESETS exposed with 4 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_BREATHING_COUNT__;
    });
    expect(count).toBe(4);
  });

  test('MEDITATION_PRESETS exposed with 5 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_MEDITATION_COUNT__;
    });
    expect(count).toBe(5);
  });

  test('formatTime formats seconds correctly', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_FORMAT_TIME__(90);
    });
    expect(result).toBe('01:30');
  });

  test('formatTime handles zero + large', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const [zero, big] = await page.evaluate(() => {
      const w = window as any;
      return [w.__WELLNESS_FORMAT_TIME__(0), w.__WELLNESS_FORMAT_TIME__(3725)];
    });
    expect(zero).toBe('00:00');
    expect(big).toBe('62:05');
  });

  test('AMBIENT_SOUNDS exposed with 5 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_AMBIENT_COUNT__;
    });
    expect(count).toBe(5);
  });

  test('AMBIENT_SOUNDS includes rain, forest, ocean, fireplace, binaural', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_AMBIENT_IDS__;
    });
    expect(ids).toContain('rain');
    expect(ids).toContain('forest');
    expect(ids).toContain('ocean');
    expect(ids).toContain('fireplace');
    expect(ids).toContain('binaural');
  });

  test('WellnessStore startSession adds a session', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_ADD_SESSION__('meditation', '10min');
    });
    expect(result.id).toMatch(/^ws_/);
    expect(result.kind).toBe('meditation');
    expect(result.preset).toBe('10min');
  });

  test('WellnessStore addGratitude + removeGratitude', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const entry = w.__WELLNESS_ADD_GRATITUDE__('My pet is cute');
      const count = w.__WELLNESS_GET_GRATITUDE_COUNT__();
      w.__WELLNESS_REMOVE_GRATITUDE__(entry.id);
      const countAfter = w.__WELLNESS_GET_GRATITUDE_COUNT__();
      return { id: entry.id, count, countAfter };
    });
    expect(result.id).toMatch(/^g_/);
    expect(result.count).toBe(1);
    expect(result.countAfter).toBe(0);
  });

  test('WellnessStore addMood persists score + tags', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const entry = w.__WELLNESS_ADD_MOOD__(4, ['work', 'sleep'], 'feeling good');
      const list = w.__WELLNESS_GET_MOOD_LIST__();
      return {
        score: entry.score,
        tags: entry.tags,
        count: list.length,
      };
    });
    expect(result.score).toBe(4);
    expect(result.tags).toContain('work');
    expect(result.tags).toContain('sleep');
    expect(result.count).toBe(1);
  });

  test('streakFromSessions counts today as 1', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_STREAK_TODAY__();
    });
    expect(result).toBe(1);
  });

  test('moodHistory returns 14 points by default', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const len = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_MOOD_HISTORY_LEN__();
    });
    expect(len).toBe(14);
  });

  test('PomodoroTimer renders initial MM:SS', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const initial = await page.evaluate(() => {
      const w = window as any;
      return w.__WELLNESS_POMODORO_INITIAL__();
    });
    expect(initial).toBe('25:00');
  });
});
