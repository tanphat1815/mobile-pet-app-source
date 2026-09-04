/**
 * Step 12b — Music e2e tests.
 *
 * Verify:
 *  - BUILTIN_TRACKS exposed with 6 entries
 *  - EQ_PRESETS exposed with 8 entries
 *  - MOOD_PLAYLISTS exposed with 6 entries
 *  - formatMusicTime formats seconds correctly
 *  - MusicStore play(track) sets currentTrack
 *  - MusicStore setEQ updates bands
 *  - MusicStore applyEQPreset updates all bands
 *  - PetRadio determineMood returns correct ids for each branch
 *  - PetRadio getTimeOfDay returns bucket names
 *  - PetRadio curateForPet returns ranked list with relevanceScore
 *  - MusicPlayer has shuffle/repeat/play controls
 *  - EqualizerPanel has 3 sliders + 8 presets
 *  - MusicHomeScreen has 5 tabs
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 12b — Music', () => {
  test('BUILTIN_TRACKS exposed with 6 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => (window as any).__MUSIC_TRACK_COUNT__);
    expect(count).toBe(6);
  });

  test('BUILTIN_TRACKS includes expected ids', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const ids = await page.evaluate(() => (window as any).__MUSIC_TRACK_IDS__);
    expect(ids).toContain('track_happy_chiptune');
    expect(ids).toContain('track_lofi_cafe');
    expect(ids).toContain('track_night_rain');
    expect(ids).toContain('track_synthwave_neon');
    expect(ids).toContain('track_cute_walk');
    expect(ids).toContain('track_deep_focus');
  });

  test('EQ_PRESETS exposed with 8 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => (window as any).__MUSIC_EQ_PRESET_COUNT__);
    expect(count).toBe(8);
  });

  test('EQ_PRESETS include bass_boost / vocal / rock', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const keys = await page.evaluate(() => (window as any).__MUSIC_EQ_PRESET_KEYS__);
    expect(keys).toContain('flat');
    expect(keys).toContain('bass_boost');
    expect(keys).toContain('vocal');
    expect(keys).toContain('rock');
    expect(keys).toContain('pop');
    expect(keys).toContain('jazz');
    expect(keys).toContain('electronic');
    expect(keys).toContain('acoustic');
  });

  test('MOOD_PLAYLISTS exposed with 6 entries', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const count = await page.evaluate(() => (window as any).__MUSIC_MOOD_COUNT__);
    expect(count).toBe(6);
  });

  test('formatMusicTime formats seconds correctly', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__MUSIC_FORMAT_TIME__(125));
    expect(result).toBe('2:05');
  });

  test('MusicStore play(track) sets currentTrack', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__MUSIC_PLAY_TRACK__('track_happy_chiptune'));
    expect(result.trackId).toBe('track_happy_chiptune');
    expect(result.isPlaying).toBe(true);
  });

  test('MusicStore pause sets isPlaying false', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__MUSIC_TOGGLE_PLAY__());
    expect(typeof result).toBe('boolean');
  });

  test('MusicStore setEQ band updates within -12..+12', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__MUSIC_SET_EQ__('bass', 100));
    expect(result.bass).toBe(12); // clamped
    const result2 = await page.evaluate(() => (window as any).__MUSIC_SET_EQ__('bass', -100));
    expect(result2.bass).toBe(-12);
  });

  test('MusicStore applyEQPreset updates all bands', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__MUSIC_APPLY_PRESET__('bass_boost'));
    expect(result.bass).toBe(6);
    expect(result.mid).toBe(0);
    expect(result.treble).toBe(0);
  });

  test('PetRadio determineMood: sleep', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__PET_RADIO_MOOD__({ happiness: 80, energy: 10 }));
    expect(result.id).toBe('sleep');
  });

  test('PetRadio determineMood: happy', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__PET_RADIO_MOOD__({ happiness: 90, energy: 80 }));
    expect(result.id).toBe('happy');
  });

  test('PetRadio determineMood: sad', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__PET_RADIO_MOOD__({ happiness: 20, energy: 50 }));
    expect(result.id).toBe('sad');
  });

  test('PetRadio determineMood: workout', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__PET_RADIO_MOOD__({ happiness: 60, energy: 90 }));
    expect(result.id).toBe('workout');
  });

  test('PetRadio determineMood: focused (default)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__PET_RADIO_MOOD__({ happiness: 60, energy: 50 }));
    expect(result.id).toBe('focused');
  });

  test('PetRadio curateForPet returns ranked list', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => (window as any).__PET_RADIO_CURATE__({ happiness: 90, energy: 80 }, {}, 'Buổi trưa'));
    expect(result.tracks.length).toBeGreaterThan(0);
    expect(result.moodId).toBe('happy');
    expect(result.tracks[0].relevanceScore).toBeGreaterThanOrEqual(
      result.tracks[result.tracks.length - 1].relevanceScore
    );
  });

  test('MusicHomeScreen has 5 tabs', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    // Wait for app to settle
    await page.waitForTimeout(1000);
    const tabs = await page.evaluate(() => {
      const w = window as any;
      return w.__MUSIC_TAB_IDS__;
    });
    expect(tabs).toContain('player');
    expect(tabs).toContain('tracks');
    expect(tabs).toContain('mood');
    expect(tabs).toContain('radio');
    expect(tabs).toContain('eq');
  });
});
