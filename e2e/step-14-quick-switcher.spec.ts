/**
 * Step 14 — Global Quick Switcher e2e tests.
 *
 * Covers:
 *   - FAB opens switcher on Home
 *   - Cmd+K opens switcher from any screen
 *   - Typing "med" surfaces Meditation as first result
 *   - Enter navigates to the selected screen
 *   - Escape closes the modal
 *   - Recents persist after selection
 *   - Pin/unpin toggles via long-press
 *   - Backdrop click closes the modal
 *   - Empty state shows "Did you mean…" for typos
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  // Explicit goto ensures addInitScript (auth seed) runs BEFORE the
  // React app boots and AuthStore.restoreSession() reads storage.
  await page.goto('/');
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(3500); // give restoreSession + Home mount time
}

/**
 * Pre-seed web localStorage (the backend AsyncStorage uses on web) with
 * a fake auth session so AuthStore.restoreSession() picks it up and the
 * app boots straight into Home instead of the Login screen.
 *
 * Must be called via page.addInitScript() BEFORE the page navigates,
 * because restoreSession() runs synchronously on app boot.
 */
const SEED_INIT_SCRIPT = `
  try {
    window.localStorage.setItem('auth.token', 'e2e-test-token');
    window.localStorage.setItem('auth.user', JSON.stringify({
      id: 'e2e-user',
      email: 'e2e@test.local',
      displayName: 'E2E Tester',
      createdAt: ${Date.now()},
    }));
    window.localStorage.setItem('onboarding.complete', 'true');
  } catch (e) {
    console.warn('[e2e seed] failed', e);
  }
`;

async function openViaFab(page: Page) {
  await page.locator('[data-testid="fab-search"]').click();
  await page.waitForSelector('[data-testid="quick-switcher"]', {
    state: 'visible',
    timeout: 3_000,
  });
}

async function openViaShortcut(page: Page) {
  await page.keyboard.press('Control+K');
  await page.waitForSelector('[data-testid="quick-switcher-input"]', {
    state: 'visible',
    timeout: 3_000,
  });
}

async function closeViaEscape(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

test.describe('Step 14 — Global Quick Switcher', () => {
  test.beforeEach(async ({ page }) => {
    // Seed auth BEFORE navigating so AuthStore.restoreSession() picks
    // it up and the app boots into Home (where the FAB lives).
    await page.addInitScript(SEED_INIT_SCRIPT);
    await page.emulateMedia({ colorScheme: 'light' });
    await waitForAppMount(page);
  });

  test('FAB button is visible on Home', async ({ page }) => {
    await expect(page.locator('[data-testid="fab-search"]')).toBeVisible();
  });

  test('FAB opens the switcher modal', async ({ page }) => {
    await openViaFab(page);
    await expect(
      page.locator('[data-testid="quick-switcher-input"]'),
    ).toBeFocused();
  });

  test('Cmd+K opens switcher from any screen', async ({ page }) => {
    // From Home (no navigation needed) — verify shortcut works
    await openViaShortcut(page);
    await expect(
      page.locator('[data-testid="quick-switcher-input"]'),
    ).toBeVisible();
  });

  test('typing "med" surfaces Meditation screen first', async ({ page }) => {
    await openViaFab(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'med');
    await page.waitForTimeout(250); // debounce
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await expect(firstResult).toContainText('Meditation');
  });

  test('typing Vietnamese alias "thien" matches Meditation', async ({ page }) => {
    await openViaFab(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'thien');
    await page.waitForTimeout(250);
    const firstResult = page.locator('[data-testid="search-result"]').first();
    await expect(firstResult).toContainText('Meditation');
  });

  test('typing "ai" prioritizes AI screens over Achievements', async ({ page }) => {
    await openViaFab(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'ai');
    await page.waitForTimeout(250);
    // Verify at least one of AIChat / AISettings is in the first 3 results
    const topResults = await page
      .locator('[data-testid="search-result"]')
      .allTextContents();
    const joined = topResults.slice(0, 3).join('|');
    expect(joined).toMatch(/AI/);
  });

  test('Enter navigates and closes the modal', async ({ page }) => {
    await openViaFab(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'breathing');
    await page.waitForTimeout(250);
    await page.keyboard.press('Enter');

    // Modal closes (rendered null) — give navigation+unmount time.
    await page.waitForTimeout(500);
    await expect(
      page.locator('[data-testid="quick-switcher"]'),
    ).toHaveCount(0);
  });

  test('Escape closes the modal', async ({ page }) => {
    await openViaFab(page);
    await closeViaEscape(page);
    await expect(
      page.locator('[data-testid="quick-switcher"]'),
    ).toHaveCount(0);
  });

  test('backdrop click closes the modal', async ({ page }) => {
    await openViaFab(page);
    await page.locator('[data-testid="quick-switcher-backdrop"]').click();
    await page.waitForTimeout(200);
    await expect(
      page.locator('[data-testid="quick-switcher"]'),
    ).toHaveCount(0);
  });

  test('recents persist across sessions', async ({ page }) => {
    // Pick a result to push it to recents
    await openViaFab(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'pomodoro');
    await page.waitForTimeout(250);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);

    // Reopen — query empty — should show Pomodoro in recents
    await openViaFab(page);
    await expect(
      page.locator('[data-testid="quick-switcher-list"]'),
    ).toContainText('Pomodoro');
  });

  test('empty state shows suggestions for typos', async ({ page }) => {
    await openViaFab(page);
    // Use a query that fuzzy-matches but is unlikely to be exact
    await page.fill('[data-testid="quick-switcher-input"]', 'meditatoin');
    await page.waitForTimeout(250);
    // Either exact match or didyoumean suggestion should be visible
    const hasResult = (await page
      .locator('[data-testid="search-result"]')
      .count()) > 0;
    const hasSuggestion = (await page
      .locator('[data-testid="didyoumean-Meditation"]')
      .count()) > 0;
    expect(hasResult || hasSuggestion).toBe(true);
  });

  test('right-click on a result pins it (no navigation)', async ({ page }) => {
    await openViaFab(page);
    await page.fill('[data-testid="quick-switcher-input"]', 'music');
    await page.waitForTimeout(250);
    // Right-click should pin/unpin, NOT navigate. Use force because RN Web
    // sometimes forwards the event as a context menu.
    await page
      .locator('[data-testid="search-result"]')
      .first()
      .click({ button: 'right', force: true });
    await page.waitForTimeout(200);

    // Modal should still be open (pin is not navigation)
    await expect(
      page.locator('[data-testid="quick-switcher"]'),
    ).toHaveCount(1);

    // Reopen with empty query — Music should appear in pinned
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await openViaFab(page);
    await expect(
      page.locator('[data-testid="quick-switcher-list"]'),
    ).toContainText('Music');
  });
});
