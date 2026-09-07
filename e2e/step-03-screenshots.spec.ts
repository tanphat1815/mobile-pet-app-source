/**
 * Visual snapshots — pet sprite ở các state khác nhau.
 */
import { test, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForTimeout(2500);
}

async function setupPet(page: Page, mood: string, stats: Record<string, number>, species = 'cat') {
  await page.evaluate(
    ({ m, s, sp }) => {
      const mp = (window as any).__MOBILE_PET__;
      if (mp?.ensurePet) mp.ensurePet();
      if (mp?.setPetSpecies) mp.setPetSpecies(sp);
      if (mp?.setPetMood) mp.setPetMood(m);
      if (mp?.setPetStats) mp.setPetStats(s);
    },
    { m: mood, s: stats, sp: species }
  );
  await page.waitForTimeout(800);
}

const STATES: Array<{ id: string; mood: string; stats: Record<string, number> }> = [
  { id: 'idle',       mood: 'idle',      stats: { hunger: 50, happiness: 50, energy: 50 } },
  { id: 'happy',      mood: 'happy',     stats: { hunger: 50, happiness: 80, energy: 50 } },
  { id: 'sad',        mood: 'sad',       stats: { hunger: 50, happiness: 30, energy: 50 } },
  { id: 'sleeping',   mood: 'sleeping',  stats: { hunger: 50, happiness: 50, energy: 80 } },
  { id: 'eating',     mood: 'eating',    stats: { hunger: 80, happiness: 70, energy: 50 } },
  { id: 'playing',    mood: 'playing',   stats: { hunger: 50, happiness: 80, energy: 60 } },
  { id: 'tired',      mood: 'idle',      stats: { hunger: 50, happiness: 50, energy: 5 } },
  { id: 'hungry',     mood: 'idle',      stats: { hunger: 95, happiness: 50, energy: 50 } },
];

for (const state of STATES) {
  test(`sprite — ${state.id}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setupPet(page, state.mood, state.stats);
    await page.screenshot({ path: `test-results/step-03-sprite-${state.id}.png` });
  });
}

const SPECIES = ['cat', 'dog', 'fox', 'dragon', 'rabbit', 'blob'];
for (const species of SPECIES) {
  test(`sprite — species ${species}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setupPet(page, 'happy', { hunger: 50, happiness: 80, energy: 50 }, species);
    await page.screenshot({ path: `test-results/step-03-species-${species}.png` });
  });
}
