/**
 * Storage Abstraction
 *
 * Thin wrapper around AsyncStorage that exposes a typed key-value API
 * with helper methods for the common cases: auth token, user data, theme
 * preference, settings.
 *
 * The wrapper intentionally hides the raw AsyncStorage calls so the rest
 * of the codebase never imports the third-party module.
 *
 * In a future optimization step, this can be swapped to MMKV without
 * changing any call sites.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Keys
// ============================================================================

export const StorageKeys = {
  AuthToken: 'auth.token',
  RefreshToken: 'auth.refresh_token',
  AuthUser: 'auth.user',
  ThemePreference: 'settings.theme', // 'system' | 'light' | 'dark'
  NotificationsEnabled: 'settings.notifications',
  BiometricEnabled: 'settings.biometric',
  ReducedMotionEnabled: 'settings.reduced_motion',
  DeviceId: 'device.id',
  OnboardingComplete: 'onboarding.complete',
  PushToken: 'notifications.push_token',
  LastNotification: 'notifications.last',
  UserSettings: 'settings.user_settings',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

// ============================================================================
// Primitive API
// ============================================================================

export const storage = {
  async getString(key: StorageKey): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      if (__DEV__) console.warn(`[storage] getString(${key}) failed`, err);
      return null;
    }
  },

  async getJSON<T>(key: StorageKey): Promise<T | null> {
    const raw = await storage.getString(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      if (__DEV__) console.warn(`[storage] getJSON(${key}) parse failed`, err);
      return null;
    }
  },

  async set(key: StorageKey, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (err) {
      if (__DEV__) console.warn(`[storage] set(${key}) failed`, err);
    }
  },

  async setJSON<T>(key: StorageKey, value: T): Promise<void> {
    await storage.set(key, JSON.stringify(value));
  },

  async delete(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      if (__DEV__) console.warn(`[storage] delete(${key}) failed`, err);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (err) {
      if (__DEV__) console.warn(`[storage] clearAll failed`, err);
    }
  },

  async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (err) {
      if (__DEV__) console.warn(`[storage] getAllKeys failed`, err);
      return [];
    }
  },
};

// ============================================================================
// Auth helpers (used by AuthStore in Step M-4)
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: number;
}

export async function getStoredToken(): Promise<string | null> {
  return storage.getString(StorageKeys.AuthToken);
}

export async function setStoredToken(token: string): Promise<void> {
  await storage.set(StorageKeys.AuthToken, token);
}

export async function setStoredRefreshToken(refreshToken: string): Promise<void> {
  await storage.set(StorageKeys.RefreshToken, refreshToken);
}

export async function clearStoredAuth(): Promise<void> {
  await Promise.all([
    storage.delete(StorageKeys.AuthToken),
    storage.delete(StorageKeys.RefreshToken),
    storage.delete(StorageKeys.AuthUser),
  ]);
}

export async function getStoredUser<T extends AuthUser = AuthUser>(): Promise<T | null> {
  return storage.getJSON<T>(StorageKeys.AuthUser);
}

export async function setStoredUser(user: AuthUser): Promise<void> {
  await storage.setJSON(StorageKeys.AuthUser, user);
}

// ============================================================================
// Settings helpers
// ============================================================================

export type ThemePreference = 'system' | 'light' | 'dark';

export async function getThemePreference(): Promise<ThemePreference> {
  const value = await storage.getString(StorageKeys.ThemePreference);
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export async function setThemePreference(pref: ThemePreference): Promise<void> {
  await storage.set(StorageKeys.ThemePreference, pref);
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const value = await storage.getString(StorageKeys.NotificationsEnabled);
  return value !== 'false'; // default true
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await storage.set(StorageKeys.NotificationsEnabled, String(enabled));
}

export async function getBiometricEnabled(): Promise<boolean> {
  const value = await storage.getString(StorageKeys.BiometricEnabled);
  return value === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await storage.set(StorageKeys.BiometricEnabled, String(enabled));
}

export async function getOnboardingComplete(): Promise<boolean> {
  const value = await storage.getString(StorageKeys.OnboardingComplete);
  return value === 'true';
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await storage.set(StorageKeys.OnboardingComplete, String(complete));
}