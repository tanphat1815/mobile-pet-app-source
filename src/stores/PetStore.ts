/**
 * PetStore (Zustand)
 *
 * Holds the current pet state + load/action lifecycle.
 * Subscribes to `pet:update` and `pet:mood` realtime events from the
 * SyncManager so the UI updates instantly when the server pushes changes.
 */

import { create } from 'zustand';
import { getPet, performPetAction } from '../api/pet';
import {
  Pet,
  PetAction,
  defaultEmoji,
  applyCareEffect,
} from '../api/petTypes';
import type { PetUpdateEvent, PetMoodEvent } from '../api/syncTypes';
import { useSyncEvent } from './SyncStore';

// ============================================================================
// Types
// ============================================================================

export type PetLoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PetState {
  pet: Pet | null;
  status: PetLoadStatus;
  error: string | null;
  /** action -> pending */
  pendingActions: Set<PetAction>;
  lastUpdatedAt: number | null;

  // Actions
  load: () => Promise<void>;
  performAction: (action: PetAction) => Promise<void>;
  applyRealtimeUpdate: (stats?: Partial<PetUpdateEvent['stats']>, mood?: PetMoodEvent['mood']) => void;
  clearError: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const usePetStore = create<PetState>((set, get) => ({
  pet: null,
  status: 'idle',
  error: null,
  pendingActions: new Set(),
  lastUpdatedAt: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const pet = await getPet();
      set({
        pet: { ...pet, emoji: pet.emoji ?? defaultEmoji(pet.species) },
        status: 'ready',
        error: null,
        lastUpdatedAt: pet.updatedAt,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load pet';
      set({ status: 'error', error: msg });
    }
  },

  performAction: async (action: PetAction) => {
    const { pet, pendingActions } = get();
    if (pendingActions.has(action)) return;
    if (!pet) {
      await get().load();
    }
    const petNow = get().pet;
    if (!petNow) return;

    // Step 10 — Pre-check cooldown + precondition so we fail fast
    // and don't even apply an optimistic update.
    const { isActionAvailable, actionDisabledReason } = await import('../api/petTypes');
    if (!isActionAvailable(petNow, action)) {
      const reason = actionDisabledReason(petNow, action) ?? 'Not available';
      set({ error: reason });
      return;
    }

    // Optimistic update: apply the action locally for instant feedback
    const optimisticPet = applyActionLocally(petNow, action);

    const next = new Set(pendingActions);
    next.add(action);
    set({ pendingActions: next, pet: optimisticPet });

    try {
      const res = await performPetAction(action);
      set({
        pet: res.pet,
        lastUpdatedAt: res.pet.updatedAt,
        pendingActions: removeFromSet(get().pendingActions, action),
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to ${action}`;
      // Roll back optimistic update to the pre-action pet
      set({
        pet: petNow,
        pendingActions: removeFromSet(get().pendingActions, action),
        error: msg,
      });
    }
  },

  applyRealtimeUpdate: (stats, mood) => {
    const { pet } = get();
    if (!pet) return;
    set({
      pet: {
        ...pet,
        stats: { ...pet.stats, ...(stats ?? {}) },
        mood: mood ?? pet.mood,
        updatedAt: Date.now(),
      },
      lastUpdatedAt: Date.now(),
    });
  },

  clearError: () => set({ error: null }),
}));

// ============================================================================
// Helpers
// ============================================================================

function removeFromSet(set: Set<PetAction>, action: PetAction): Set<PetAction> {
  const next = new Set(set);
  next.delete(action);
  return next;
}

function applyActionLocally(pet: Pet | null, action: PetAction): Pet | null {
  if (!pet) return pet;
  // Step 10 — Delegate to the unified applyCareEffect helper so the
  // local mock and the UI stay in sync.
  return applyCareEffect(pet, action);
}

// Dev helpers đã chuyển sang PetSpriteDebugProvider (root-mount).
// ============================================================================
// Hook: subscribes to pet:update / pet:mood and pipes into store
// ============================================================================

/**
 * Mount inside the app once. Wires the SyncManager events into
 * PetStore.applyRealtimeUpdate so realtime pushes update the UI
 * automatically.
 */
export function usePetRealtimeSync(): void {
  const apply = usePetStore((s) => s.applyRealtimeUpdate);

  useSyncEvent('pet:update', (payload) => {
    apply(payload.stats);
  });
  useSyncEvent('pet:mood', (payload) => {
    apply(undefined, payload.mood);
  });
}