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
  UpdateProfileInput,
} from '../api/settings';
import { UserSettings, DEFAULT_SETTINGS } from '../api/settingsTypes';
import { ThemeId, isThemeUnlocked } from '../utils/appThemes';
import { AuthUser, storage, StorageKeys } from '../api/storage';
import { getApiError } from '../api/client';
import { DEFAULT_EXPANDED_GROUPS } from '../api/settingsCategories';

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

  // Step 11 — collapsed groups persistence
  expandedGroups: Record<string, boolean>;
  hydrateExpandedGroups: () => Promise<void>;
  toggleGroup: (groupId: string, expanded: boolean) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;

  loadAll: () => Promise<void>;
  loadStats: () => Promise<void>;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => Promise<void>;
  /**
   * Step 2 — apply 1 app theme (seasonal/premium/custom). Trả về false nếu
   * theme chưa unlock (insufficient coins) → UI show toast.
   */
  setAppTheme: (id: ThemeId, coinsBalance?: number) => Promise<boolean>;
  saveProfile: (patch: UpdateProfileInput) => Promise<AuthUser>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

// ============================================================================
// Persistence helpers — Step 11
// ============================================================================

async function persistExpandedGroups(
  groups: Record<string, boolean>
): Promise<void> {
  try {
    await storage.setJSON(
      StorageKeys.SettingsExpandedGroups,
      groups
    );
  } catch {
    /* ignore */
  }
}

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
  expandedGroups: { ...DEFAULT_EXPANDED_GROUPS },

  // ============================================================================
  // Step 11 — expanded-groups actions
  // ============================================================================

  hydrateExpandedGroups: async () => {
    const stored = await storage.getJSON<Record<string, boolean>>(
      StorageKeys.SettingsExpandedGroups
    );
    if (!stored) return;
    set({
      expandedGroups: { ...DEFAULT_EXPANDED_GROUPS, ...stored },
    });
  },

  toggleGroup: (groupId, expanded) => {
    const next = { ...get().expandedGroups, [groupId]: expanded };
    set({ expandedGroups: next });
    persistExpandedGroups(next);
  },

  expandAllGroups: () => {
    const next = {
      GENERAL: true,
      PET: true,
      SOCIAL: true,
      ADVANCED: true,
    };
    set({ expandedGroups: next });
    persistExpandedGroups(next);
  },

  collapseAllGroups: () => {
    const next = {
      GENERAL: false,
      PET: false,
      SOCIAL: false,
      ADVANCED: false,
    };
    set({ expandedGroups: next });
    persistExpandedGroups(next);
  },

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

  setAppTheme: async (id, coinsBalance = 0) => {
    // Wallet gate cho premium themes. Nếu chưa đủ coin → reject.
    if (!isThemeUnlocked(id, coinsBalance)) {
      const e = getApiError({ status: 402, message: 'Insufficient coins to unlock theme' });
      set({ error: e.message });
      return false;
    }
    return get().updateSetting('appThemeId', id).then(() => true);
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