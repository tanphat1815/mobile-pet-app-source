/**
 * Vitest Configuration
 *
 * Uses the jsdom environment so storage / browser-style globals work
 * for the storage wrapper tests. Reanimated / gesture-handler are
 * mocked via the `setup.ts` file.
 */

import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', '.expo/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/**/*.{ts,tsx}',
        'src/api/storage.ts',
        'src/api/SyncManager.ts',
        'src/stores/AuthStore.ts',
        'src/stores/SyncStore.ts',
      ],
      thresholds: {
        lines: 60,
        statements: 60,
        functions: 60,
        branches: 50,
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});