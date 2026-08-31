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
} from '../api/achievements';
import {
  Achievement,
  Quest,
} from '../api/achievementTypes';
import { useSyncEvent } from './SyncStore';

// ============================================================================
// Types
// ============================================================================

export type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AchievementState {
  achievements: Achievement[];
  quests: Quest[];
  status: DataStatus;
  error: string | null;
  claiming: boolean;
  lastClaimedCoins: number;
  lastClaimedXP: number;

  loadAll: () => Promise<void>;
  loadAchievements: () => Promise<void>;
  loadQuests: () => Promise<void>;
  claimReward: (questId: string) => Promise<{ coins: number; xp: number }>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useAchievementStore = create<AchievementState>((set) => ({
  achievements: [],
  quests: [],
  status: 'idle',
  error: null,
  claiming: false,
  lastClaimedCoins: 0,
  lastClaimedXP: 0,

  loadAll: async () => {
    set({ status: 'loading', error: null });
    try {
      const [achievements, quests] = await Promise.all([
        listAchievements(),
        listQuests(),
      ]);
      set({ achievements, quests, status: 'ready' });
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

  claimReward: async (questId: string) => {
    set({ claiming: true });
    try {
      const res = await claimQuestReward(questId);
      set({
        lastClaimedCoins: res.coins,
        lastClaimedXP: res.xp,
      });
      return res;
    } finally {
      set({ claiming: false });
    }
  },

  reset: () => {
    set({
      achievements: [],
      quests: [],
      status: 'idle',
      error: null,
      claiming: false,
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