/**
 * Achievements + Quests API
 *
 * REST endpoints with local mock state. Read-only here - we expose
 * listAchievements and listQuests. Reward-claiming is supported but
 * not wired to the UI in this step (the spec says "read-only").
 *
 * Endpoints (target):
 *   GET  /achievements        -> Achievement[]
 *   GET  /quests              -> Quest[]
 *   POST /quests/:id/claim    -> { ok: true, coins, xp }
 */

import apiClient from './client';
import { getApiError } from './client';
import { Achievement, Quest } from './achievementTypes';

// ============================================================================
// Mock state
// ============================================================================

function makeMockAchievements(): Achievement[] {
  const now = Date.now();
  const d = (days: number) => now - days * 24 * 60 * 60 * 1000;
  return [
    {
      id: 'ach_first_steps',
      title: 'First Steps',
      description: 'Open the app for the first time',
      category: 'progression',
      rarity: 'common',
      tier: 'bronze',
      unlocked: true,
      unlockedAt: d(30),
      rewardCoins: 10,
      rewardXP: 5,
      icon: '👋',
    },
    {
      id: 'ach_feeder',
      title: "Pet's Best Friend",
      description: 'Feed your pet 50 times',
      category: 'care',
      rarity: 'uncommon',
      tier: 'silver',
      unlocked: true,
      unlockedAt: d(7),
      rewardCoins: 25,
      rewardXP: 15,
      icon: '🍖',
    },
    {
      id: 'ach_groomer',
      title: 'Squeaky Clean',
      description: 'Groom your pet 25 times',
      category: 'care',
      rarity: 'uncommon',
      tier: 'silver',
      unlocked: true,
      unlockedAt: d(3),
      rewardCoins: 25,
      rewardXP: 15,
      icon: '🛁',
    },
    {
      id: 'ach_social_butterfly',
      title: 'Social Butterfly',
      description: 'Add 10 friends',
      category: 'social',
      rarity: 'uncommon',
      tier: 'silver',
      unlocked: true,
      unlockedAt: d(2),
      rewardCoins: 25,
      rewardXP: 15,
      icon: '🦋',
    },
    {
      id: 'ach_devoted',
      title: 'Devoted Owner',
      description: 'Reach a 14-day streak',
      category: 'care',
      rarity: 'rare',
      tier: 'gold',
      unlocked: false,
      progress: 0.71,
      progressHint: '10/14 days',
      rewardCoins: 50,
      rewardXP: 30,
      icon: '🔥',
    },
    {
      id: 'ach_chatterbox',
      title: 'Chatterbox',
      description: 'Send 100 chat messages',
      category: 'social',
      rarity: 'uncommon',
      tier: 'silver',
      unlocked: false,
      progress: 0.42,
      progressHint: '42/100 messages',
      rewardCoins: 25,
      rewardXP: 15,
      icon: '💬',
    },
    {
      id: 'ach_pet_whisperer',
      title: 'Pet Whisperer',
      description: 'Reach pet level 25',
      category: 'progression',
      rarity: 'rare',
      tier: 'gold',
      unlocked: false,
      progress: 0.52,
      progressHint: 'Lv 13/25',
      rewardCoins: 50,
      rewardXP: 30,
      icon: '🗣️',
    },
    {
      id: 'ach_fashion_icon',
      title: 'Fashion Icon',
      description: 'Equip 20 different outfits',
      category: 'collection',
      rarity: 'uncommon',
      tier: 'silver',
      unlocked: false,
      progress: 0.35,
      progressHint: '7/20 outfits',
      rewardCoins: 25,
      rewardXP: 15,
      icon: '👗',
    },
    {
      id: 'ach_paired_master',
      title: 'Pair Master',
      description: 'Pair 3 devices',
      category: 'gameplay',
      rarity: 'rare',
      tier: 'gold',
      unlocked: false,
      progress: 0.66,
      progressHint: '2/3 devices',
      rewardCoins: 50,
      rewardXP: 30,
      icon: '🔗',
    },
    {
      id: 'ach_champion',
      title: 'Champion',
      description: 'Win a leaderboard season',
      category: 'special',
      rarity: 'epic',
      tier: 'platinum',
      unlocked: false,
      progress: 0.05,
      progressHint: 'Top 50, top 1 unlocks',
      rewardCoins: 200,
      rewardXP: 100,
      icon: '🏆',
    },
    {
      id: 'ach_completionist',
      title: 'Completionist',
      description: 'Unlock every achievement',
      category: 'special',
      rarity: 'legendary',
      tier: 'platinum',
      unlocked: false,
      progress: 0.4,
      progressHint: '4/10 unlocked',
      rewardCoins: 500,
      rewardXP: 250,
      icon: '✨',
    },
    {
      id: 'ach_explorer',
      title: 'Explorer',
      description: 'Visit all areas in the park',
      category: 'exploration',
      rarity: 'common',
      tier: 'bronze',
      unlocked: false,
      progress: 0.5,
      progressHint: '3/6 areas',
      rewardCoins: 10,
      rewardXP: 5,
      icon: '🗺️',
    },
    {
      id: 'ach_hidden_secret',
      title: '???',
      description: 'Keep playing to discover more!',
      category: 'hidden',
      rarity: 'legendary',
      tier: 'platinum',
      unlocked: false,
      isHidden: true,
      icon: '❓',
    },
  ];
}

function makeMockQuests(): Quest[] {
  const now = Date.now();
  const h = (n: number) => now + n * 60 * 60 * 1000;
  const d = (n: number) => now + n * 24 * 60 * 60 * 1000;
  return [
    {
      id: 'quest_daily_warmup',
      title: 'Daily Warmup',
      description: 'Take care of your pet',
      status: 'active',
      tier: 'daily',
      difficulty: 'easy',
      rerollCost: 10,
      freeRerollsLeft: 1,
      streakBonus: 1.0,
      startTs: now - 6 * 60 * 60 * 1000,
      expiresAt: h(18),
      icon: '☀️',
      category: 'Daily',
      objectives: [
        { id: 'o1', description: 'Feed your pet', current: 1, goal: 1, done: true },
        { id: 'o2', description: 'Play with your pet', current: 1, goal: 3, done: false },
        { id: 'o3', description: 'Groom your pet', current: 0, goal: 1, done: false },
      ],
      rewardCoins: 30,
      rewardXP: 15,
    },
    {
      id: 'quest_daily_challenge',
      title: 'Feed Frenzy',
      description: 'Feed your pet 5 times today',
      status: 'active',
      tier: 'daily',
      difficulty: 'medium',
      rerollCost: 15,
      freeRerollsLeft: 1,
      streakBonus: 1.0,
      startTs: now - 2 * 60 * 60 * 1000,
      expiresAt: h(22),
      icon: '🍖',
      category: 'Daily',
      objectives: [
        { id: 'o1', description: 'Feed your pet', current: 3, goal: 5, done: false },
      ],
      rewardCoins: 50,
      rewardXP: 25,
    },
    {
      id: 'quest_daily_epic',
      title: 'Triple Threat',
      description: 'Complete 3 epic challenges',
      status: 'active',
      tier: 'daily',
      difficulty: 'epic',
      rerollCost: 30,
      freeRerollsLeft: 0,
      streakBonus: 1.5,
      startTs: now - 1 * 60 * 60 * 1000,
      expiresAt: h(20),
      icon: '⭐',
      category: 'Daily',
      objectives: [
        { id: 'o1', description: 'Win 3 mini-games', current: 1, goal: 3, done: false },
      ],
      rewardCoins: 200,
      rewardXP: 100,
    },
    {
      id: 'quest_weekly_social',
      title: 'Social Week',
      description: 'Engage with friends',
      status: 'active',
      tier: 'weekly',
      difficulty: 'medium',
      rerollCost: 50,
      freeRerollsLeft: 0,
      streakBonus: 1.3,
      startTs: now - 4 * 24 * 60 * 60 * 1000,
      expiresAt: d(3),
      icon: '🤝',
      category: 'Weekly',
      objectives: [
        { id: 'o1', description: 'Send chat messages', current: 7, goal: 10, done: false },
        { id: 'o2', description: 'Receive chat messages', current: 5, goal: 5, done: true },
        { id: 'o3', description: 'Visit a friend\'s pet', current: 0, goal: 3, done: false },
      ],
      rewardCoins: 100,
      rewardXP: 50,
    },
    {
      id: 'quest_weekly_care',
      title: 'Care Marathon',
      description: 'Care for your pet consistently',
      status: 'active',
      tier: 'weekly',
      difficulty: 'hard',
      rerollCost: 75,
      freeRerollsLeft: 0,
      streakBonus: 1.5,
      startTs: now - 2 * 24 * 60 * 60 * 1000,
      expiresAt: d(5),
      icon: '🏃',
      category: 'Weekly',
      objectives: [
        { id: 'o1', description: 'Daily care 5 days', current: 3, goal: 5, done: false },
        { id: 'o2', description: 'Average happiness > 80%', current: 1, goal: 1, done: true },
      ],
      rewardCoins: 200,
      rewardXP: 100,
    },
    {
      id: 'quest_event_summer',
      title: 'Summer Festival',
      description: 'Limited time summer event',
      status: 'active',
      tier: 'event',
      difficulty: 'epic',
      rerollCost: 0,
      freeRerollsLeft: 0,
      streakBonus: 1.5,
      startTs: now - 7 * 24 * 60 * 60 * 1000,
      expiresAt: d(7),
      icon: '🌞',
      category: 'Event',
      objectives: [
        { id: 'o1', description: 'Visit beach area', current: 1, goal: 1, done: true },
        { id: 'o2', description: 'Collect 5 shells', current: 2, goal: 5, done: false },
        { id: 'o3', description: 'Reach level 15 in beach', current: 0, goal: 1, done: false },
      ],
      rewardCoins: 500,
      rewardXP: 250,
    },
    {
      id: 'quest_master_caregiver',
      title: 'Master Caregiver',
      description: 'Care for your pet at full health',
      status: 'completed',
      tier: 'weekly',
      difficulty: 'hard',
      rerollCost: 50,
      freeRerollsLeft: 0,
      streakBonus: 1.0,
      startTs: now - 7 * 24 * 60 * 60 * 1000,
      expiresAt: now - 1 * 24 * 60 * 60 * 1000,
      icon: '🎯',
      category: 'Special',
      objectives: [
        { id: 'o1', description: 'Keep pet fed', current: 1, goal: 1, done: true },
        { id: 'o2', description: 'Keep pet groomed', current: 1, goal: 1, done: true },
        { id: 'o3', description: 'Keep pet happy', current: 1, goal: 1, done: true },
      ],
      rewardCoins: 150,
      rewardXP: 80,
    },
  ];
}

let mockAchievements: Achievement[] = makeMockAchievements();
let mockQuests: Quest[] = makeMockQuests();

// ============================================================================
// API
// ============================================================================

export async function listAchievements(): Promise<Achievement[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_achievements' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockAchievements;
}

export async function listQuests(): Promise<Quest[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_quests' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockQuests;
}

export async function claimQuestReward(
  questId: string
): Promise<{ ok: true; coins: number; xp: number }> {
  try {
    await apiClient.post('/post', {
      action: 'claim_quest_reward',
      questId,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const q = mockQuests.find((x) => x.id === questId);
  if (!q) throw new Error('Quest not found');
  if (q.status !== 'completed') {
    throw new Error('Quest is not completed yet');
  }
  // Update local mock state
  mockQuests = mockQuests.map((x) =>
    x.id === questId ? { ...x, status: 'claimed' as const } : x
  );
  return { ok: true, coins: q.rewardCoins ?? 0, xp: q.rewardXP ?? 0 };
}

// ============================================================================
// Step 6 — Reroll, Streak, applyRewardMultiplier
// ============================================================================

// Pool of alternate quests cho reroll
const rerollPool: Record<string, Quest[]> = {
  daily: [
    {
      id: 'quest_daily_alt1',
      title: 'Groom Master',
      description: 'Groom your pet 3 times',
      status: 'active',
      tier: 'daily',
      difficulty: 'easy',
      rerollCost: 10,
      freeRerollsLeft: 1,
      streakBonus: 1.0,
      startTs: 0,
      expiresAt: 0,
      icon: '🛁',
      objectives: [
        { id: 'o1', description: 'Groom your pet', current: 0, goal: 3, done: false },
      ],
      rewardCoins: 25,
      rewardXP: 12,
    },
    {
      id: 'quest_daily_alt2',
      title: 'Chat Champion',
      description: 'Send 5 messages',
      status: 'active',
      tier: 'daily',
      difficulty: 'medium',
      rerollCost: 15,
      freeRerollsLeft: 1,
      streakBonus: 1.0,
      startTs: 0,
      expiresAt: 0,
      icon: '💬',
      objectives: [
        { id: 'o1', description: 'Send messages', current: 0, goal: 5, done: false },
      ],
      rewardCoins: 45,
      rewardXP: 20,
    },
  ],
  weekly: [
    {
      id: 'quest_weekly_alt1',
      title: 'Park Stroll',
      description: 'Visit 3 areas',
      status: 'active',
      tier: 'weekly',
      difficulty: 'easy',
      rerollCost: 0,
      freeRerollsLeft: 0,
      streakBonus: 1.0,
      startTs: 0,
      expiresAt: 0,
      icon: '🚶',
      objectives: [
        { id: 'o1', description: 'Meadow', current: 0, goal: 1, done: false },
        { id: 'o2', description: 'Pond', current: 0, goal: 1, done: false },
        { id: 'o3', description: 'Forest', current: 0, goal: 1, done: false },
      ],
      rewardCoins: 80,
      rewardXP: 40,
    },
  ],
};

import type { QuestDifficulty, QuestTier } from './achievementTypes';
import {
  applyRewardMultiplier as _applyRewardMultiplier,
} from './achievementTypes';

/**
 * Reroll 1 quest — đổi sang alternate random từ pool theo tier.
 * Trừ coins (hoặc dùng free reroll). Không thể reroll quest đã
 * completed/claimed.
 */
export async function rerollQuest(
  questId: string,
  coinsBalance: number
): Promise<Quest> {
  try {
    await apiClient.post('/post', { action: 'reroll_quest', questId });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const target = mockQuests.find((q) => q.id === questId);
  if (!target) throw new Error('Quest not found');
  if (target.status === 'completed' || target.status === 'claimed') {
    throw new Error('Cannot reroll a completed quest');
  }
  // Cost: free rerolls first, else deduct coins
  if (target.freeRerollsLeft <= 0) {
    if (coinsBalance < target.rerollCost) {
      throw new Error(`Not enough coins (${target.rerollCost} needed)`);
    }
  }
  const pool = rerollPool[target.tier] ?? [];
  if (pool.length === 0) {
    throw new Error('No replacement quest available');
  }
  const replacement = pool[Math.floor(Math.random() * pool.length)];
  // Build new quest preserving expires + tier
  const now = Date.now();
  const newQuest: Quest = {
    ...replacement,
    id: replacement.id + '_' + now,
    status: 'active',
    tier: target.tier,
    startTs: now,
    expiresAt: target.expiresAt,
    freeRerollsLeft:
      target.freeRerollsLeft > 0
        ? target.freeRerollsLeft - 1
        : target.freeRerollsLeft,
  };
  // Replace in mock list
  mockQuests = mockQuests.map((q) => (q.id === questId ? newQuest : q));
  return newQuest;
}

let streakState = {
  current: 7,
  longest: 12,
  lastClaimedAt: Date.now() - 20 * 60 * 60 * 1000, // hôm qua
  bonusMultiplier: 1.15,
};

export async function getStreak(): Promise<typeof streakState> {
  try {
    await apiClient.get('/get', { params: { action: 'get_streak' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return { ...streakState };
}

/**
 * Reset mock state — dùng trong tests.
 */
export function resetMockQuests(): void {
  mockAchievements = makeMockAchievements();
  mockQuests = makeMockQuests();
  streakState = {
    current: 7,
    longest: 12,
    lastClaimedAt: Date.now() - 20 * 60 * 60 * 1000,
    bonusMultiplier: 1.15,
  };
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__QUESTS__ = mockQuests;
  (globalThis as any).__TEST_REROLL_QUEST__ = rerollQuest;
  (globalThis as any).__TEST_GET_STREAK__ = getStreak;
  if (typeof window !== 'undefined') {
    (window as any).__QUESTS__ = (globalThis as any).__QUESTS__;
    (window as any).__TEST_REROLL_QUEST__ = (globalThis as any).__TEST_REROLL_QUEST__;
    (window as any).__TEST_GET_STREAK__ = (globalThis as any).__TEST_GET_STREAK__;
  }
}

// ============================================================================
// Local helpers (used by realtime events from SyncManager)
// ============================================================================

/** Mark an achievement as unlocked (from `achievement:unlocked`). */
export function unlockAchievement(achievementId: string): void {
  mockAchievements = mockAchievements.map((a) =>
    a.id === achievementId
      ? { ...a, unlocked: true, unlockedAt: Date.now(), progress: 1 }
      : a
  );
}

/** Bump an objective's progress on a quest (from `quest:progress`). */
export function bumpQuestObjective(
  questId: string,
  objectiveId: string,
  delta = 1
): void {
  mockQuests = mockQuests.map((q) => {
    if (q.id !== questId) return q;
    const objectives = q.objectives.map((o) => {
      if (o.id !== objectiveId || o.done) return o;
      const next = Math.min(o.goal, o.current + delta);
      return { ...o, current: next, done: next >= o.goal };
    });
    const allDone = objectives.every((o) => o.done);
    return {
      ...q,
      objectives,
      status: allDone ? 'completed' : q.status,
    };
  });
}