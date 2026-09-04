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

export type PetAction =
  | 'feed' | 'play' | 'sleep' | 'pet'
  // Step 10 — Pet Care actions
  | 'bath' | 'medicine' | 'vitamin';

export interface PetStats {
  hunger: number; // 0..100 - lower means more hungry
  happiness: number; // 0..100 - higher means happier
  energy: number; // 0..100 - higher means more rested
  xp: number;
  level: number;
  // Step 10 — additional care stats
  cleanliness: number; // 0..100 - higher means cleaner
  health: number;     // 0..100 - higher means healthier
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
  /**
   * Step 10 — cooldowns keyed by action. Used to drive the disabled
   * state of the action button. Stored as ms-since-epoch; compare
   * against Date.now() to compute remaining cooldown.
   */
  cooldowns?: Partial<Record<PetAction, number>>;
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
  cleanliness: 'Cleanliness',
  health: 'Health',
};

export const STAT_RANGES: Record<keyof PetStats, { min: number; max: number; step: number }> = {
  hunger: { min: 0, max: 100, step: 1 },
  happiness: { min: 0, max: 100, step: 1 },
  energy: { min: 0, max: 100, step: 1 },
  xp: { min: 0, max: Number.MAX_SAFE_INTEGER, step: 1 },
  level: { min: 1, max: 999, step: 1 },
  cleanliness: { min: 0, max: 100, step: 1 },
  health: { min: 0, max: 100, step: 1 },
};

// ============================================================================
// Step 10 — Pet Care Effects (port từ desktop src/core/pet-care.js)
// ============================================================================

export interface PetCareEffect {
  /** Stat deltas to apply (positive or negative). */
  stats?: Partial<Pick<PetStats, 'hunger' | 'happiness' | 'energy' | 'cleanliness' | 'health' | 'xp'>>;
  /** Optional mood set after the action. */
  mood?: PetMood;
  /** Cooldown duration in hours (0 = none). */
  cooldownHours?: number;
  /** Condition to enable the action; defaults to always available. */
  enabledWhen?: (stats: PetStats) => boolean;
  /** Reason for disabled state (used by UI). */
  disabledReason?: string;
  /** Action-specific message for toast. */
  message?: string;
  /** XP reward for the action. */
  xpReward?: number;
}

/**
 * PetCareEffects — declarative table of stat deltas per action.
 * Mirrors the structure used by desktop `interaction-actions.js`.
 */
export const PET_CARE_EFFECTS: Record<PetAction, PetCareEffect> = {
  feed: {
    stats: { hunger: +30, happiness: +5 },
    mood: 'eating',
    xpReward: 15,
    message: 'Yum! 🍱',
  },
  play: {
    stats: { happiness: +25, energy: -15, hunger: -10 },
    mood: 'playing',
    xpReward: 20,
    message: 'Wheee! 🎉',
  },
  sleep: {
    stats: { energy: +40, hunger: -10 },
    mood: 'sleeping',
    xpReward: 5,
    message: 'Zzz... 💤',
  },
  pet: {
    stats: { happiness: +10 },
    mood: 'happy',
    xpReward: 3,
    message: 'Purr... 💕',
  },
  // Step 10 — Care actions
  bath: {
    stats: { cleanliness: +40, happiness: +5, energy: -2 },
    mood: 'happy',
    xpReward: 8,
    cooldownHours: 8,
    message: 'Squeaky clean! 🛁',
  },
  medicine: {
    stats: { health: +50, happiness: -3 },
    mood: 'happy',
    xpReward: 5,
    cooldownHours: 0,
    enabledWhen: (s) => s.health < 70,
    disabledReason: 'Pet is healthy enough',
    message: 'Feeling better! 💊',
  },
  vitamin: {
    stats: { energy: +15, happiness: +5 },
    mood: 'happy',
    xpReward: 6,
    cooldownHours: 6,
    message: 'Energized! 🌿',
  },
};

/**
 * Returns the care-effect metadata for an action.
 */
export function getCareEffect(action: PetAction): PetCareEffect {
  return PET_CARE_EFFECTS[action];
}

/**
 * Compute remaining cooldown for an action (in ms). Returns 0 if the
 * action is ready.
 */
export function cooldownRemaining(
  pet: Pet | null,
  action: PetAction,
  now: number = Date.now()
): number {
  const lastUsedAt = pet?.cooldowns?.[action];
  if (!lastUsedAt) return 0;
  const effect = PET_CARE_EFFECTS[action];
  if (!effect.cooldownHours) return 0;
  const elapsed = now - lastUsedAt;
  const totalMs = effect.cooldownHours * 60 * 60 * 1000;
  return Math.max(0, totalMs - elapsed);
}

/**
 * Returns true if the action is available (no cooldown + enabled by
 * precondition).
 */
export function isActionAvailable(pet: Pet | null, action: PetAction): boolean {
  if (cooldownRemaining(pet, action) > 0) return false;
  const effect = PET_CARE_EFFECTS[action];
  if (effect.enabledWhen && pet && !effect.enabledWhen(pet.stats)) {
    return false;
  }
  return true;
}

/**
 * Disable-reason: cooldown vs. precondition (e.g. medicine only when
 * sick). Returns the human-readable reason for the disabled state.
 */
export function actionDisabledReason(
  pet: Pet | null,
  action: PetAction
): string | null {
  if (cooldownRemaining(pet, action) > 0) {
    return `On cooldown`;
  }
  const effect = PET_CARE_EFFECTS[action];
  if (effect.enabledWhen && pet && !effect.enabledWhen(pet.stats)) {
    return effect.disabledReason ?? 'Not available';
  }
  return null;
}

/**
 * Format cooldown remaining as a compact human string (e.g. "2h", "30m",
 * "10s"). Returns empty string when ready.
 */
export function cooldownLabel(remainingMs: number): string {
  if (remainingMs <= 0) return '';
  const sec = Math.floor(remainingMs / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h${min % 60 > 0 ? ` ${min % 60}m` : ''}`;
}

/**
 * Apply a PetCareEffect to a Pet's stats and return a new Pet.
 * Handles clamping, XP/level rollup, mood change, and cooldown.
 */
export function applyCareEffect(pet: Pet, action: PetAction, now: number = Date.now()): Pet {
  const effect = PET_CARE_EFFECTS[action];
  const stats = { ...pet.stats };
  for (const [k, delta] of Object.entries(effect.stats ?? {})) {
    const key = k as keyof PetStats;
    const range = STAT_RANGES[key];
    if (!range || typeof stats[key] !== 'number') continue;
    const current = stats[key] as number;
    const next = Math.max(range.min, Math.min(range.max, current + delta));
    (stats as Record<string, number>)[key] = next;
  }
  // XP / level rollup
  if (effect.xpReward) {
    stats.xp += effect.xpReward;
  }
  let { level } = stats;
  let xp = stats.xp;
  const xpNeeded = Math.round(100 * Math.pow(level, 1.5));
  while (xp >= xpNeeded) {
    xp -= xpNeeded;
    level += 1;
  }
  stats.xp = xp;
  stats.level = level;
  // Cooldown
  const cooldowns: Record<string, number> = { ...(pet.cooldowns ?? {}) };
  if (effect.cooldownHours && effect.cooldownHours > 0) {
    cooldowns[action] = now;
  }
  return {
    ...pet,
    stats,
    mood: effect.mood ?? pet.mood,
    updatedAt: now,
    cooldowns: cooldowns as Pet['cooldowns'],
  };
}

/** XP required to advance from level N to N+1 */
export function xpForLevel(level: number): number {
  // Simple quadratic curve: 100 * level^1.5
  return Math.round(100 * Math.pow(level, 1.5));
}

// ============================================================================
// Dev expose (Step 10) — e2e tests
// ============================================================================
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__PET_CARE_EFFECTS__ = PET_CARE_EFFECTS;
  (globalThis as any).__PET_CARE_EFFECTS_COUNT__ = Object.keys(PET_CARE_EFFECTS).length;
  (globalThis as any).__PET_CARE_ACTIONS__ = Object.keys(PET_CARE_EFFECTS);
  (globalThis as any).__PET_CARE_GET_EFFECT__ = getCareEffect;
  (globalThis as any).__PET_CARE_APPLY__ = applyCareEffect;
  (globalThis as any).__PET_CARE_COOLDOWN_REMAINING__ = cooldownRemaining;
  (globalThis as any).__PET_CARE_IS_AVAILABLE__ = isActionAvailable;
  (globalThis as any).__PET_CARE_DISABLED_REASON__ = actionDisabledReason;
  (globalThis as any).__PET_CARE_COOLDOWN_LABEL__ = cooldownLabel;
  (globalThis as any).__PET_CARE_COOLDOWN_HOURS__ = (action: PetAction) =>
    PET_CARE_EFFECTS[action]?.cooldownHours ?? 0;
  if (typeof window !== 'undefined') {
    (window as any).__PET_CARE_EFFECTS__ = (globalThis as any).__PET_CARE_EFFECTS__;
    (window as any).__PET_CARE_EFFECTS_COUNT__ = (globalThis as any).__PET_CARE_EFFECTS_COUNT__;
    (window as any).__PET_CARE_ACTIONS__ = (globalThis as any).__PET_CARE_ACTIONS__;
    (window as any).__PET_CARE_GET_EFFECT__ = (globalThis as any).__PET_CARE_GET_EFFECT__;
    (window as any).__PET_CARE_APPLY__ = (globalThis as any).__PET_CARE_APPLY__;
    (window as any).__PET_CARE_COOLDOWN_REMAINING__ = (globalThis as any).__PET_CARE_COOLDOWN_REMAINING__;
    (window as any).__PET_CARE_IS_AVAILABLE__ = (globalThis as any).__PET_CARE_IS_AVAILABLE__;
    (window as any).__PET_CARE_DISABLED_REASON__ = (globalThis as any).__PET_CARE_DISABLED_REASON__;
    (window as any).__PET_CARE_COOLDOWN_LABEL__ = (globalThis as any).__PET_CARE_COOLDOWN_LABEL__;
    (window as any).__PET_CARE_COOLDOWN_HOURS__ = (globalThis as any).__PET_CARE_COOLDOWN_HOURS__;
  }
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