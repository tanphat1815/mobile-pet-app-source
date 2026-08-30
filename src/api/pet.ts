/**
 * Pet API Module
 *
 * Typed methods for pet endpoints. The real backend will live at
 * /pet and /pet/:action. For development we hit httpbin and synthesize
 * a mock pet state so the UI can be exercised.
 */

import apiClient, { getApiError } from './client';
import { getStoredToken } from './storage';
import { Pet, PetAction, PetActionResponse, defaultEmoji } from './petTypes';

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
    },
    updatedAt: Date.now(),
    emoji: '🐱',
  };
}

let mockPet: Pet = makeMockPet();

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function applyAction(pet: Pet, action: PetAction): Pet {
  const stats = { ...pet.stats };
  let mood: Pet['mood'] = pet.mood;
  let message = '';

  switch (action) {
    case 'feed':
      stats.hunger = clamp(stats.hunger + 30);
      stats.happiness = clamp(stats.happiness + 5);
      stats.xp += 15;
      mood = 'eating';
      message = 'Yum! 🍱';
      break;
    case 'play':
      stats.happiness = clamp(stats.happiness + 25);
      stats.energy = clamp(stats.energy - 15);
      stats.hunger = clamp(stats.hunger - 10);
      stats.xp += 20;
      mood = 'playing';
      message = 'Wheee! 🎉';
      break;
    case 'sleep':
      stats.energy = clamp(stats.energy + 40);
      stats.hunger = clamp(stats.hunger - 10);
      stats.xp += 5;
      mood = 'sleeping';
      message = 'Zzz... 💤';
      break;
    case 'pet':
      stats.happiness = clamp(stats.happiness + 10);
      stats.xp += 3;
      mood = 'happy';
      message = 'Purr... 💕';
      break;
  }

  // Level up: if xp exceeds threshold, reset and bump level
  let { level } = stats;
  let xp = stats.xp;
  const xpNeeded = Math.round(100 * Math.pow(level, 1.5));
  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level += 1;
  }
  stats.level = level;
  stats.xp = xp;

  return {
    ...pet,
    stats,
    mood,
    updatedAt: Date.now(),
  };
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
  try {
    await apiClient.post('/post', { action: `pet_${action}` });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
    // Network fallback for development: simulate action locally
  }
  mockPet = applyAction(mockPet, action);
  return { pet: { ...mockPet, emoji: mockPet.emoji ?? defaultEmoji(mockPet.species) }, message: undefined };
}

/**
 * Convenience helper: applies a pet action directly to a state object
 * (used for optimistic UI updates while the network request is in flight).
 */
export function applyLocalPetAction(pet: Pet, action: PetAction): Pet {
  return applyAction(pet, action);
}