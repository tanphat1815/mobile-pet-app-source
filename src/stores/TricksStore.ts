/**
 * TricksStore (Zustand) — Step 12e
 *
 * Pet training system:
 *  - learned tricks + training session + treats
 *  - learnTrick / practiceTrick / performTrick / parseCommand
 *  - All mutations go through pure helpers in api/tricks.ts
 *
 * Auto-persists to AsyncStorage.
 */

import { create } from 'zustand';
import { storage, StorageKeys } from '../api/storage';
import {
  ensureTricksStructure,
  getAvailableTricks,
  getLearnedTricks,
  learnTrick,
  practiceTrick,
  performTrick,
  parseCommand,
  PERFORM_COOLDOWN_MS,
  MAX_TREATS,
  type AvailableTrick,
  type LearnedTrick,
  type LifeStage,
  type PetStatsWithTricks,
  type PracticeResult,
  type PerformResult,
  type TrickDef,
  type TricksState,
} from '../api/tricks';

// ============================================================================
// Types
// ============================================================================

export interface PetState {
  // Stats
  petStats: PetStatsWithTricks;
  currentStage: LifeStage;
  personality: { obedience?: number; energy?: number; affection?: number };

  // Cached
  learnedTricks: (TrickDef & LearnedTrick)[];
  availableTricks: AvailableTrick[];

  // ─── actions ───
  setPetStats: (next: Partial<PetStatsWithTricks>) => void;
  setStage: (stage: LifeStage) => void;
  setPersonality: (next: Partial<PetState['personality']>) => void;

  learnTrickAction: (trickId: string) => { success: boolean; error?: string; message?: string };
  practiceTrickAction: (trickId: string, useTreat?: boolean) => PracticeResult;
  performTrickAction: (trickId: string) => PerformResult;
  performCommandAction: (command: string) => PerformResult | { success: false; error: string; message: string };

  cancelTraining: () => void;
  addTreats: (n: number) => void;
  reset: () => void;

  // Persistence
  hydrate: () => Promise<void>;
  _persist: () => Promise<void>;
}

const DEFAULT_PET: PetStatsWithTricks = {
  level: 5,
  energy: 80,
  tricks: {
    learned: [],
    training: null,
    lastTrickAt: 0,
    totalTricksPerformed: 0,
  },
  trainingStats: {
    treatsUsed: 5,
    trainingSessionsToday: 0,
  },
};

// ============================================================================
// Store
// ============================================================================

export const useTricksStore = create<PetState>((set, get) => ({
  petStats: { ...DEFAULT_PET },
  currentStage: 'YOUNG',
  personality: { obedience: 70, energy: 70, affection: 80 },

  learnedTricks: [],
  availableTricks: [],

  // ─── mutators ───
  setPetStats(next) {
    set((s) => {
      const merged = { ...s.petStats, ...next };
      ensureTricksStructure(merged);
      return {
        petStats: merged,
        learnedTricks: getLearnedTricks(merged),
        availableTricks: getAvailableTricks(merged, s.currentStage),
      };
    });
    void get()._persist();
  },

  setStage(stage) {
    set((s) => ({
      currentStage: stage,
      availableTricks: getAvailableTricks(s.petStats, stage),
    }));
  },

  setPersonality(next) {
    set((s) => ({ personality: { ...s.personality, ...next } }));
  },

  learnTrickAction(trickId) {
    const state = get();
    const stats = { ...state.petStats, tricks: { ...state.petStats.tricks! } };
    // Use a mutable copy for the helper
    const mutable: PetStatsWithTricks = JSON.parse(JSON.stringify(stats));
    ensureTricksStructure(mutable);
    const result = learnTrick(trickId, mutable, state.currentStage);
    if (result.success) {
      set({
        petStats: mutable,
        learnedTricks: getLearnedTricks(mutable),
        availableTricks: getAvailableTricks(mutable, state.currentStage),
      });
      void get()._persist();
    }
    return result;
  },

  practiceTrickAction(trickId, useTreat = false) {
    const state = get();
    const mutable: PetStatsWithTricks = JSON.parse(JSON.stringify(state.petStats));
    ensureTricksStructure(mutable);
    const result = practiceTrick(trickId, useTreat, mutable, state.personality);
    set({
      petStats: mutable,
      learnedTricks: getLearnedTricks(mutable),
      availableTricks: getAvailableTricks(mutable, state.currentStage),
    });
    void get()._persist();
    return result;
  },

  performTrickAction(trickId) {
    const state = get();
    const mutable: PetStatsWithTricks = JSON.parse(JSON.stringify(state.petStats));
    ensureTricksStructure(mutable);
    const result = performTrick(trickId, mutable);
    set({
      petStats: mutable,
      learnedTricks: getLearnedTricks(mutable),
    });
    void get()._persist();
    return result;
  },

  performCommandAction(command) {
    const state = get();
    const mutable: PetStatsWithTricks = JSON.parse(JSON.stringify(state.petStats));
    ensureTricksStructure(mutable);
    const result = parseCommand(command, mutable);
    set({
      petStats: mutable,
      learnedTricks: getLearnedTricks(mutable),
    });
    void get()._persist();
    return result;
  },

  cancelTraining() {
    set((s) => {
      const stats = { ...s.petStats };
      if (stats.tricks) stats.tricks = { ...stats.tricks, training: null };
      return { petStats: stats };
    });
    void get()._persist();
  },

  addTreats(n) {
    set((s) => {
      const stats = { ...s.petStats };
      if (stats.trainingStats) {
        stats.trainingStats = {
          ...stats.trainingStats,
          treatsUsed: Math.max(0, Math.min(MAX_TREATS, (stats.trainingStats.treatsUsed || 0) + n)),
        };
      }
      return { petStats: stats };
    });
    void get()._persist();
  },

  reset() {
    set({
      petStats: { ...DEFAULT_PET },
      currentStage: 'YOUNG',
      learnedTricks: [],
      availableTricks: getAvailableTricks(DEFAULT_PET, 'YOUNG'),
    });
  },

  // ─── persistence ───

  async hydrate() {
    try {
      const raw = await storage.getJSON<{ petStats?: PetStatsWithTricks; currentStage?: LifeStage }>(
        StorageKeys.TricksState
      );
      if (raw?.petStats) {
        const stats = { ...DEFAULT_PET, ...raw.petStats };
        ensureTricksStructure(stats);
        const stage = raw.currentStage ?? 'YOUNG';
        set({
          petStats: stats,
          currentStage: stage,
          learnedTricks: getLearnedTricks(stats),
          availableTricks: getAvailableTricks(stats, stage),
        });
      } else {
        // populate cached arrays for default state
        set({
          learnedTricks: getLearnedTricks(DEFAULT_PET),
          availableTricks: getAvailableTricks(DEFAULT_PET, 'YOUNG'),
        });
      }
    } catch {
      // ignore
    }
  },

  _persist: async () => {
    try {
      const { petStats, currentStage } = get();
      await storage.setJSON(StorageKeys.TricksState, { petStats, currentStage });
    } catch {
      // ignore
    }
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentTraining = (s: PetState) => s.petStats.tricks?.training ?? null;
export const selectLearned = (s: PetState) => s.learnedTricks;
export const selectAvailable = (s: PetState) => s.availableTricks;
export const selectTreats = (s: PetState) => s.petStats.trainingStats?.treatsUsed ?? 0;
export const selectTotalPerformed = (s: PetState) => s.petStats.tricks?.totalTricksPerformed ?? 0;

export function selectCooldownRemaining(s: PetState): number {
  const last = s.petStats.tricks?.lastTrickAt ?? 0;
  if (!last) return 0;
  const elapsed = Date.now() - last;
  return Math.max(0, PERFORM_COOLDOWN_MS - elapsed);
}
