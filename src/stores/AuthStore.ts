/**
 * AuthStore (Zustand)
 *
 * Manages the authentication state machine:
 *
 *   restoring → (authenticated | unauthenticated)
 *   unauthenticated → sending → otp_sent → verifying → authenticated
 *   any state    → logging_out → unauthenticated
 *
 * State:
 *   status: 'restoring' | 'unauthenticated' | 'sending' | 'otp_sent' | 'verifying' | 'authenticated' | 'logging_out'
 *   user: AuthUser | null
 *   email: string (the email being verified)
 *   error: string | null
 *
 * The store persists the user + tokens to AsyncStorage so the session
 * survives app restarts without requiring a full re-login.
 */

import { create } from 'zustand';
import {
  sendOtp,
  verifyOtp,
  logoutApi,
  type VerifyOtpResponse,
} from '../api/auth';
import {
  AuthUser,
  getStoredToken,
  setStoredToken,
  setStoredRefreshToken,
  getStoredUser,
  setStoredUser,
  clearStoredAuth,
} from '../api/storage';
import { getApiError } from '../api/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuthStatus =
  | 'restoring'
  | 'unauthenticated'
  | 'sending'
  | 'otp_sent'
  | 'verifying'
  | 'authenticated'
  | 'logging_out';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  email: string;
  error: string | null;

  // Actions
  restoreSession: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'restoring',
  user: null,
  email: '',
  error: null,

  // ------------------------------------------------------------------
  // restoreSession
  // Called once at app startup. If a token exists in storage, the user
  // is considered authenticated. (Token expiry is handled server-side.)
  // ------------------------------------------------------------------
  restoreSession: async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        set({ status: 'unauthenticated', user: null, error: null });
        return;
      }
      const user = await getStoredUser();
      if (user) {
        set({ status: 'authenticated', user, error: null });
      } else {
        // Token present but user data missing: re-fetch user profile here
        // once a /me endpoint exists on the backend.
        set({ status: 'authenticated', user: null, error: null });
      }
    } catch {
      await clearStoredAuth();
      set({ status: 'unauthenticated', user: null, error: null });
    }
  },

  // ------------------------------------------------------------------
  // sendOtp
  // ------------------------------------------------------------------
  sendOtp: async (email: string) => {
    set({ status: 'sending', email, error: null });
    try {
      await sendOtp({ email });
      set({ status: 'otp_sent', email, error: null });
    } catch (err) {
      const e = getApiError(err);
      set({ status: 'unauthenticated', email, error: e.message });
    }
  },

  // ------------------------------------------------------------------
  // verifyOtp
  // ------------------------------------------------------------------
  verifyOtp: async (code: string) => {
    const { email } = get();
    set({ status: 'verifying', error: null });
    try {
      const res = await verifyOtp({ email, code });
      await persistSession(res);
      set({ status: 'authenticated', user: res.user, error: null });
    } catch (err) {
      const e = getApiError(err);
      set({ status: 'otp_sent', error: e.message });
    }
  },

  // ------------------------------------------------------------------
  // logout
  // ------------------------------------------------------------------
  logout: async () => {
    set({ status: 'logging_out' });
    await logoutApi();
    await clearStoredAuth();
    set({ status: 'unauthenticated', user: null, email: '', error: null });
  },

  // ------------------------------------------------------------------
  // clearError
  // ------------------------------------------------------------------
  clearError: () => set({ error: null }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistSession(res: VerifyOtpResponse): Promise<void> {
  await setStoredToken(res.token);
  await setStoredRefreshToken(res.refreshToken);
  await setStoredUser(res.user);
}
