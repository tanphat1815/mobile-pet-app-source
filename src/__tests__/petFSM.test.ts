/**
 * Sprite Config + FSM Tests
 *
 * Verify:
 *  - 6 species declared với animation manifest đầy đủ (21 keys)
 *  - resolveAnimationAsset fallback chain
 *  - resolvePetAnimation cho action explicit
 *  - resolvePetAnimation cho critical stats (energy/hunger/happiness)
 *  - resolvePetAnimation cho mood coupling
 *  - preferredAnimForMood map đúng
 *
 * Step 3 — xem docs/steps/step-03-animated-pet-sprite.md.
 */

import { describe, it, expect } from 'vitest';
import {
  SPRITE_MANIFEST,
  ALL_SPRITE_ANIM_KEYS,
  preferredAnimForMood,
  resolveAnimationAsset,
  getSpeciesConfig,
  listAvailableAnims,
} from '@/api/spriteConfig';
import {
  resolveAnimation,
  resolvePetAnimation,
  resolvePetAnimationWithFallback,
  isValidAnimKey,
} from '@/api/petFSM';
import type { Pet, PetSpecies } from '@/api/petTypes';

const SPECIES_LIST: PetSpecies[] = ['cat', 'dog', 'fox', 'dragon', 'rabbit', 'blob'];

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    ownerId: 'u1',
    name: 'TestPet',
    species: 'cat',
    mood: 'idle',
    stats: { hunger: 50, happiness: 50, energy: 50, xp: 0, level: 1 },
    updatedAt: Date.now(),
    emoji: '🐱',
    ...overrides,
  };
}

describe('SPRITE_MANIFEST', () => {
  it('declares all 6 species', () => {
    for (const s of SPECIES_LIST) {
      expect(SPRITE_MANIFEST[s]).toBeDefined();
    }
  });

  it('each species has 21 animation keys', () => {
    for (const s of SPECIES_LIST) {
      expect(Object.keys(SPRITE_MANIFEST[s].animations)).toHaveLength(21);
    }
  });

  it('all 21 FSM keys exist across all species', () => {
    for (const s of SPECIES_LIST) {
      for (const key of ALL_SPRITE_ANIM_KEYS) {
        expect(SPRITE_MANIFEST[s].animations[key]).toBeDefined();
        expect(SPRITE_MANIFEST[s].animations[key].frameCount).toBeGreaterThan(0);
      }
    }
  });

  it('common frame size 32x32', () => {
    for (const s of SPECIES_LIST) {
      expect(SPRITE_MANIFEST[s].frameWidth).toBe(32);
      expect(SPRITE_MANIFEST[s].frameHeight).toBe(32);
    }
  });
});

describe('resolveAnimationAsset', () => {
  it('returns animation def cho species + key', () => {
    const result = resolveAnimationAsset('cat', 'idle');
    expect(result.frameCount).toBeGreaterThan(0);
    expect(result.fps).toBeGreaterThan(0);
    expect(result.src).toBe('idle.png');
  });

  it('getSpeciesConfig fallback to cat', () => {
    // @ts-expect-error testing invalid species
    const cfg = getSpeciesConfig('unicorn');
    expect(cfg).toBe(SPRITE_MANIFEST.cat);
  });

  it('listAvailableAnims returns 21 keys', () => {
    const anims = listAvailableAnims('dragon');
    expect(anims).toHaveLength(21);
  });
});

describe('preferredAnimForMood', () => {
  it('happy → happy', () => {
    expect(preferredAnimForMood('happy')).toBe('happy');
  });
  it('sad → cry', () => {
    expect(preferredAnimForMood('sad')).toBe('cry');
  });
  it('eating → eat', () => {
    expect(preferredAnimForMood('eating')).toBe('eat');
  });
  it('sleeping → sleep', () => {
    expect(preferredAnimForMood('sleeping')).toBe('sleep');
  });
  it('playing → box_play', () => {
    expect(preferredAnimForMood('playing')).toBe('box_play');
  });
  it('idle → idle', () => {
    expect(preferredAnimForMood('idle')).toBe('idle');
  });
});

describe('resolveAnimation — action overrides', () => {
  it('feed → eat', () => {
    expect(resolveAnimation({ action: 'feed', mood: 'idle', hunger: 50, happiness: 50, energy: 50, health: 100 })).toBe('eat');
  });
  it('play → box_play', () => {
    expect(resolveAnimation({ action: 'play', mood: 'idle', hunger: 50, happiness: 50, energy: 50, health: 100 })).toBe('box_play');
  });
  it('sleep → sleep', () => {
    expect(resolveAnimation({ action: 'sleep', mood: 'idle', hunger: 50, happiness: 50, energy: 50, health: 100 })).toBe('sleep');
  });
  it('pet → happy', () => {
    expect(resolveAnimation({ action: 'pet', mood: 'idle', hunger: 50, happiness: 50, energy: 50, health: 100 })).toBe('happy');
  });
});

describe('resolveAnimation — critical stats', () => {
  it('energy < 20 → sleep', () => {
    expect(resolveAnimation({ mood: 'idle', hunger: 50, happiness: 50, energy: 10, health: 100 })).toBe('sleep');
  });
  it('hunger > 80 → cry', () => {
    expect(resolveAnimation({ mood: 'idle', hunger: 90, happiness: 50, energy: 50, health: 100 })).toBe('cry');
  });
  it('happiness < 25 → sit', () => {
    expect(resolveAnimation({ mood: 'idle', hunger: 50, happiness: 20, energy: 50, health: 100 })).toBe('sit');
  });
  it('health == 0 → dead1', () => {
    expect(resolveAnimation({ mood: 'idle', hunger: 50, happiness: 50, energy: 50, health: 0 })).toBe('dead1');
  });
});

describe('resolveAnimation — mood coupling', () => {
  it('ecstatic → dance', () => {
    expect(resolveAnimation({ mood: 'ecstatic', hunger: 50, happiness: 90, energy: 50, health: 100 })).toBe('dance');
  });
  it('excited → excited', () => {
    expect(resolveAnimation({ mood: 'excited', hunger: 50, happiness: 80, energy: 50, health: 100 })).toBe('excited');
  });
  it('shocked → shocked', () => {
    expect(resolveAnimation({ mood: 'shocked', hunger: 50, happiness: 80, energy: 50, health: 100 })).toBe('shocked');
  });
  it('happy (mood) → happy (anim)', () => {
    expect(resolveAnimation({ mood: 'happy', hunger: 50, happiness: 80, energy: 50, health: 100 })).toBe('happy');
  });
});

describe('resolveAnimation — priority order', () => {
  it('action overrides critical stats', () => {
    // hunger=90 → cry, but feed → eat
    expect(resolveAnimation({ action: 'feed', mood: 'idle', hunger: 90, happiness: 50, energy: 50, health: 100 })).toBe('eat');
  });

  it('critical stats overrides mood', () => {
    // mood=ecstatic, but energy < 20 → sleep
    expect(resolveAnimation({ mood: 'ecstatic', hunger: 50, happiness: 90, energy: 10, health: 100 })).toBe('sleep');
  });
});

describe('resolvePetAnimation (wrapper)', () => {
  it('null pet → idle', () => {
    expect(resolvePetAnimation(null)).toBe('idle');
  });

  it('happy pet → happy anim', () => {
    const p = makePet({ mood: 'happy', stats: { hunger: 50, happiness: 80, energy: 50, xp: 0, level: 1 } });
    expect(resolvePetAnimation(p)).toBe('happy');
  });

  it('tired pet → sleep anim', () => {
    const p = makePet({ mood: 'idle', stats: { hunger: 50, happiness: 50, energy: 5, xp: 0, level: 1 } });
    expect(resolvePetAnimation(p)).toBe('sleep');
  });

  it('feed action → eat anim', () => {
    const p = makePet({ mood: 'happy' });
    expect(resolvePetAnimation(p, 'feed')).toBe('eat');
  });
});

describe('resolvePetAnimationWithFallback', () => {
  it('returns primary when hasAnim', () => {
    const p = makePet({ mood: 'happy' });
    expect(resolvePetAnimationWithFallback(p, () => true)).toBe('happy');
  });

  it('falls back to idle when no anims available', () => {
    const p = makePet({ mood: 'ecstatic' });
    const result = resolvePetAnimationWithFallback(p, () => false);
    // FALLBACK_CHAIN bắt đầu với idle → trả về idle
    expect(result).toBe('idle');
  });
});

describe('isValidAnimKey', () => {
  it('accepts known keys', () => {
    expect(isValidAnimKey('idle')).toBe(true);
    expect(isValidAnimKey('dance')).toBe(true);
    expect(isValidAnimKey('dead2')).toBe(true);
  });

  it('rejects unknown keys', () => {
    expect(isValidAnimKey('not_a_key')).toBe(false);
    expect(isValidAnimKey('')).toBe(false);
  });
});
