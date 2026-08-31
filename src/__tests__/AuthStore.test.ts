/**
 * AuthStore State Machine
 *
 * Verifies the restoring / unauthenticated / sending / otp_sent /
 * verifying / authenticated / logging_out transitions.
 *
 * The auth API is mocked so the tests don't depend on a live backend.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/AuthStore';
import {
  setStoredToken,
  setStoredUser,
  StorageKeys,
} from '../api/storage';

vi.mock('../api/auth', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  logoutApi: vi.fn(),
}));

import { sendOtp, verifyOtp, logoutApi } from '../api/auth';

const SAMPLE_USER = {
  id: 'u-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  createdAt: 1700000000,
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useAuthStore.setState({
    status: 'restoring',
    user: null,
    email: '',
    error: null,
    biometricEnabled: false,
    onboardingComplete: false,
  });
  vi.clearAllMocks();
});

describe('AuthStore', () => {
  it('starts in restoring state', () => {
    expect(useAuthStore.getState().status).toBe('restoring');
  });

  describe('restoreSession', () => {
    it('lands in unauthenticated when there is no token', async () => {
      await useAuthStore.getState().restoreSession();
      const s = useAuthStore.getState();
      expect(s.status).toBe('unauthenticated');
      expect(s.user).toBeNull();
      expect(s.error).toBeNull();
    });

    it('lands in authenticated when a token is stored', async () => {
      await setStoredToken('token-A');
      await setStoredUser(SAMPLE_USER);
      await useAuthStore.getState().restoreSession();
      const s = useAuthStore.getState();
      expect(s.status).toBe('authenticated');
      expect(s.user).toEqual(SAMPLE_USER);
    });

    it('reads biometric + onboarding flags from storage', async () => {
      await setStoredToken('t');
      await AsyncStorage.setItem(StorageKeys.BiometricEnabled, 'true');
      await AsyncStorage.setItem(StorageKeys.OnboardingComplete, 'true');
      await useAuthStore.getState().restoreSession();
      const s = useAuthStore.getState();
      expect(s.biometricEnabled).toBe(true);
      expect(s.onboardingComplete).toBe(true);
    });

    it('swallows errors and falls back to unauthenticated', async () => {
      // Force setStoredToken to throw so the try/catch kicks in.
      const spy = vi
        .spyOn(await import('../api/storage'), 'getStoredToken')
        .mockRejectedValueOnce(new Error('boom'));
      await useAuthStore.getState().restoreSession();
      const s = useAuthStore.getState();
      expect(s.status).toBe('unauthenticated');
      expect(s.user).toBeNull();
      spy.mockRestore();
    });
  });

  describe('sendOtp', () => {
    it('moves through sending -> otp_sent on success', async () => {
      (sendOtp as any).mockResolvedValueOnce({});
      await useAuthStore.getState().sendOtp('alice@example.com');
      const s = useAuthStore.getState();
      expect(sendOtp).toHaveBeenCalledWith({ email: 'alice@example.com' });
      expect(s.status).toBe('otp_sent');
      expect(s.email).toBe('alice@example.com');
      expect(s.error).toBeNull();
    });

    it('captures the error message on failure', async () => {
      (sendOtp as any).mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 429 },
        message: 'Too many requests',
      });
      await useAuthStore.getState().sendOtp('alice@example.com');
      const s = useAuthStore.getState();
      expect(s.status).toBe('unauthenticated');
      expect(s.error).toBeTruthy();
    });
  });

  describe('verifyOtp', () => {
    beforeEach(() => {
      useAuthStore.setState({ email: 'alice@example.com' });
    });

    it('moves verifying -> authenticated on success', async () => {
      (verifyOtp as any).mockResolvedValueOnce({
        token: 't-1',
        refreshToken: 'r-1',
        user: SAMPLE_USER,
      });
      await useAuthStore.getState().verifyOtp('123456');
      const s = useAuthStore.getState();
      expect(s.status).toBe('authenticated');
      expect(s.user).toEqual(SAMPLE_USER);
      expect(s.error).toBeNull();
    });

    it('returns to otp_sent with error on failure', async () => {
      (verifyOtp as any).mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 400 },
        message: 'Invalid code',
      });
      await useAuthStore.getState().verifyOtp('000000');
      const s = useAuthStore.getState();
      expect(s.status).toBe('otp_sent');
      expect(s.error).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('clears the session and calls logoutApi', async () => {
      (logoutApi as any).mockResolvedValueOnce(undefined);
      useAuthStore.setState({ user: SAMPLE_USER, email: 'alice@example.com', status: 'authenticated' });
      await useAuthStore.getState().logout();
      expect(logoutApi).toHaveBeenCalled();
      const s = useAuthStore.getState();
      expect(s.status).toBe('unauthenticated');
      expect(s.user).toBeNull();
      expect(s.email).toBe('');
    });
  });

  describe('setBiometricEnabledPreference', () => {
    it('persists the flag in storage and updates the store', async () => {
      await useAuthStore.getState().setBiometricEnabledPreference(true);
      expect(useAuthStore.getState().biometricEnabled).toBe(true);
      expect(await AsyncStorage.getItem(StorageKeys.BiometricEnabled)).toBe('true');
    });
  });

  describe('completeOnboarding', () => {
    it('persists the flag in storage and updates the store', async () => {
      await useAuthStore.getState().completeOnboarding();
      expect(useAuthStore.getState().onboardingComplete).toBe(true);
      expect(await AsyncStorage.getItem(StorageKeys.OnboardingComplete)).toBe('true');
    });
  });

  describe('clearError', () => {
    it('resets the error to null', () => {
      useAuthStore.setState({ error: 'boom' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});