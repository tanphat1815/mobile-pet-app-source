/**
 * Achievement + Quest Domain Types
 *
 * Achievements: badges unlocked by completing tasks. Read-only here
 *   (the user can view which are unlocked / progress toward locked).
 * Quests: time-bound or task-based objectives with rewards.
 *
 * Step 6 — mở rộng Quest với tier (daily/weekly/event), difficulty
 * (easy/medium/hard/epic), reroll cost + free allowance, streakBonus
 * multiplier.
 */

export type AchievementCategory =
  | 'care'
  | 'social'
  | 'exploration'
  | 'collection'
  | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Step 6 — QuestTier chia theo chu kỳ reset:
 *  - daily: reset mỗi 24h
 *  - weekly: reset mỗi 7 ngày
 *  - event: thời hạn cố định (special)
 */
export type QuestTier = 'daily' | 'weekly' | 'event';

/**
 * Step 6 — difficulty quyết định reward multiplier:
 *  - easy: 1× base
 *  - medium: 1.5×
 *  - hard: 2×
 *  - epic: 3×
 */
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface DifficultyMeta {
  id: QuestDifficulty;
  label: string;
  tint: string;
  textColor: string;
  rewardMultiplier: number;
  emoji: string;
}

export const QUEST_DIFFICULTY: DifficultyMeta[] = [
  { id: 'easy',   label: 'Easy',   tint: '#D1F0D8', textColor: '#14532D', rewardMultiplier: 1.0, emoji: '🟢' },
  { id: 'medium', label: 'Medium', tint: '#FFE9A8', textColor: '#8A5A00', rewardMultiplier: 1.5, emoji: '🟡' },
  { id: 'hard',   label: 'Hard',   tint: '#FFC1C1', textColor: '#7A1F1F', rewardMultiplier: 2.0, emoji: '🟠' },
  { id: 'epic',   label: 'Epic',   tint: '#E5D1FF', textColor: '#4C1D95', rewardMultiplier: 3.0, emoji: '🟣' },
];

export function getDifficultyMeta(id: QuestDifficulty): DifficultyMeta | undefined {
  return QUEST_DIFFICULTY.find((d) => d.id === id);
}

/**
 * Tính reward cuối cùng sau khi áp dụng difficulty + streak bonuses.
 */
export function applyRewardMultiplier(
  base: number,
  difficulty: QuestDifficulty,
  streakMultiplier: number
): number {
  const diff = getDifficultyMeta(difficulty);
  const diffMul = diff?.rewardMultiplier ?? 1.0;
  return Math.round(base * diffMul * streakMultiplier);
}

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

export type QuestStatus = 'active' | 'completed' | 'expired' | 'claimed' | 'rerolled';

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
  // ====================== Step 6 additions ======================
  /** Tier — daily / weekly / event */
  tier: QuestTier;
  /** Difficulty quyết định reward multiplier */
  difficulty: QuestDifficulty;
  /** Coin cost để reroll 1 quest */
  rerollCost: number;
  /** Số reroll miễn phí còn lại trong ngày */
  freeRerollsLeft: number;
  /** Bonus XP multiplier từ streak (cached) */
  streakBonus: number;
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__QUEST_DIFFICULTY_COUNT__ = QUEST_DIFFICULTY.length;
  (globalThis as any).__QUEST_DIFFICULTY__ = QUEST_DIFFICULTY;
  if (typeof window !== 'undefined') {
    (window as any).__QUEST_DIFFICULTY_COUNT__ = QUEST_DIFFICULTY.length;
    (window as any).__QUEST_DIFFICULTY__ = QUEST_DIFFICULTY;
  }
}

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