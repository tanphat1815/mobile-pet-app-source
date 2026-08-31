/**
 * Settings API
 *
 * REST endpoints with local mock state. Reads return the persisted
 * settings (or DEFAULT_SETTINGS if nothing is stored yet); writes
 * apply optimistically and persist to AsyncStorage so the next
 * launch reflects the user's choice.
 */

import apiClient from './client';
import { getApiError } from './client';
import { storage, StorageKeys } from './storage';
import { UserSettings, DEFAULT_SETTINGS } from './settingsTypes';

// ============================================================================
// Local persistence
// ============================================================================

async function persistSettings(s: UserSettings): Promise<void> {
  await storage.setJSON(StorageKeys.UserSettings, s);
}

async function readPersistedSettings(): Promise<UserSettings | null> {
  return storage.getJSON<UserSettings>(StorageKeys.UserSettings);
}

// ============================================================================
// API
// ============================================================================

export async function getUserSettings(): Promise<UserSettings> {
  try {
    await apiClient.get('/get', { params: { action: 'get_user_settings' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const local = await readPersistedSettings();
  return local ?? DEFAULT_SETTINGS;
}

export async function updateUserSettings(
  patch: Partial<UserSettings>
): Promise<UserSettings> {
  try {
    await apiClient.post('/post', {
      action: 'update_user_settings',
      ...patch,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const current = (await readPersistedSettings()) ?? DEFAULT_SETTINGS;
  const merged: UserSettings = { ...current, ...patch };
  await persistSettings(merged);
  return merged;
}

// ============================================================================
// Profile API
// ============================================================================

import { AuthUser } from './storage';

export interface UpdateProfileInput {
  displayName?: string;
  avatarUrl?: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<AuthUser> {
  try {
    await apiClient.post('/post', {
      action: 'update_profile',
      ...input,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const current = await storage.getJSON<AuthUser>(StorageKeys.AuthUser);
  if (!current) throw new Error('Not signed in');
  const updated: AuthUser = {
    ...current,
    displayName: input.displayName ?? current.displayName,
    avatarUrl: input.avatarUrl ?? current.avatarUrl,
  };
  await storage.setJSON(StorageKeys.AuthUser, updated);
  return updated;
}

export interface UserStats {
  petLevel: number;
  petXP: number;
  friendsCount: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  questsCompleted: number;
  streakDays: number;
  joinedAt: number;
}

export async function getUserStats(): Promise<UserStats> {
  try {
    await apiClient.get('/get', { params: { action: 'get_user_stats' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return {
    petLevel: 13,
    petXP: 1240,
    friendsCount: 5,
    achievementsUnlocked: 4,
    achievementsTotal: 12,
    questsCompleted: 1,
    streakDays: 14,
    joinedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  };
}