/**
 * Visual snapshot — chụp Home/Onboarding ở light + dark mode
 * để so sánh với desktop theme preview.
 */
import { test } from '@playwright/test';

test.describe('Step 1 — visual snapshots', () => {
  test('light mode onboarding', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/step-01-light.png', fullPage: true });
  });

  test('dark mode onboarding', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/step-01-dark.png', fullPage: true });
  });
});
