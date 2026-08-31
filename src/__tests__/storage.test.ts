/**
 * Storage Wrapper
 *
 * Round-trip tests for the AsyncStorage helpers used by every store.
 * Relies on the mocked AsyncStorage (vitest.setup.ts) which keeps a
 * Map-backed store in-memory.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  storage,
  StorageKeys,
  getStoredToken,
  setStoredToken,
  clearStoredAuth,
  getStoredUser,
  setStoredUser,
  getThemePreference,
  setThemePreference,
  getNotificationsEnabled,
  setNotificationsEnabled,
  getBiometricEnabled,
  setBiometricEnabled,
  getOnboardingComplete,
  setOnboardingComplete,
} from '../api/storage';

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips a string', async () => {
    await storage.set(StorageKeys.AuthToken, 't-1234');
    expect(await storage.getString(StorageKeys.AuthToken)).toBe('t-1234');
  });

  it('round-trips JSON', async () => {
    await storage.setJSON(StorageKeys.AuthUser, { id: 'u1', email: 'a@b.c' });
    expect(await storage.getJSON(StorageKeys.AuthUser)).toEqual({
      id: 'u1',
      email: 'a@b.c',
    });
  });

  it('returns null for missing string', async () => {
    expect(await storage.getString(StorageKeys.AuthToken)).toBeNull();
  });

  it('returns null for missing JSON', async () => {
    expect(await storage.getJSON(StorageKeys.AuthUser)).toBeNull();
  });

  it('returns null for corrupted JSON', async () => {
    await AsyncStorage.setItem(StorageKeys.AuthUser, '{not-json');
    expect(await storage.getJSON(StorageKeys.AuthUser)).toBeNull();
  });

  it('delete() removes a key', async () => {
    await storage.set(StorageKeys.AuthToken, 't');
    await storage.delete(StorageKeys.AuthToken);
    expect(await storage.getString(StorageKeys.AuthToken)).toBeNull();
  });

  it('clearAll() wipes the store', async () => {
    await storage.set(StorageKeys.AuthToken, 't');
    await storage.set(StorageKeys.AuthUser, 'u');
    await storage.clearAll();
    expect(await storage.getAllKeys()).toEqual([]);
  });

  it('getStoredToken / setStoredToken round-trip', async () => {
    await setStoredToken('token-A');
    expect(await getStoredToken()).toBe('token-A');
  });

  it('clearStoredAuth removes token + refresh + user', async () => {
    await setStoredToken('t');
    await AsyncStorage.setItem(StorageKeys.RefreshToken, 'r');
    await setStoredUser({ id: 'u', email: 'a@b.c', createdAt: 1 });
    await clearStoredAuth();
    expect(await getStoredToken()).toBeNull();
    expect(await getStoredUser()).toBeNull();
  });

  it('default ThemePreference is system', async () => {
    expect(await getThemePreference()).toBe('system');
  });

  it('round-trips ThemePreference (system / light / dark)', async () => {
    for (const v of ['system', 'light', 'dark'] as const) {
      await setThemePreference(v);
      expect(await getThemePreference()).toBe(v);
    }
  });

  it('ThemePreference rejects unknown values and falls back to system', async () => {
    await AsyncStorage.setItem(StorageKeys.ThemePreference, 'fuchsia');
    expect(await getThemePreference()).toBe('system');
  });

  it('default notificationsEnabled is true', async () => {
    expect(await getNotificationsEnabled()).toBe(true);
  });

  it('round-trips notificationsEnabled', async () => {
    await setNotificationsEnabled(false);
    expect(await getNotificationsEnabled()).toBe(false);
    await setNotificationsEnabled(true);
    expect(await getNotificationsEnabled()).toBe(true);
  });

  it('default biometricEnabled is false', async () => {
    expect(await getBiometricEnabled()).toBe(false);
  });

  it('round-trips biometricEnabled', async () => {
    await setBiometricEnabled(true);
    expect(await getBiometricEnabled()).toBe(true);
  });

  it('default onboardingComplete is false', async () => {
    expect(await getOnboardingComplete()).toBe(false);
  });

  it('round-trips onboardingComplete', async () => {
    await setOnboardingComplete(true);
    expect(await getOnboardingComplete()).toBe(true);
    await setOnboardingComplete(false);
    expect(await getOnboardingComplete()).toBe(false);
  });
});