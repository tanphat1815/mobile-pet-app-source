import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Step 1 (theme parity) e2e.
 *
 * Boots Expo web dev server on port 8081 and runs visual regression
 * against the Cozy Cream theme tokens. See docs/steps/step-01-theme-parity.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx expo start --web --port 8081',
    port: 8081,
    timeout: 180_000,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    env: { CI: '1' },
  },
});
