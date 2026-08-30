/**
 * Auth API Module
 *
 * Typed API methods for auth endpoints. All methods are standalone
 * (do not require the caller to manage tokens manually) - the shared
 * Axios client interceptor handles that automatically.
 *
 * While the real backend Worker is not yet deployed, these methods target
 * httpbin.org so the flow can be exercised end-to-end.
 */

import apiClient, { getApiError } from './client';
import { API_BASE_URL } from './config';

// ============================================================================
// Types
// ============================================================================

export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message: string;
  /** Seconds until the next OTP can be requested */
  cooldownSeconds?: number;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    createdAt: number;
  };
}

export interface LogoutResponse {
  ok: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function mockOk<T>(payload: T): T {
  return payload;
}

// ============================================================================
// Methods
// ============================================================================

/**
 * Send an OTP to the given email address.
 * The real backend will email a 6-digit code.
 * Development fallback: immediately returns success so the verify screen can
 * be reached without a real mail server.
 */
export async function sendOtp(req: SendOtpRequest): Promise<SendOtpResponse> {
  try {
    const res = await apiClient.post<SendOtpResponse>('/post', {
      action: 'send_otp',
      email: req.email,
    });
    return mockOk({ message: `OTP sent to ${req.email}`, cooldownSeconds: 60 });
  } catch (err) {
    const e = getApiError(err);
    // Network-level failures are surfaced with a fallback response so the UI
    // can still navigate to the verify screen during development.
    if (e.status === 0) {
      return { message: `Dev: OTP sent to ${req.email}`, cooldownSeconds: 60 };
    }
    throw err;
  }
}

/**
 * Verify the 6-digit code for the given email.
 * On success, returns JWT + refresh token + user profile.
 */
export async function verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  try {
    await apiClient.post('/post', {
      action: 'verify_otp',
      email: req.email,
      code: req.code,
    });
    // Return a mock JWT for development. Replace this block with the real
    // response shape once the Worker exposes /auth/verify.
    const mockUser = {
      id: `dev_${req.email.replace(/[^a-z0-9]/gi, '_')}`,
      email: req.email,
      displayName: req.email.split('@')[0],
      createdAt: Date.now(),
    };
    return {
      token: `dev_token_${Date.now()}`,
      refreshToken: `dev_refresh_${Date.now()}`,
      user: mockUser,
    };
  } catch (err) {
    const e = getApiError(err);
    if (e.status === 0) {
      // Network error during dev: return a mock session so the flow is testable
      const mockUser = {
        id: `dev_${req.email.replace(/[^a-z0-9]/gi, '_')}`,
        email: req.email,
        displayName: req.email.split('@')[0],
        createdAt: Date.now(),
      };
      return {
        token: `dev_token_${Date.now()}`,
        refreshToken: `dev_refresh_${Date.now()}`,
        user: mockUser,
      };
    }
    throw err;
  }
}

/**
 * Invalidate the current session on the server.
 */
export async function logoutApi(): Promise<LogoutResponse> {
  try {
    await apiClient.post('/post', { action: 'logout' });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
