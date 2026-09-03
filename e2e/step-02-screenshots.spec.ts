/**
 * Visual snapshots — 6 themes để so sánh với desktop.
 */
import { test, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2000);
}

async function setAppThemeId(page: Page, themeId: string) {
  await page.evaluate((id) => {
    const mp = (window as any).__MOBILE_PET__;
    if (mp?.setAppTheme) mp.setAppTheme(id);
  }, themeId);
  await page.waitForTimeout(1500);
}

const THEMES = ['light', 'dark', 'christmas', 'halloween', 'cyberpunk', 'pastel'];

for (const id of THEMES) {
  test(`screenshot — ${id}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    await setAppThemeId(page, id);
    await page.screenshot({ path: `test-results/step-02-${id}.png`, fullPage: true });
  });
}
