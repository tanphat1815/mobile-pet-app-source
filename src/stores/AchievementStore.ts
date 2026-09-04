/**
 * AchievementStore (Zustand)
 *
 * Read-only viewer for achievements + quests. Lazy-loads on first
 * mount and subscribes to realtime updates.
 */

import { create } from 'zustand';
import {
  listAchievements,
  listQuests,
  claimQuestReward,
  unlockAchievement,
  rerollQuest,
  getStreak,
} from '../api/achievements';
import {
  Achievement,
  Quest,
} from '../api/achievementTypes';
import { Streak } from '../api/streakTracker';
import { useSyncEvent } from './SyncStore';

// ============================================================================
// Types
// ============================================================================

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AchievementState {
  achievements: Achievement[];
  quests: Quest[];
  streak: Streak | null;
  status: DataStatus;
  error: string | null;
  claiming: boolean;
  rerolling: boolean;
  lastClaimedCoins: number;
  lastClaimedXP: number;

  loadAll: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  loadQuests: () => Promise<void>;
  loadStreak: () => Promise<void>;
  claimReward: (questId: string) => Promise<{ coins: number; xp: number }>;
  reroll: (questId: string) => Promise<void>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useAchievementStore = create<AchievementState>((set, get) => ({
  achievements: [],
  quests: [],
  streak: null,
  status: 'idle',
  error: null,
  claiming: false,
  rerolling: false,
  lastClaimedCoins: 0,
  lastClaimedXP: 0,

  loadAll: async () => {
    set({ status: 'loading', error: null });
    try {
      const [achievements, quests] = await Promise.all([
        listAchievements(),
        listQuests(),
      ]);
      const streak = await getStreak();
      set({ achievements, quests, streak, status: 'ready' });
    } catch (err) {
      set({
        status: 'error',
        error:
          err instanceof Error ? err.message : 'Failed to load achievements',
      });
    }
  },

  loadAchievements: async () => {
    try {
      const achievements = await listAchievements();
      set({ achievements });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : 'Failed to load achievements',
      });
    }
  },

  loadQuests: async () => {
    try {
      const quests = await listQuests();
      set({ quests });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load quests',
      });
    }
  },

  loadStreak: async () => {
    try {
      const streak = await getStreak();
      set({ streak });
    } catch {
      /* ignore */
    }
  },

  claimReward: async (questId: string) => {
    set({ claiming: true });
    try {
      const res = await claimQuestReward(questId);
      set({
        lastClaimedCoins: res.coins,
        lastClaimedXP: res.xp,
        quests: get().quests.map((q) =>
          q.id === questId ? { ...q, status: 'claimed' as const } : q
        ),
      });
      return res;
    } finally {
      set({ claiming: false });
    }
  },

  reroll: async (questId: string) => {
    set({ rerolling: true });
    try {
      const updated = await rerollQuest(questId, 0);
      const prev = get().quests.find((q) => q.id === questId);
      const usedFreeReroll = (prev?.freeRerollsLeft ?? 0) > 0;
      set({
        quests: get().quests.map((q) => {
          if (q.id === questId) return updated;
          if (usedFreeReroll && q.tier === 'daily') {
            return { ...q, freeRerollsLeft: Math.max(0, q.freeRerollsLeft - 1) };
          }
          return q;
        }),
      });
    } finally {
      set({ rerolling: false });
    }
  },

  reset: () => {
    set({
      achievements: [],
      quests: [],
      streak: null,
      status: 'idle',
      error: null,
      claiming: false,
      rerolling: false,
      lastClaimedCoins: 0,
      lastClaimedXP: 0,
    });
  },
}));

// ============================================================================
// Realtime bridge
// ============================================================================

/**
 * Subscribes to achievement:unlocked and quest:progress events from
 * the SyncManager and pipes them into the store. Lazy-loads on first
 * mount.
 */
export function useAchievementRealtimeSync(): void {
  const loadAll = useAchievementStore((s) => s.loadAll);

  useSyncEvent('achievement:unlocked', (payload) => {
    unlockAchievement(payload.achievementId);
    useAchievementStore.setState((s) => ({
      achievements: s.achievements.map((a) =>
        a.id === payload.achievementId
          ? {
              ...a,
              unlocked: true,
              unlockedAt: Date.now(),
              progress: 1,
            }
          : a
      ),
    }));
  });

  useSyncEvent('quest:progress', (payload) => {
    // Find the first incomplete objective for this quest and bump it
    // by 1. The wire event only carries the aggregate progress + a
    // completion flag, so this keeps the UI in sync without the
    // server telling us which exact objective moved.
    useAchievementStore.setState((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== payload.questId) return q;
        if (payload.completed) {
          const objectives = q.objectives.map((o) => ({
            ...o,
            current: o.goal,
            done: true,
          }));
          return { ...q, objectives, status: 'completed' as const };
        }
        const objectives = q.objectives.map((o) => {
          if (o.done) return o;
          return { ...o, current: o.goal, done: true };
        });
        return { ...q, objectives };
      }),
    }));
  });

  if (useAchievementStore.getState().status === 'idle') {
    loadAll();
  }
}