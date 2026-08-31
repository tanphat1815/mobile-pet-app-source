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
      category: 'care',
      tier: 'bronze',
      unlocked: true,
      unlockedAt: d(30),
      rewardCoins: 10,
      rewardXP: 5,
      icon: '👋',
    },
    {
      id: 'ach_feeder',
      title: 'Pet\'s Best Friend',
      description: 'Feed your pet 50 times',
      category: 'care',
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
      category: 'exploration',
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
      category: 'special',
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
      tier: 'bronze',
      unlocked: false,
      progress: 0.5,
      progressHint: '3/6 areas',
      rewardCoins: 10,
      rewardXP: 5,
      icon: '🗺️',
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
      id: 'quest_weekly_social',
      title: 'Social Week',
      description: 'Engage with friends',
      status: 'active',
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
      id: 'quest_explorer',
      title: 'Park Explorer',
      description: 'Visit all areas',
      status: 'active',
      startTs: now - 24 * 60 * 60 * 1000,
      expiresAt: d(6),
      icon: '🗺️',
      category: 'Weekly',
      objectives: [
        { id: 'o1', description: 'Visit the meadow', current: 1, goal: 1, done: true },
        { id: 'o2', description: 'Visit the pond', current: 0, goal: 1, done: false },
        { id: 'o3', description: 'Visit the forest', current: 0, goal: 1, done: false },
        { id: 'o4', description: 'Visit the mountain', current: 0, goal: 1, done: false },
      ],
      rewardCoins: 75,
      rewardXP: 40,
    },
    {
      id: 'quest_master_caregiver',
      title: 'Master Caregiver',
      description: 'Care for your pet at full health',
      status: 'completed',
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
  return { ok: true, coins: q.rewardCoins ?? 0, xp: q.rewardXP ?? 0 };
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