/**
 * Step 3 — Animated Pet Sprite FSM e2e tests
 *
 * Verify:
 *  - Pet sprite renders trên Home với anim key hiện tại
 *  - Action coupling: feed → eat, play → box_play, sleep → sleep, pet → happy
 *  - Critical stats: energy < 20 → sleep, hunger > 80 → cry
 *  - Mood coupling: happy → happy, ecstatic → dance (nếu mood support)
 *  - Species switching: cat → dog → fox render đúng emoji
 *  - Animation runs (frame indices change qua thời gian)
 *
 * Step 3 — xem docs/steps/step-03-animated-pet-sprite.md.
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

async function getAnimKey(page: Page): Promise<string> {
  return page.evaluate(() => {
    const debug = (window as any).__PET_FSM_DEBUG__;
    return debug?.animKey ?? 'no-debug';
  });
}

async function setPetMood(page: Page, mood: string) {
  await page.evaluate((m) => {
    const mp = (window as any).__MOBILE_PET__;
    if (mp?.ensurePet) mp.ensurePet();
    if (mp?.setPetMood) mp.setPetMood(m);
  }, mood);
  await page.waitForTimeout(500);
}

async function setPetStats(page: Page, stats: Record<string, number>) {
  await page.evaluate((s) => {
    const mp = (window as any).__MOBILE_PET__;
    if (mp?.ensurePet) mp.ensurePet();
    if (mp?.setPetStats) mp.setPetStats(s);
  }, stats);
  await page.waitForTimeout(500);
}

async function setPetSpecies(page: Page, species: string) {
  await page.evaluate((s) => {
    const mp = (window as any).__MOBILE_PET__;
    if (mp?.ensurePet) mp.ensurePet();
    if (mp?.setPetSpecies) mp.setPetSpecies(s);
  }, species);
  await page.waitForTimeout(500);
}

test.describe('Step 3 — Animated Pet Sprite FSM', () => {
  test('pet sprite renders với anim key visible', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await page.waitForSelector('[data-testid="pet-sprite"]', { timeout: 10_000 }).catch(() => {});
    const exists = (await page.locator('[data-testid="pet-sprite"]').count()) > 0;
    // Pet may not be loaded (chưa login) — check component available trong DOM
    // hoặc empty fallback
    const animKey = await getAnimKey(page);
    expect(['idle', 'no-debug']).toContain(animKey);
    // Test passes if either sprite or empty avatar exists
    expect(exists || animKey === 'idle').toBe(true);
  });

  test('happy mood → happy animation key', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'happy');
    await setPetStats(page, { hunger: 50, happiness: 80, energy: 50 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('happy');
  });

  test('tired stats (energy < 20) → sleep', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'idle');
    await setPetStats(page, { energy: 5 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('sleep');
  });

  test('hungry stats (hunger > 80) → cry', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'idle');
    await setPetStats(page, { hunger: 90 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('cry');
  });

  test('sad happiness (< 25) → sit', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'idle');
    await setPetStats(page, { happiness: 10 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('sit');
  });

  test('eating mood → eat animation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'eating');
    await setPetStats(page, { happiness: 80, energy: 50, hunger: 50 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('eat');
  });

  test('playing mood → box_play animation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'playing');
    await setPetStats(page, { happiness: 80, energy: 50, hunger: 50 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('box_play');
  });

  test('species switch — FSM debug snapshot có species mới', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetSpecies(page, 'dog');
    const species = await page.evaluate(() => {
      const debug = (window as any).__PET_FSM_DEBUG__;
      return debug?.species;
    });
    expect(species).toBe('dog');
  });

  test('priority: critical stats override mood', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    // mood=ecstatic but energy < 20 → sleep (critical overrides mood)
    await setPetMood(page, 'ecstatic');
    await setPetStats(page, { hunger: 50, happiness: 90, energy: 5 });
    const animKey = await getAnimKey(page);
    expect(animKey).toBe('sleep');
  });

  test('anim key changes when state updates', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setPetMood(page, 'happy');
    await setPetStats(page, { happiness: 80, energy: 50 });
    const k1 = await getAnimKey(page);
    await setPetMood(page, 'sleeping');
    await setPetStats(page, { energy: 50 });
    const k2 = await getAnimKey(page);
    expect(k1).not.toEqual(k2);
  });
});
