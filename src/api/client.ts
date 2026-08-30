/**
 * Axios API Client
 *
 * Single shared Axios instance with:
 * - baseURL from config
 * - request interceptor that attaches the Bearer token (if stored)
 * - response interceptor that unwraps data and handles 401 by clearing auth
 *
 * Domain-specific API modules (auth.ts, chat.ts, friends.ts, etc.) should
 * each take `apiClient` as their dependency and expose typed methods.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import { getStoredToken, clearStoredAuth, getStoredUser } from './storage';

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

// ============================================================================
// Client instance
// ============================================================================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ============================================================================
// Request interceptor - attach auth token + device metadata
// ============================================================================

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  const user = await getStoredUser();
  if (user) {
    config.headers.set('X-User-Id', user.id);
  }
  return config;
});

// ============================================================================
// Response interceptor - unwrap data + handle errors
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    // Build a normalized error object
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const normalized: ApiError = {
      status,
      code: payload?.error?.code ?? error.code ?? 'UNKNOWN',
      message: payload?.error?.message ?? error.message ?? 'Unknown error',
      details: payload?.error?.details,
    };

    // 401: clear auth and surface a typed error so stores can react
    if (status === 401) {
      await clearStoredAuth();
    }

    // Attach the normalized error to the axios error for callers
    (error as AxiosError & { normalized?: ApiError }).normalized = normalized;

    return Promise.reject(error);
  }
);

// ============================================================================
// Helpers
// ============================================================================

export async function pingApi(): Promise<boolean> {
  try {
    // httpbin's /uuid always succeeds and returns a JSON body. Used as a
    // generic health check while the real Worker isn't deployed.
    const res = await apiClient.get<{ uuid: string }>('/uuid', { timeout: 5_000 });
    return typeof res.data?.uuid === 'string' && res.data.uuid.length > 0;
  } catch {
    return false;
  }
}

export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError & { normalized?: ApiError };
    if (ax.normalized) return ax.normalized;
    return {
      status: ax.response?.status ?? 0,
      code: ax.code ?? 'NETWORK',
      message: ax.message,
    };
  }
  if (error instanceof Error) {
    return { status: 0, code: 'UNKNOWN', message: error.message };
  }
  return { status: 0, code: 'UNKNOWN', message: 'Unknown error' };
}

export default apiClient;