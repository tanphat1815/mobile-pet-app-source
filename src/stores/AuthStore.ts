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
  getBiometricEnabled,
  setBiometricEnabled,
  getOnboardingComplete,
  setOnboardingComplete,
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
  /** Whether the user has enabled biometric login for future launches. */
  biometricEnabled: boolean;
  /** Whether the user has finished the onboarding flow. */
  onboardingComplete: boolean;

  // Actions
  restoreSession: () => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  /** Persist the user's choice to enable / disable biometric login. */
  setBiometricEnabledPreference: (enabled: boolean) => Promise<void>;
  /** Persist that the user has finished onboarding. */
  completeOnboarding: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'restoring',
  user: null,
  email: '',
  error: null,
  biometricEnabled: false,
  onboardingComplete: false,

  // ------------------------------------------------------------------
  // restoreSession
  // Called once at app startup. If a token exists in storage, the user
  // is considered authenticated. (Token expiry is handled server-side.)
  // ------------------------------------------------------------------
  restoreSession: async () => {
    try {
      const token = await getStoredToken();
      const [bio, onb] = await Promise.all([
        getBiometricEnabled(),
        getOnboardingComplete(),
      ]);
      if (!token) {
        set({
          status: 'unauthenticated',
          user: null,
          error: null,
          biometricEnabled: bio,
          onboardingComplete: onb,
        });
        return;
      }
      const user = await getStoredUser();
      set({
        status: 'authenticated',
        user: user ?? null,
        error: null,
        biometricEnabled: bio,
        onboardingComplete: onb,
      });
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

  // ------------------------------------------------------------------
  // setBiometricEnabledPreference
  // Persists the user's preference so the next launch can decide
  // whether to offer the biometric prompt.
  // ------------------------------------------------------------------
  setBiometricEnabledPreference: async (enabled: boolean) => {
    await setBiometricEnabled(enabled);
    set({ biometricEnabled: enabled });
  },

  // ------------------------------------------------------------------
  // completeOnboarding
  // ------------------------------------------------------------------
  completeOnboarding: async () => {
    await setOnboardingComplete(true);
    set({ onboardingComplete: true });
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistSession(res: VerifyOtpResponse): Promise<void> {
  await setStoredToken(res.token);
  await setStoredRefreshToken(res.refreshToken);
  await setStoredUser(res.user);
}
