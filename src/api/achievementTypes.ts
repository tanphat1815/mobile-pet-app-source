/**
 * Achievement + Quest Domain Types
 *
 * Achievements: badges unlocked by completing tasks. Read-only here
 *   (the user can view which are unlocked / progress toward locked).
 * Quests: time-bound or task-based objectives with rewards.
 */

export type AchievementCategory =
  | 'care'
  | 'social'
  | 'exploration'
  | 'collection'
  | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  /** Whether the user has unlocked this achievement */
  unlocked: boolean;
  /** Timestamp of unlock (ms) */
  unlockedAt?: number;
  /** Reward on unlock (typically coins or XP) */
  rewardCoins?: number;
  rewardXP?: number;
  /** Emoji / icon glyph used in the card */
  icon: string;
  /** Optional progress (0..1) toward unlock */
  progress?: number;
  /** Required progress text (e.g. "Feed 100 times") */
  progressHint?: string;
}

export type QuestStatus = 'active' | 'completed' | 'expired';

export interface QuestObjective {
  id: string;
  description: string;
  /** Current count toward the goal */
  current: number;
  /** Goal count */
  goal: number;
  /** Whether this objective is met */
  done: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  /** When the quest started */
  startTs: number;
  /** When the quest expires (ms) - undefined for unlimited */
  expiresAt?: number;
  /** Objectives */
  objectives: QuestObjective[];
  /** Reward on completion */
  rewardCoins?: number;
  rewardXP?: number;
  /** Optional themed icon */
  icon: string;
  /** Optional category label */
  category?: string;
}

// ============================================================================
// Helpers
// ============================================================================

export function achievementProgressPct(a: Achievement): number {
  if (a.unlocked) return 100;
  return Math.round((a.progress ?? 0) * 100);
}

export function questProgressPct(q: Quest): number {
  if (q.objectives.length === 0) return 0;
  const done = q.objectives.filter((o) => o.done).length;
  return Math.round((done / q.objectives.length) * 100);
}

/** Tier -> emoji used as the badge glyph. */
export function tierGlyph(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze':
      return '🥉';
    case 'silver':
      return '🥈';
    case 'gold':
      return '🥇';
    case 'platinum':
      return '💎';
  }
}

export function categoryGlyph(c: AchievementCategory): string {
  switch (c) {
    case 'care':
      return '❤️';
    case 'social':
      return '💬';
    case 'exploration':
      return '🧭';
    case 'collection':
      return '📚';
    case 'special':
      return '⭐';
  }
}

export function isQuestExpired(q: Quest, now = Date.now()): boolean {
  if (!q.expiresAt) return false;
  return q.expiresAt < now;
}

export function questCountdownLabel(q: Quest, now = Date.now()): string {
  if (!q.expiresAt) return 'No time limit';
  const sec = Math.floor((q.expiresAt - now) / 1000);
  if (sec <= 0) return 'Expired';
  const hr = Math.floor(sec / 3600);
  if (hr > 0) return `${hr}h left`;
  const min = Math.floor(sec / 60);
  if (min > 0) return `${min}m left`;
  return `${sec}s left`;
}