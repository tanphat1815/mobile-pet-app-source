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
 *
 * Step 8 — Achievements parity với desktop:
 *   - 8 categories bao gồm progression / gameplay / hidden
 *   - 5 rarity tiers: common / uncommon / rare / epic / legendary
 *   - RARITY_COLORS map dùng constant (không phụ thuộc theme)
 *   - rarityGlyph / rarityColor / rarityLabel helpers
 */

// ============================================================================
// Achievement Categories (8 — align với desktop)
// ============================================================================

export type AchievementCategory =
  | 'progression' | 'care' | 'social' | 'gameplay'
  | 'exploration' | 'collection' | 'special' | 'hidden';

/** Step 8 — replace bronze/silver/gold/platinum tier với rarity */
export type AchievementRarity =
  | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common:    '#989EA8',  // gray
  uncommon:  '#34C759',  // green
  rare:      '#007AFF',  // blue
  epic:      '#B388FF',  // purple
  legendary: '#FFD700',  // gold
};

export function rarityColor(rarity: AchievementRarity): string {
  return RARITY_COLORS[rarity];
}

export function rarityLabel(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common':    return 'Common';
    case 'uncommon':  return 'Uncommon';
    case 'rare':      return 'Rare';
    case 'epic':      return 'Epic';
    case 'legendary': return 'Legendary';
  }
}

export function rarityGlyph(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common':    return '⚪';
    case 'uncommon':  return '🟢';
    case 'rare':      return '🔵';
    case 'epic':      return '🟣';
    case 'legendary': return '⭐';
  }
}

/** Step 8 — 8 category glyphs */
export function categoryGlyph(c: AchievementCategory): string {
  switch (c) {
    case 'progression':  return '📈';
    case 'care':         return '❤️';
    case 'social':       return '💬';
    case 'gameplay':     return '🎮';
    case 'exploration':  return '🧭';
    case 'collection':   return '📚';
    case 'special':      return '⭐';
    case 'hidden':       return '❓';
  }
}

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'progression',  label: 'Progression' },
  { id: 'care',         label: 'Care' },
  { id: 'social',       label: 'Social' },
  { id: 'gameplay',     label: 'Gameplay' },
  { id: 'exploration',  label: 'Explore' },
  { id: 'collection',   label: 'Collect' },
  { id: 'special',      label: 'Special' },
  { id: 'hidden',       label: 'Hidden' },
];

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
  /** Step 8 — rarity tier (replaces tier in new achievements) */
  rarity: AchievementRarity;
  /** Backward compat — kept for legacy achievements. Prefer rarity. */
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
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
  /** Goal count for progress tracking */
  goal?: number;
  /** Required progress text (e.g. "Feed 100 times") */
  progressHint?: string;
  /** Step 8 — hidden achievements show "???" until unlocked */
  isHidden?: boolean;
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
  (globalThis as any).__RARITY_COLORS__ = RARITY_COLORS;
  (globalThis as any).__ACHIEVEMENT_CATEGORIES__ = ACHIEVEMENT_CATEGORIES;
  // Step 8 — use distinct names to avoid collision with avatarFrames.ts
  (globalThis as any).__ACHIEVEMENT_RARITY_COLOR__ = rarityColor;
  (globalThis as any).__ACHIEVEMENT_RARITY_LABEL__ = rarityLabel;
  if (typeof window !== 'undefined') {
    (window as any).__QUEST_DIFFICULTY_COUNT__ = QUEST_DIFFICULTY.length;
    (window as any).__QUEST_DIFFICULTY__ = QUEST_DIFFICULTY;
    (window as any).__RARITY_COLORS__ = RARITY_COLORS;
    (window as any).__ACHIEVEMENT_CATEGORIES__ = ACHIEVEMENT_CATEGORIES;
    (window as any).__ACHIEVEMENT_RARITY_COLOR__ = rarityColor;
    (window as any).__ACHIEVEMENT_RARITY_LABEL__ = rarityLabel;
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
export function tierGlyph(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
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