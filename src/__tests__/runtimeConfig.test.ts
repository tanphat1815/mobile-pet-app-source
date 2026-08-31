/**
 * runtimeConfig
 *
 * Verifies the env reader returns the expected shape for the four
 * supported env values.
 *
 * NOTE: the module reads `process.env` at module-load time, so we use
 * vi.resetModules() + dynamic import to re-evaluate after mutating
 * process.env.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const originalEnv = { ...process.env };

function setEnv(values: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function resetEnv() {
  for (const k of Object.keys(process.env)) {
    if (!(k in originalEnv)) delete process.env[k];
  }
  for (const [k, v] of Object.entries(originalEnv)) {
    process.env[k] = v;
  }
}

describe('runtimeConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    resetEnv();
  });
  afterEach(() => {
    resetEnv();
  });

  it('returns ENV = unknown when no env vars are set', async () => {
    delete process.env.EXPO_PUBLIC_ENV;
    const { ENV, IS_PRODUCTION_BUILD } = await import('../utils/runtimeConfig');
    expect(ENV).toBe('unknown');
    expect(IS_PRODUCTION_BUILD).toBe(false);
  });

  it('parses EXPO_PUBLIC_ENV = production correctly', async () => {
    setEnv({ EXPO_PUBLIC_ENV: 'production' });
    const { ENV, IS_PRODUCTION_BUILD, envLabel } = await import(
      '../utils/runtimeConfig'
    );
    expect(ENV).toBe('production');
    expect(IS_PRODUCTION_BUILD).toBe(true);
    expect(envLabel()).toBe('Production');
  });

  it('parses EXPO_PUBLIC_ENV = staging correctly', async () => {
    setEnv({ EXPO_PUBLIC_ENV: 'staging' });
    const { ENV, IS_STAGING_BUILD, IS_PROD_LIKE } = await import(
      '../utils/runtimeConfig'
    );
    expect(ENV).toBe('staging');
    expect(IS_STAGING_BUILD).toBe(true);
    expect(IS_PROD_LIKE).toBe(true);
  });

  it('parses EXPO_PUBLIC_ENV = development correctly', async () => {
    setEnv({ EXPO_PUBLIC_ENV: 'development' });
    const { ENV, IS_DEVELOPMENT_BUILD } = await import(
      '../utils/runtimeConfig'
    );
    expect(ENV).toBe('development');
    expect(IS_DEVELOPMENT_BUILD).toBe(true);
  });

  it('reads RUNTIME_API_BASE_URL + RUNTIME_WS_URL', async () => {
    setEnv({
      EXPO_PUBLIC_API_BASE_URL: 'https://api.example.com',
      EXPO_PUBLIC_WS_URL: 'wss://api.example.com/ws',
    });
    const { RUNTIME_API_BASE_URL, RUNTIME_WS_URL } = await import(
      '../utils/runtimeConfig'
    );
    expect(RUNTIME_API_BASE_URL).toBe('https://api.example.com');
    expect(RUNTIME_WS_URL).toBe('wss://api.example.com/ws');
  });

  it('falls back to Local label for unknown env', async () => {
    setEnv({ EXPO_PUBLIC_ENV: 'gibberish' });
    const { envLabel } = await import('../utils/runtimeConfig');
    expect(envLabel()).toBe('Local');
  });
});