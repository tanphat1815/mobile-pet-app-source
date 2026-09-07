/**
 * Sprite Animation Manifest
 *
 * Port từ desktop `src/core/sprite-config.js` + Step 21 extended keys.
 * Cấu trúc giống manifest.json trong `assets/sprites/<species>/manifest.json`:
 *
 *   species: {
 *     <id>: {
 *       frameWidth/Height: size mỗi frame
 *       displayScale: scale khi render (mặc định 3 → 96x96)
 *       animations: {
 *         <animKey>: { src, frameCount, fps }
 *       }
 *       atlas: optional reference cho combined sprite sheet
 *     }
 *   }
 *
 * Step 3 (Animated pet sprite FSM) — xem docs/steps/step-03-animated-pet-sprite.md.
 */

import type { PetSpecies, PetMood } from './petTypes';

// ============================================================================
// Types
// ============================================================================

export interface SpriteAnimDef {
  /** Filename trong assets/sprites/<species>/ */
  src: string;
  /** Số frame trong animation */
  frameCount: number;
  /** Frame per second */
  fps: number;
}

export interface SpriteSpeciesDef {
  /** Kích thước 1 frame (square) */
  frameWidth: number;
  frameHeight: number;
  /** Scale khi hiển thị — desktop mặc định 3 (32×3 = 96px) */
  displayScale: number;
  /** Map animation key → definition */
  animations: Record<SpriteAnimKey, SpriteAnimDef>;
  /** Optional: combined sprite sheet filename */
  atlas?: string;
}

/**
 * 16 animation keys theo desktop Step 21. FSM sẽ resolve state → 1 trong các
 * key này. Nếu species không có key đó → fallback về 'idle'.
 */
export type SpriteAnimKey =
  | 'idle'
  | 'walk'
  | 'sleep'
  | 'sit'
  | 'dance'
  | 'shocked'
  | 'cry'
  | 'box_idle'
  | 'box_play'
  | 'box_sit'
  | 'jump'
  | 'happy'
  | 'excited'
  | 'hurt'
  | 'attack'
  | 'tickle'
  | 'eat'
  | 'drink'
  | 'wave'
  | 'dead1'
  | 'dead2';

/** Tất cả key mà FSM có thể resolve — dùng cho fallback chain. */
export const ALL_SPRITE_ANIM_KEYS: SpriteAnimKey[] = [
  'idle', 'walk', 'sleep', 'sit', 'dance', 'shocked', 'cry',
  'box_idle', 'box_play', 'box_sit', 'jump', 'happy', 'excited',
  'hurt', 'attack', 'tickle', 'eat', 'drink', 'wave', 'dead1', 'dead2',
];

// ============================================================================
// Species catalog
// ============================================================================

/**
 * Animation defaults mà mọi species chia sẻ. Override per-species nếu cần.
 * Spec đề xuất frameWidth=32, displayScale=3 → 96x96px render — giống desktop.
 */
const COMMON = {
  frameWidth: 32,
  frameHeight: 32,
  displayScale: 3,
} as const;

const COMMON_ANIMATIONS: Record<SpriteAnimKey, SpriteAnimDef> = {
  idle:      { src: 'idle.png',     frameCount: 10, fps: 6  },
  walk:      { src: 'walk.png',     frameCount: 10, fps: 10 },
  sleep:     { src: 'sleep.png',    frameCount: 4,  fps: 3  },
  sit:       { src: 'sit.png',      frameCount: 8,  fps: 6  },
  dance:     { src: 'dance.png',    frameCount: 8,  fps: 12 },
  shocked:   { src: 'shocked.png',  frameCount: 12, fps: 12 },
  cry:       { src: 'cry.png',      frameCount: 4,  fps: 4  },
  box_idle:  { src: 'box_idle.png', frameCount: 8,  fps: 6  },
  box_play:  { src: 'box_play.png', frameCount: 12, fps: 8  },
  box_sit:   { src: 'box_sit.png',  frameCount: 6,  fps: 6  },
  jump:      { src: 'jump.png',     frameCount: 6,  fps: 10 },
  happy:     { src: 'happy.png',    frameCount: 6,  fps: 10 },
  excited:   { src: 'excited.png',  frameCount: 8,  fps: 12 },
  hurt:      { src: 'hurt.png',     frameCount: 4,  fps: 6  },
  attack:    { src: 'attack.png',   frameCount: 6,  fps: 10 },
  tickle:    { src: 'tickle.png',   frameCount: 4,  fps: 8  },
  eat:       { src: 'eat.png',      frameCount: 6,  fps: 8  },
  drink:     { src: 'drink.png',    frameCount: 6,  fps: 8  },
  wave:      { src: 'wave.png',     frameCount: 6,  fps: 8  },
  dead1:     { src: 'dead1.png',    frameCount: 1,  fps: 1  },
  dead2:     { src: 'dead2.png',    frameCount: 1,  fps: 1  },
};

/**
 * Multi-species manifest. Hiện support 5 species từ PetSpecies enum (cat,
 * dog, fox, dragon, rabbit) — thêm blob sau.
 *
 * Khi load custom sprite (Step 33 desktop), có thể override qua runtime
 * resolution — chưa implement trong mobile step này.
 */
export const SPRITE_MANIFEST: Record<PetSpecies, SpriteSpeciesDef> = {
  cat: {
    ...COMMON,
    animations: COMMON_ANIMATIONS,
    atlas: 'cat.png',
  },
  dog: {
    ...COMMON,
    animations: COMMON_ANIMATIONS,
    atlas: 'dog.png',
  },
  fox: {
    ...COMMON,
    animations: COMMON_ANIMATIONS,
    atlas: 'fox.png',
  },
  dragon: {
    ...COMMON,
    animations: COMMON_ANIMATIONS,
    atlas: 'dragon.png',
  },
  rabbit: {
    ...COMMON,
    animations: COMMON_ANIMATIONS,
    atlas: 'rabbit.png',
  },
  blob: {
    ...COMMON,
    animations: COMMON_ANIMATIONS,
    atlas: 'blob.png',
  },
};

// ============================================================================
// Public API
// ============================================================================

/** Resolve URL cho 1 animation — chỗ sẽ wrap expo-asset require() khi có file. */
export function resolveAnimationAsset(
  species: PetSpecies,
  animKey: SpriteAnimKey
): { src: string; frameCount: number; fps: number } {
  const speciesDef = SPRITE_MANIFEST[species];
  if (!speciesDef) {
    return COMMON_ANIMATIONS.idle;
  }
  const anim = speciesDef.animations[animKey] ?? speciesDef.animations.idle;
  return anim;
}

/** Get species config (cho debug, e2e). */
export function getSpeciesConfig(species: PetSpecies): SpriteSpeciesDef {
  return SPRITE_MANIFEST[species] ?? SPRITE_MANIFEST.cat;
}

/**
 * List các animation keys có sẵn cho species (cho UI picker).
 */
export function listAvailableAnims(species: PetSpecies): SpriteAnimKey[] {
  const def = SPRITE_MANIFEST[species];
  return def ? (Object.keys(def.animations) as SpriteAnimKey[]) : ['idle'];
}

// ============================================================================
// Mood coupling (state machine hint)
// ============================================================================

/**
 * Map mood → preferred animation key. Step 3 FSM dùng cái này khi không
 * có explicit action.
 */
export function preferredAnimForMood(mood: PetMood): SpriteAnimKey {
  switch (mood) {
    case 'happy': return 'happy';
    case 'sad': return 'cry';
    case 'eating': return 'eat';
    case 'sleeping': return 'sleep';
    case 'playing': return 'box_play';
    case 'idle':
    default: return 'idle';
  }
}
