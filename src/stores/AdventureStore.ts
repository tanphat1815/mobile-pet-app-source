/**
 * AdventureStore (Zustand) — Step 12c
 *
 * Manages the adventure lifecycle:
 *  - currentAdventure / history / unlockedLocations / totalAdventures
 *  - startAdventure() → deducts energy, starts timer
 *  - completeAdventure() → grants rewards + XP
 *  - cancelAdventure() → no rewards
 *  - generateEncounter() / generateReward() → push events
 *
 * Auto-persists to AsyncStorage via storage helper.
 */

import { create } from 'zustand';
import { storage, StorageKeys } from '../api/storage';
import {
  LOCATIONS,
  ADVENTURE_STORAGE_KEYS,
  type AdventureSession,
  type AdventureHistoryEntry,
  type PetStats,
  canStartAdventure,
  generateEncounter,
  generateReward,
  computeXpEarned,
} from '../api/adventure';

// ============================================================================
// Types
// ============================================================================

export interface AdventureState {
  // Data
  currentAdventure: AdventureSession | null;
  history: AdventureHistoryEntry[];
  unlockedLocations: string[];
  totalAdventures: number;

  // In-memory flags
  eventCountdownSec: number; // countdown until next event (25s)
  isPolling: boolean;

  // ─── actions ───
  startAdventure: (
    locationId: string,
    petStats: PetStats
  ) => { success: boolean; error?: string };
  completeAdventure: (
    petStats: PetStats,
    onReward?: (xp: number, rewardCount: number, encounterCount: number) => void
  ) => { success: boolean; error?: string; xpEarned?: number };
  cancelAdventure: () => void;
  generateEncounterEvent: () => void;
  generateRewardEvent: () => void;
  tickCountdown: (deltaSec?: number) => void;
  checkCompletion: () => boolean;

  // Persistence
  hydrate: () => Promise<void>;
  reset: () => void;

  // Private helper
  _persist: () => Promise<void>;
}

const DEFAULT_UNLOCKED = ['park', 'beach', 'forest'];

// ============================================================================
// Store
// ============================================================================

export const useAdventureStore = create<AdventureState>((set, get) => ({
  currentAdventure: null,
  history: [],
  unlockedLocations: [...DEFAULT_UNLOCKED],
  totalAdventures: 0,
  eventCountdownSec: 25,
  isPolling: false,

  startAdventure(locationId, petStats) {
    const state = get();
    const check = canStartAdventure(
      locationId,
      petStats,
      'sunny', // default weather
      state.currentAdventure,
      state.unlockedLocations
    );
    if (!check.ok) return { success: false, error: check.reason };

    const location = LOCATIONS[locationId];
    const now = Date.now();
    const durationMs = location.duration * 60 * 1000;

    const session: AdventureSession = {
      locationId,
      locationName: location.displayName,
      locationEmoji: location.emoji,
      startedAt: now,
      endsAt: now + durationMs,
      durationMinutes: location.duration,
      energyCost: location.energyCost,
      rewards: [],
      encounters: [],
      status: 'active',
    };

    set({
      currentAdventure: session,
      eventCountdownSec: 25,
    });

    void get()._persist();
    return { success: true };
  },

  completeAdventure(petStats, onReward) {
    const { currentAdventure } = get();
    if (!currentAdventure || currentAdventure.status !== 'active') {
      return { success: false, error: 'Không có chuyến thám hiểm nào đang diễn ra' };
    }

    const now = Date.now();
    const rewards = currentAdventure.rewards;
    const encounters = currentAdventure.encounters;
    const xpEarned = computeXpEarned(15, rewards.length, encounters.length);

    const entry: AdventureHistoryEntry = {
      locationId: currentAdventure.locationId,
      locationName: currentAdventure.locationName,
      locationEmoji: currentAdventure.locationEmoji,
      startedAt: currentAdventure.startedAt,
      endedAt: now,
      rewards,
      encounters,
      xpEarned,
      success: true,
    };

    const updatedHistory = [entry, ...get().history].slice(0, 50);

    set({
      currentAdventure: { ...currentAdventure, status: 'completed' },
      history: updatedHistory,
      totalAdventures: get().totalAdventures + 1,
      eventCountdownSec: 25,
    });

    if (onReward) onReward(xpEarned, rewards.length, encounters.length);
    void get()._persist();
    return { success: true, xpEarned };
  },

  cancelAdventure() {
    const { currentAdventure } = get();
    if (!currentAdventure) return;

    const entry: AdventureHistoryEntry = {
      locationId: currentAdventure.locationId,
      locationName: currentAdventure.locationName,
      locationEmoji: currentAdventure.locationEmoji,
      startedAt: currentAdventure.startedAt,
      endedAt: Date.now(),
      rewards: [],
      encounters: currentAdventure.encounters,
      xpEarned: 0,
      success: false,
    };

    set({
      currentAdventure: null,
      history: [entry, ...get().history].slice(0, 50),
    });
    void get()._persist();
  },

  generateEncounterEvent() {
    const { currentAdventure } = get();
    if (!currentAdventure || currentAdventure.status !== 'active') return;
    const enc = generateEncounter(currentAdventure.locationId);
    if (!enc) return;

    set({
      currentAdventure: {
        ...currentAdventure,
        encounters: [...currentAdventure.encounters, enc],
      },
      eventCountdownSec: 25,
    });
    void get()._persist();
  },

  generateRewardEvent() {
    const { currentAdventure } = get();
    if (!currentAdventure || currentAdventure.status !== 'active') return;
    const reward = generateReward(currentAdventure.locationId);

    set({
      currentAdventure: {
        ...currentAdventure,
        rewards: [...currentAdventure.rewards, reward],
      },
      eventCountdownSec: 25,
    });
    void get()._persist();
  },

  tickCountdown(deltaSec = 1) {
    const { currentAdventure, eventCountdownSec } = get();
    if (!currentAdventure || currentAdventure.status !== 'active') return;

    const next = eventCountdownSec - deltaSec;

    // Auto-generate event every 25s
    if (next <= 0) {
      // Randomly choose encounter or reward (50/50)
      if (Math.random() > 0.5) {
        get().generateEncounterEvent();
      } else {
        get().generateRewardEvent();
      }
      set({ eventCountdownSec: 25 });
    } else {
      set({ eventCountdownSec: next });
    }
  },

  checkCompletion() {
    const { currentAdventure } = get();
    if (!currentAdventure || currentAdventure.status !== 'active') return false;
    return Date.now() >= currentAdventure.endsAt;
  },

  // ─── Persistence ───

  async hydrate() {
    try {
      const [rawCurrent, rawHistory, rawUnlocked, rawTotal] = await Promise.all([
        storage.getJSON<AdventureSession>(StorageKeys.AdventureCurrent),
        storage.getJSON<AdventureHistoryEntry[]>(StorageKeys.AdventureHistory),
        storage.getJSON<string[]>(StorageKeys.AdventureUnlocked),
        storage.getString(StorageKeys.AdventureCurrent),
      ]);

      if (rawUnlocked?.length) {
        set({ unlockedLocations: rawUnlocked });
      }

      // Check if current adventure has expired
      if (rawCurrent && rawCurrent.status === 'active') {
        if (Date.now() >= rawCurrent.endsAt) {
          // Auto-complete
          set({ currentAdventure: { ...rawCurrent, status: 'completed' } });
          await storage.setJSON(StorageKeys.AdventureCurrent, { ...rawCurrent, status: 'completed' });
        } else {
          set({ currentAdventure: rawCurrent });
        }
      }

      if (rawHistory?.length) {
        set({ history: rawHistory });
      }
    } catch {
      // ignore
    }
  },

  reset() {
    set({
      currentAdventure: null,
      history: [],
      unlockedLocations: [...DEFAULT_UNLOCKED],
      totalAdventures: 0,
      eventCountdownSec: 25,
      isPolling: false,
    });
  },

  _persist: async () => {
    try {
      const { currentAdventure, history, unlockedLocations, totalAdventures } = get();
      await Promise.all([
        storage.setJSON(StorageKeys.AdventureCurrent, currentAdventure),
        storage.setJSON(StorageKeys.AdventureHistory, history),
        storage.setJSON(StorageKeys.AdventureUnlocked, unlockedLocations),
      ]);
    } catch {
      // ignore
    }
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentAdventure = (s: AdventureState) => s.currentAdventure;
export const selectHistory = (s: AdventureState) => s.history;
export const selectIsOnAdventure = (s: AdventureState) =>
  !!s.currentAdventure && s.currentAdventure.status === 'active';
export const selectProgress = (s: AdventureState): number => {
  const adv = s.currentAdventure;
  if (!adv) return 0;
  const total = adv.durationMinutes * 60 * 1000;
  const elapsed = Math.max(0, Date.now() - adv.startedAt);
  return Math.min(1, elapsed / total);
};
export const selectRemainingSec = (s: AdventureState): number => {
  const adv = s.currentAdventure;
  if (!adv) return 0;
  return Math.max(0, Math.floor((adv.endsAt - Date.now()) / 1000));
};
