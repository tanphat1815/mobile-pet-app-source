/**
 * API Configuration
 *
 * Base URLs for REST + WebSocket endpoints. These should be replaced with
 * the production Cloudflare Worker URL when the desktop pet backend is
 * deployed. The current values point at public testing endpoints so the
 * client can be exercised without a running backend.
 *
 * Environment switching:
 * - dev / debug: use staging or local Worker
 * - release: use production Worker
 *
 * Resolution order:
 *   1. process.env.EXPO_PUBLIC_API_BASE_URL (overrides everything)
 *   2. Platform-specific default below
 */

import { Platform } from 'react-native';

// Override via EXPO_PUBLIC_API_BASE_URL at build time (EAS Build / Metro)
const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
const envWsUrl = process.env.EXPO_PUBLIC_WS_URL;

function defaultApiBaseUrl(): string {
  // Public placeholder for development. Replaced once the desktop Worker is online.
  return 'https://httpbin.org';
}

function defaultWsUrl(): string {
  // Placeholder WebSocket echo server used until the RelayHub Durable Object is live.
  return 'wss://ws.postman-echo.com/raw';
}

export const API_BASE_URL: string = envBaseUrl ?? defaultApiBaseUrl();
export const WS_URL: string = envWsUrl ?? defaultWsUrl();

// Default request timeout in milliseconds
export const API_TIMEOUT_MS = 10_000;

// Reconnect tuning for WebSocket SyncManager (used in Step M-5)
export const WS_RECONNECT = {
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  maxAttempts: 10,
  heartbeatIntervalMs: 30_000,
  pongTimeoutMs: 10_000,
};

// Logging helpers
export const IS_DEV: boolean = process.env.NODE_ENV !== 'production';

// Platform tag used in user-agent / device register payloads
export const PLATFORM_TAG = Platform.OS; // 'ios' | 'android' | 'web'

// App version (Step M-7: used in push token payloads so backend can
// version-stamp devices)
export const APP_VERSION = '0.1.0';