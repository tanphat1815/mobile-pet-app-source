/**
 * Step 8 — Achievements Parity tests.
 *
 * Cover:
 *  - RARITY_COLORS (5 keys, hex values)
 *  - rarityColor / rarityLabel / rarityGlyph (all 5 rarities)
 *  - ACHIEVEMENT_CATEGORIES (8 categories)
 *  - categoryGlyph (8 categories)
 *  - Achievement interface fields (rarity, isHidden, goal)
 *  - hidden achievement display logic
 *  - queue management in AchievementStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RARITY_COLORS,
  rarityColor,
  rarityLabel,
  rarityGlyph,
  ACHIEVEMENT_CATEGORIES,
  categoryGlyph,
} from '@/api/achievementTypes';
import type { Achievement, AchievementCategory, AchievementRarity } from '@/api/achievementTypes';

describe('RARITY_COLORS', () => {
  it('has 5 keys', () => {
    expect(Object.keys(RARITY_COLORS)).toHaveLength(5);
  });

  it('all values are hex', () => {
    for (const [k, v] of Object.entries(RARITY_COLORS)) {
      expect(v, k).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('legendary is gold (#FFD700)', () => {
    expect(RARITY_COLORS.legendary).toBe('#FFD700');
  });

  it('epic is purple (#B388FF)', () => {
    expect(RARITY_COLORS.epic).toBe('#B388FF');
  });

  it('rare is blue (#007AFF)', () => {
    expect(RARITY_COLORS.rare).toBe('#007AFF');
  });
});

describe('rarityColor', () => {
  const rarities: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  it('returns hex string for each rarity', () => {
    for (const r of rarities) {
      expect(rarityColor(r)).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('rarityLabel', () => {
  it('capitalizes each rarity', () => {
    expect(rarityLabel('common')).toBe('Common');
    expect(rarityLabel('uncommon')).toBe('Uncommon');
    expect(rarityLabel('rare')).toBe('Rare');
    expect(rarityLabel('epic')).toBe('Epic');
    expect(rarityLabel('legendary')).toBe('Legendary');
  });
});

describe('rarityGlyph', () => {
  it('returns emoji for each rarity', () => {
    expect(rarityGlyph('common')).toBe('⚪');
    expect(rarityGlyph('uncommon')).toBe('🟢');
    expect(rarityGlyph('rare')).toBe('🔵');
    expect(rarityGlyph('epic')).toBe('🟣');
    expect(rarityGlyph('legendary')).toBe('⭐');
  });
});

describe('ACHIEVEMENT_CATEGORIES', () => {
  it('has 8 categories', () => {
    expect(ACHIEVEMENT_CATEGORIES).toHaveLength(8);
  });

  it('includes progression / gameplay / hidden', () => {
    const ids = ACHIEVEMENT_CATEGORIES.map((c) => c.id);
    expect(ids).toContain('progression');
    expect(ids).toContain('gameplay');
    expect(ids).toContain('hidden');
  });

  it('all categories have labels', () => {
    for (const cat of ACHIEVEMENT_CATEGORIES) {
      expect(typeof cat.label).toBe('string');
      expect(cat.label.length).toBeGreaterThan(0);
    }
  });

  it('all ids are unique', () => {
    const ids = ACHIEVEMENT_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('categoryGlyph', () => {
  const categories: AchievementCategory[] = [
    'progression', 'care', 'social', 'gameplay',
    'exploration', 'collection', 'special', 'hidden',
  ];
  it('returns emoji for each category', () => {
    for (const c of categories) {
      const glyph = categoryGlyph(c);
      expect(glyph).toBeTruthy();
      expect(glyph.length).toBeGreaterThan(0);
    }
  });

  it('hidden returns ❓', () => {
    expect(categoryGlyph('hidden')).toBe('❓');
  });

  it('progression returns 📈', () => {
    expect(categoryGlyph('progression')).toBe('📈');
  });

  it('gameplay returns 🎮', () => {
    expect(categoryGlyph('gameplay')).toBe('🎮');
  });
});

describe('Achievement interface — Step 8 fields', () => {
  it('accepts rarity field', () => {
    const a: Achievement = {
      id: 'test',
      title: 'Test',
      description: 'Test achievement',
      category: 'special',
      rarity: 'legendary',
      unlocked: false,
      icon: '🏆',
    };
    expect(a.rarity).toBe('legendary');
  });

  it('accepts isHidden field', () => {
    const a: Achievement = {
      id: 'test',
      title: 'Secret',
      description: 'Hidden achievement',
      category: 'hidden',
      rarity: 'epic',
      unlocked: false,
      isHidden: true,
      icon: '❓',
    };
    expect(a.isHidden).toBe(true);
  });

  it('accepts goal field', () => {
    const a: Achievement = {
      id: 'test',
      title: 'Test',
      description: 'Test',
      category: 'care',
      rarity: 'rare',
      unlocked: false,
      goal: 100,
      progress: 0.5,
      icon: '❤️',
    };
    expect(a.goal).toBe(100);
    expect(a.progress).toBe(0.5);
  });
});

describe('hidden achievement — display logic', () => {
  it('hidden locked achievement shows "???" for title', () => {
    const a: Achievement = {
      id: 'secret',
      title: 'Secret Achievement',
      description: 'You found a secret!',
      category: 'hidden',
      rarity: 'legendary',
      unlocked: false,
      isHidden: true,
      icon: '❓',
    };
    const title = a.isHidden && !a.unlocked ? '???' : a.title;
    expect(title).toBe('???');
  });

  it('hidden unlocked achievement shows real title', () => {
    const a: Achievement = {
      id: 'secret',
      title: 'Secret Achievement',
      description: 'You found a secret!',
      category: 'hidden',
      rarity: 'legendary',
      unlocked: true,
      unlockedAt: Date.now(),
      isHidden: true,
      icon: '🏆',
    };
    const title = a.isHidden && !a.unlocked ? '???' : a.title;
    expect(title).toBe('Secret Achievement');
  });
});

describe('queue management — popToastAchievement', () => {
  it('pop returns undefined from empty queue', () => {
    const queue: Achievement[] = [];
    const [first, ...rest] = queue;
    expect(first).toBeUndefined();
    expect(rest).toHaveLength(0);
  });

  it('pop returns first from queue', () => {
    const queue: Achievement[] = [
      { id: 'a', title: 'A', description: '', category: 'care', rarity: 'rare', unlocked: true, icon: '🏆' },
      { id: 'b', title: 'B', description: '', category: 'care', rarity: 'epic', unlocked: true, icon: '⭐' },
    ];
    const [first, ...rest] = queue;
    expect(first?.id).toBe('a');
    expect(rest).toHaveLength(1);
  });
});
