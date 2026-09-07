/**
 * Pet API Module
 *
 * Typed methods for pet endpoints. The real backend will live at
 * /pet and /pet/:action. For development we hit httpbin and synthesize
 * a mock pet state so the UI can be exercised.
 */

import apiClient, { getApiError } from './client';
import { getStoredToken } from './storage';
import {
  Pet,
  PetAction,
  PetActionResponse,
  defaultEmoji,
  applyCareEffect,
  cooldownRemaining,
  getCareEffect,
} from './petTypes';

// ============================================================================
// Mock state (development only)
// ============================================================================

function makeMockPet(): Pet {
  return {
    id: 'pet_demo',
    ownerId: 'dev_user',
    name: 'Mochi',
    species: 'cat',
    mood: 'happy',
    stats: {
      hunger: 70,
      happiness: 80,
      energy: 60,
      xp: 245,
      level: 3,
      cleanliness: 50,
      health: 85,
    },
    cooldowns: {},
    updatedAt: Date.now(),
    emoji: '🐱',
  };
}

let mockPet: Pet = makeMockPet();

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function applyAction(pet: Pet, action: PetAction): Pet {
  // Step 10 — Use the unified applyCareEffect helper so the mock
  // server, optimistic UI updates, and effects table all agree.
  return applyCareEffect(pet, action);
}

// ============================================================================
// API methods
// ============================================================================

export async function getPet(): Promise<Pet> {
  try {
    await apiClient.get('/get', { params: { action: 'get_pet' } });
    return { ...mockPet, emoji: mockPet.emoji ?? defaultEmoji(mockPet.species) };
  } catch (err) {
    const e = getApiError(err);
    if (e.status === 0) {
      // Network fallback for development
      return { ...mockPet, emoji: mockPet.emoji ?? defaultEmoji(mockPet.species) };
    }
    throw err;
  }
}

export async function performPetAction(action: PetAction): Promise<PetActionResponse> {
  // Step 10 — Validate cooldown + precondition before calling the API.
  const remaining = cooldownRemaining(mockPet, action);
  if (remaining > 0) {
    throw new Error(`Action is on cooldown (${Math.ceil(remaining / 1000)}s remaining)`);
  }
  const effect = getCareEffect(action);
  if (effect.enabledWhen && !effect.enabledWhen(mockPet.stats)) {
    throw new Error(effect.disabledReason ?? 'Action is not available right now');
  }
  try {
    await apiClient.post('/post', { action: `pet_${action}` });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
    // Network fallback for development: simulate action locally
  }
  mockPet = applyAction(mockPet, action);
  return {
    pet: { ...mockPet, emoji: mockPet.emoji ?? defaultEmoji(mockPet.species) },
    message: effect.message,
  };
}

/**
 * Convenience helper: applies a pet action directly to a state object
 * (used for optimistic UI updates while the network request is in flight).
 */
export function applyLocalPetAction(pet: Pet, action: PetAction): Pet {
  return applyAction(pet, action);
}

/**
 * Step 10 — Reset mock state (used by tests / debug panel).
 */
export function resetMockPet(): void {
  mockPet = makeMockPet();
}

/**
 * Step 10 — Get / set the mock pet's stats directly (used by
 * Playwright tests + debug panels).
 */
export function getMockPet(): Pet {
  return { ...mockPet };
}

export function setMockStat<K extends keyof Pet['stats']>(
  key: K,
  value: Pet['stats'][K]
): void {
  mockPet = {
    ...mockPet,
    stats: { ...mockPet.stats, [key]: value },
  };
}