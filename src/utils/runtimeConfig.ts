/**
 * Build-time configuration
 *
 * Reads environment variables injected by Expo / EAS Build at compile
 * time and exposes a runtime shape that's safe to consume from any
 * screen / store. Falls back to the values in `api/config.ts` when
 * the runtime is not a managed Expo bundle (e.g. unit tests).
 *
 * The values that come from here:
 *   - EXPO_PUBLIC_API_BASE_URL  -> REST base URL
 *   - EXPO_PUBLIC_WS_URL        -> WebSocket URL
 *   - EXPO_PUBLIC_ENV           -> 'development' | 'staging' | 'production'
 *   - EXPO_PUBLIC_APP_VARIANT   -> 'ios' | 'android' | 'web' | 'unknown'
 *   - EXPO_PUBLIC_BUILD_NUMBER  -> integer (EAS autoIncrement / gradle)
 *
 * Use the typed helpers below; never read process.env directly in app
 * code.
 */

import { Platform } from 'react-native';

export type AppEnv = 'development' | 'staging' | 'production' | 'unknown';

function readString(key: string): string | undefined {
  // process.env keys injected via Expo / EAS live on the global
  // process object. Guard for non-Node runtimes (e.g. SSR).
  if (typeof process === 'undefined' || !process.env) return undefined;
  const v = process.env[key];
  if (!v || v.length === 0) return undefined;
  return v;
}

function readBool(key: string, fallback: boolean): boolean {
  const v = readString(key);
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

function readInt(key: string, fallback: number): number {
  const v = readString(key);
  if (v === undefined) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// ENV detection
// ---------------------------------------------------------------------------

function readEnv(): AppEnv {
  const v = readString('EXPO_PUBLIC_ENV');
  switch (v) {
    case 'development':
      return 'development';
    case 'staging':
      return 'staging';
    case 'production':
      return 'production';
    default:
      return 'unknown';
  }
}

export const ENV: AppEnv = readEnv();

export const IS_DEVELOPMENT_BUILD: boolean = ENV === 'development';
export const IS_STAGING_BUILD: boolean = ENV === 'staging';
export const IS_PRODUCTION_BUILD: boolean = ENV === 'production';
export const IS_PROD_LIKE: boolean =
  IS_STAGING_BUILD || IS_PRODUCTION_BUILD;

// ---------------------------------------------------------------------------
// URLs (overrides the defaults in api/config.ts at runtime)
// ---------------------------------------------------------------------------

export const RUNTIME_API_BASE_URL: string | undefined =
  readString('EXPO_PUBLIC_API_BASE_URL');
export const RUNTIME_WS_URL: string | undefined =
  readString('EXPO_PUBLIC_WS_URL');

// ---------------------------------------------------------------------------
// Build metadata
// ---------------------------------------------------------------------------

export const RUNTIME_BUILD_NUMBER: number = readInt(
  'EXPO_PUBLIC_BUILD_NUMBER',
  0
);

export const RUNTIME_APP_VARIANT: 'ios' | 'android' | 'web' | 'unknown' =
  ((): 'ios' | 'android' | 'web' | 'unknown' => {
    const v = readString('EXPO_PUBLIC_APP_VARIANT');
    if (v === 'ios' || v === 'android' || v === 'web') return v;
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    if (Platform.OS === 'web') return 'web';
    return 'unknown';
  })();

export const USE_DEVELOPMENT_CLIENT: boolean = readBool(
  'EXPO_PUBLIC_USE_DEV_CLIENT',
  IS_DEVELOPMENT_BUILD
);

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

export function envLabel(e: AppEnv = ENV): string {
  switch (e) {
    case 'development':
      return 'Development';
    case 'staging':
      return 'Staging';
    case 'production':
      return 'Production';
    case 'unknown':
    default:
      return 'Local';
  }
}

/**
 * Logs the runtime config to the console once on app boot. Disabled in
 * production for log-noise reasons.
 */
export function logRuntimeConfig(): void {
  if (IS_PRODUCTION_BUILD) return;
  if (typeof console === 'undefined') return;
  console.log('[runtime] env =', ENV);
  console.log('[runtime] variant =', RUNTIME_APP_VARIANT);
  console.log('[runtime] api base =', RUNTIME_API_BASE_URL ?? '(default)');
  console.log('[runtime] ws       =', RUNTIME_WS_URL ?? '(default)');
  console.log('[runtime] build    =', RUNTIME_BUILD_NUMBER);
}