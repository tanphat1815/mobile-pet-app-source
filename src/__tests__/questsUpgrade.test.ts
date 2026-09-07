/**
 * Step 6 — Quests Upgrade tests.
 *
 * Verify:
 *  - calcBonusMultiplier (1-7-30-100 breakpoints)
 *  - nextDayStreak (consecutive / gap / same-day)
 *  - streakLabel / formatBonus
 *  - QUEST_DIFFICULTY (4 levels)
 *  - getDifficultyMeta
 *  - applyRewardMultiplier
 *  - achievements.ts rerollQuest / getStreak / resetMockQuests
 *  - achievements.ts quest claim sets status=claimed
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calcBonusMultiplier,
  nextDayStreak,
  streakLabel,
  formatBonus,
  makeFreshStreak,
} from '@/api/streakTracker';
import { QUEST_DIFFICULTY, getDifficultyMeta, applyRewardMultiplier } from '@/api/achievementTypes';
import {
  listQuests,
  claimQuestReward,
  rerollQuest,
  getStreak,
  resetMockQuests,
} from '@/api/achievements';

beforeEach(() => {
  resetMockQuests();
});

describe('calcBonusMultiplier', () => {
  it('returns 1.0 for 0-1 day', () => {
    expect(calcBonusMultiplier(0)).toBe(1.0);
    expect(calcBonusMultiplier(1)).toBe(1.0);
  });

  it('scales from ×1.0 → ×1.25 between 2-6 days', () => {
    expect(calcBonusMultiplier(2)).toBeCloseTo(1.05);
    expect(calcBonusMultiplier(6)).toBeCloseTo(1.25);
  });

  it('returns ×1.5 for 7-29 days', () => {
    expect(calcBonusMultiplier(7)).toBe(1.5);
    expect(calcBonusMultiplier(15)).toBe(1.5);
    expect(calcBonusMultiplier(29)).toBe(1.5);
  });

  it('returns ×1.7 for 30-99 days', () => {
    expect(calcBonusMultiplier(30)).toBe(1.7);
    expect(calcBonusMultiplier(50)).toBe(1.7);
    expect(calcBonusMultiplier(99)).toBe(1.7);
  });

  it('caps at ×2.0 for 100+ days', () => {
    expect(calcBonusMultiplier(100)).toBe(2.0);
    expect(calcBonusMultiplier(500)).toBe(2.0);
  });
});

describe('nextDayStreak', () => {
  it('starts at day 1 for fresh streak', () => {
    const s = makeFreshStreak();
    const now = Date.now();
    const result = nextDayStreak(s, now);
    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
  });

  it('increments on consecutive day', () => {
    const oneDay = 24 * 60 * 60 * 1000;
    const prev = {
      current: 5,
      longest: 10,
      lastClaimedAt: Date.now() - oneDay,
      bonusMultiplier: 1.5,
    };
    const result = nextDayStreak(prev, Date.now());
    expect(result.current).toBe(6);
    expect(result.longest).toBe(10);
  });

  it('resets to 1 after a gap >= 2 days', () => {
    const twoDays = 2 * 24 * 60 * 60 * 1000;
    const prev = {
      current: 20,
      longest: 20,
      lastClaimedAt: Date.now() - twoDays,
      bonusMultiplier: 1.5,
    };
    const result = nextDayStreak(prev, Date.now());
    expect(result.current).toBe(1);
    expect(result.longest).toBe(20);
  });

  it('does not increment on same day', () => {
    const now = Date.now();
    const prev = { current: 7, longest: 7, lastClaimedAt: now - 1_000, bonusMultiplier: 1.5 };
    const result = nextDayStreak(prev, now);
    expect(result.current).toBe(7);
  });
});

describe('streakLabel', () => {
  it('singular day', () => {
    expect(streakLabel({ current: 1, longest: 1, lastClaimedAt: 0, bonusMultiplier: 1.0 })).toBe('🔥 1 day');
  });

  it('plural days', () => {
    expect(streakLabel({ current: 12, longest: 15, lastClaimedAt: 0, bonusMultiplier: 1.5 })).toBe('🔥 12 days');
  });
});

describe('formatBonus', () => {
  it('formats 1.0 as ×1.0', () => {
    expect(formatBonus(1.0)).toBe('×1.0');
  });

  it('formats 1.5 as ×1.5', () => {
    expect(formatBonus(1.5)).toBe('×1.5');
  });

  it('formats 2.0 as ×2.0', () => {
    expect(formatBonus(2.0)).toBe('×2.0');
  });
});

describe('QUEST_DIFFICULTY', () => {
  it('has 4 levels', () => {
    expect(QUEST_DIFFICULTY).toHaveLength(4);
  });

  it('covers easy/medium/hard/epic', () => {
    const ids = QUEST_DIFFICULTY.map((d) => d.id);
    expect(ids).toContain('easy');
    expect(ids).toContain('medium');
    expect(ids).toContain('hard');
    expect(ids).toContain('epic');
  });

  it('has correct reward multipliers', () => {
    expect(getDifficultyMeta('easy')?.rewardMultiplier).toBe(1.0);
    expect(getDifficultyMeta('medium')?.rewardMultiplier).toBe(1.5);
    expect(getDifficultyMeta('hard')?.rewardMultiplier).toBe(2.0);
    expect(getDifficultyMeta('epic')?.rewardMultiplier).toBe(3.0);
  });
});

describe('applyRewardMultiplier', () => {
  it('applies difficulty × streak', () => {
    expect(applyRewardMultiplier(100, 'easy', 1.5)).toBe(150);
    expect(applyRewardMultiplier(100, 'medium', 1.5)).toBe(225);
    expect(applyRewardMultiplier(100, 'hard', 1.5)).toBe(300);
    expect(applyRewardMultiplier(100, 'epic', 1.5)).toBe(450);
  });

  it('rounds to nearest integer', () => {
    expect(applyRewardMultiplier(33, 'medium', 1.5)).toBe(74); // 33*1.5*1.5=74.25→74
  });
});

describe('achievements.ts API — Step 6', () => {
  it('listQuests returns quests with tier/difficulty fields', async () => {
    const quests = await listQuests();
    const daily = quests.find((q) => q.tier === 'daily');
    expect(daily).toBeDefined();
    expect(daily?.difficulty).toBeDefined();
    expect(daily?.rerollCost).toBeDefined();
    expect(daily?.freeRerollsLeft).toBeDefined();
  });

  it('claimReward sets quest status to claimed', async () => {
    const quests = await listQuests();
    const completed = quests.find((q) => q.status === 'completed');
    expect(completed).toBeDefined();
    await claimQuestReward(completed!.id);
    const after = await listQuests();
    const updated = after.find((q) => q.id === completed!.id);
    expect(updated?.status).toBe('claimed');
  });

  it('rerollQuest returns replacement quest', async () => {
    const quests = await listQuests();
    const active = quests.find((q) => q.status === 'active' && q.tier === 'daily');
    expect(active).toBeDefined();
    const result = await rerollQuest(active!.id, 0);
    expect(result.tier).toBe('daily');
    expect(result.status).toBe('active');
  });

  it('getStreak returns current/longest/bonusMultiplier', async () => {
    const streak = await getStreak();
    expect(typeof streak.current).toBe('number');
    expect(typeof streak.longest).toBe('number');
    expect(typeof streak.bonusMultiplier).toBe('number');
  });
});
