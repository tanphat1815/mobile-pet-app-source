/**
 * SettingsStore (Zustand)
 *
 * Owns the current UserSettings snapshot + a few derived flags
 * (e.g. `darkMode`, `reduceMotion`). Provides optimistic update
 * with rollback on failure.
 */

import { create } from 'zustand';
import {
  getUserSettings,
  updateUserSettings,
  updateProfile,
  getUserStats,
  UserStats,
} from '../api/settings';
import { UserSettings, DEFAULT_SETTINGS } from '../api/settingsTypes';
import { AuthUser } from '../api/storage';
import { getApiError } from '../api/client';

// ============================================================================
// Types
// ============================================================================

export type SettingsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface SettingsState {
  settings: UserSettings;
  status: SettingsStatus;
  error: string | null;
  /** Whether any field is mid-flight */
  saving: boolean;
  /** Profile edit state */
  profileSaving: boolean;
  profileError: string | null;
  /** Stats cache */
  stats: UserStats | null;
  statsStatus: SettingsStatus;
  /** Last saved profile snapshot (for rollback) */
  profileSnapshot: AuthUser | null;

  loadAll: () => Promise<void>;
  loadStats: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => Promise<void>;
  saveProfile: (patch: { displayName?: string; avatarUrl?: string }) => Promise<AuthUser>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  status: 'idle',
  error: null,
  saving: false,
  profileSaving: false,
  profileError: null,
  stats: null,
  statsStatus: 'idle',
  profileSnapshot: null,

  loadAll: async () => {
    set({ status: 'loading', error: null });
    try {
      const settings = await getUserSettings();
      set({ settings, status: 'ready' });
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error ? err.message : 'Failed to load settings',
      });
    }
  },

  loadStats: async () => {
    set({ statsStatus: 'loading' });
    try {
      const stats = await getUserStats();
      set({ stats, statsStatus: 'ready' });
    } catch (err) {
      set({
        statsStatus: 'error',
        error:
          err instanceof Error ? err.message : 'Failed to load stats',
      });
    }
  },

  updateSetting: async (key, value) => {
    const prev = get().settings;
    set({
      settings: { ...prev, [key]: value },
      saving: true,
      error: null,
    });
    try {
      const merged = await updateUserSettings({ [key]: value } as Partial<UserSettings>);
      set({ settings: merged, saving: false });
    } catch (err) {
      // Roll back the optimistic update
      const e = getApiError(err);
      set({ settings: prev, saving: false, error: e.message });
    }
  },

  saveProfile: async (patch) => {
    set({ profileSaving: true, profileError: null });
    try {
      const updated = await updateProfile(patch);
      set({ profileSaving: false, profileSnapshot: updated });
      return updated;
    } catch (err) {
      const e = getApiError(err);
      set({ profileSaving: false, profileError: e.message });
      throw err;
    }
  },

  reset: () => {
    set({
      settings: DEFAULT_SETTINGS,
      status: 'idle',
      error: null,
      saving: false,
      profileSaving: false,
      profileError: null,
      stats: null,
      statsStatus: 'idle',
      profileSnapshot: null,
    });
  },
}));