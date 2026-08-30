/**
 * Pet Domain Types
 *
 * The shape of a pet as exposed by the API. Stats are normalized to
 * 0..100 for the display bars; xp is a positive integer that grows with
 * actions and contributes to leveling.
 */

export type PetSpecies = 'cat' | 'dog' | 'rabbit' | 'dragon' | 'fox' | 'blob';

export type PetMood =
  | 'happy'
  | 'sad'
  | 'eating'
  | 'sleeping'
  | 'playing'
  | 'idle';

export type PetAction = 'feed' | 'play' | 'sleep' | 'pet';

export interface PetStats {
  hunger: number; // 0..100 - lower means more hungry
  happiness: number; // 0..100 - higher means happier
  energy: number; // 0..100 - higher means more rested
  xp: number;
  level: number;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  mood: PetMood;
  stats: PetStats;
  /** Last update timestamp (ms since epoch) */
  updatedAt: number;
  /** Avatar URL or emoji (server returns one or the other) */
  avatarUrl?: string;
  emoji?: string;
}

export interface PetActionResponse {
  pet: Pet;
  /** Human-readable message to show in a toast */
  message?: string;
}

export const STAT_LABELS: Record<keyof PetStats, string> = {
  hunger: 'Hunger',
  happiness: 'Happiness',
  energy: 'Energy',
  xp: 'XP',
  level: 'Level',
};

export const STAT_RANGES: Record<keyof PetStats, { min: number; max: number; step: number }> = {
  hunger: { min: 0, max: 100, step: 1 },
  happiness: { min: 0, max: 100, step: 1 },
  energy: { min: 0, max: 100, step: 1 },
  xp: { min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
  level: { min: 1, max: 999, step: 1 },
};

/** XP required to advance from level N to N+1 */
export function xpForLevel(level: number): number {
  // Simple quadratic curve: 100 * level^1.5
  return Math.round(100 * Math.pow(level, 1.5));
}

/** XP progress within the current level (0..1) */
export function xpProgress(stats: PetStats): number {
  const currentLevelXp = xpForLevel(stats.level - 1);
  const nextLevelXp = xpForLevel(stats.level);
  const span = nextLevelXp - currentLevelXp;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (stats.xp - currentLevelXp) / span));
}

/** Returns the species default emoji when the server doesn't return one */
export function defaultEmoji(species: PetSpecies): string {
  switch (species) {
    case 'cat':
      return '🐱';
    case 'dog':
      return '🐶';
    case 'rabbit':
      return '🐰';
    case 'dragon':
      return '🐲';
    case 'fox':
      return '🦊';
    case 'blob':
      return '🟣';
  }
}