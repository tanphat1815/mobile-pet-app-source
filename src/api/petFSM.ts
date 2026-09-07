/**
 * Pet FSM — resolve action/mood/stats → sprite animation key.
 *
 * Port từ desktop `src/core/pet-engine.js` Step 21+ với bổ sung mood coupling.
 * Priority chain:
 *   1. Explicit action (feed/play/sleep/pet)
 *   2. Critical stats (energy < 20 → sleep, hunger > 80 → cry, …)
 *   3. Mood override (ecstatic → dance, excited → excited, shocked → shocked)
 *   4. Default idle
 *
 * Step 3 — xem docs/steps/step-03-animated-pet-sprite.md.
 */

import {
  ALL_SPRITE_ANIM_KEYS,
  preferredAnimForMood,
  SpriteAnimKey,
} from './spriteConfig';
import type { Pet, PetAction, PetMood } from './petTypes';

// ============================================================================
// Expanded mood (thêm ecstatic/excited/shocked cho FSM mạnh hơn)
// ============================================================================

export type ExtendedMood =
  | PetMood
  | 'ecstatic'
  | 'excited'
  | 'shocked'
  | 'dead';

// ============================================================================
// FSM input
// ============================================================================

export interface FSMInput {
  /** Explicit user action (nếu có) — ưu tiên cao nhất */
  action?: PetAction;
  /** Pet mood hiện tại (Pet.mood hoặc extended mood) */
  mood: PetMood | ExtendedMood;
  /** Pet stats */
  hunger: number;     // 0..100 — 0 = no food, 100 = full
  happiness: number;  // 0..100 — 100 = happy
  energy: number;     // 0..100 — 0 = exhausted
  health: number;     // 0..100 — 0 = dead
}

// ============================================================================
// Resolver
// ============================================================================

/**
 * Resolve FSM input → animation key. Logic:
 *   1. Action overrides (nếu có explicit action)
 *   2. Critical stats:
 *      - health == 0  → dead1
 *      - energy < 20  → sleep
 *      - hunger > 80  → cry (đói)
 *      - happiness < 25 → sit (buồn)
 *   3. Mood overrides:
 *      - ecstatic → dance
 *      - excited → excited
 *      - shocked → shocked
 *      - other → preferredAnimForMood()
 *   4. Fallback: idle
 */
export function resolveAnimation(input: FSMInput): SpriteAnimKey {
  // 1. Explicit action
  if (input.action) {
    switch (input.action) {
      case 'feed':  return 'eat';
      case 'play':  return 'box_play';
      case 'sleep': return 'sleep';
      case 'pet':   return 'happy';
      default:
        return 'idle';
    }
  }

  // 2. Critical stats
  if (input.health === 0) return 'dead1';
  if (input.energy < 20) return 'sleep';
  if (input.hunger > 80) return 'cry';
  if (input.happiness < 25) return 'sit';

  // 3. Mood overrides
  switch (input.mood) {
    case 'ecstatic': return 'dance';
    case 'excited':  return 'excited';
    case 'shocked':  return 'shocked';
    case 'happy':    return 'happy';
    case 'sad':      return 'cry';
    case 'eating':   return 'eat';
    case 'sleeping': return 'sleep';
    case 'playing':  return 'box_play';
    case 'idle':
    default:
      return preferredAnimForMood(input.mood as PetMood);
  }
}

/**
 * Convenience wrapper — build FSMInput từ Pet object + optional action.
 */
export function resolvePetAnimation(
  pet: Pet | null,
  action?: PetAction
): SpriteAnimKey {
  if (!pet) return 'idle';
  return resolveAnimation({
    action,
    mood: pet.mood,
    hunger: pet.stats.hunger,
    happiness: pet.stats.happiness,
    energy: pet.stats.energy,
    health: 100, // PetStats chưa có health field — assume healthy (sang Step 10 sẽ mở rộng)
  });
}

/**
 * Validate animation key có tồn tại trong manifest. Dùng cho fallback chain
 * khi 1 species không có animation key nhất định.
 */
export function isValidAnimKey(key: string): key is SpriteAnimKey {
  return (ALL_SPRITE_ANIM_KEYS as string[]).includes(key);
}

/**
 * Resolve với fallback chain. Thử resolvePetAnimation → nếu species không
 * có key đó → thử key tiếp theo (priority chain từ animated cho đến idle).
 */
const FALLBACK_CHAIN: SpriteAnimKey[] = [
  'idle', 'walk', 'sleep', 'sit', 'dance', 'shocked', 'cry',
  'box_idle', 'box_play', 'box_sit', 'jump', 'happy', 'excited',
  'hurt', 'attack', 'tickle', 'eat', 'drink', 'wave', 'dead1', 'dead2',
];

export function resolvePetAnimationWithFallback(
  pet: Pet | null,
  hasAnim: (key: SpriteAnimKey) => boolean,
  action?: PetAction
): SpriteAnimKey {
  const primary = resolvePetAnimation(pet, action);
  if (hasAnim(primary)) return primary;
  for (const fallback of FALLBACK_CHAIN) {
    if (hasAnim(fallback)) return fallback;
  }
  return 'idle';
}
