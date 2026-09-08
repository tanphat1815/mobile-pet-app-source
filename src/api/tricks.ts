/**
 * Pet Tricks API — Step 12e
 *
 * Ported from desktop src/core/pet-tricks.js.
 *
 * 8 tricks across 4 categories (basic / intermediate / advanced / expert)
 * with progressive unlock levels + life-stage gates.
 *
 * Pure helpers: ensureTricksStructure, getLearnedTricks,
 * getAvailableTricks, learnTrick, practiceTrick, performTrick,
 * parseCommand.
 */

import type { PetStats } from './adventure';

// ============================================================================
// Types
// ============================================================================

export type TrickCategory = 'basic' | 'intermediate' | 'advanced' | 'expert';
export type TrickAnimation = 'SIT' | 'SLEEP' | 'CUSTOM' | 'WALK' | 'JUMP' | 'DANCE';
export type LifeStage = 'NEWBORN' | 'YOUNG' | 'JUVENILE' | 'ADULT' | 'SENIOR';

export interface TrickDef {
  id: string;
  displayName: string;
  emoji: string;
  description: string;
  command: string;
  difficulty: number;       // 1..5
  category: TrickCategory;
  animation: TrickAnimation;
  unlockLevel: number;
  unlockStage: LifeStage;
  requiresItem?: string;
}

export interface LearnedTrick {
  trickId: string;
  learnedAt: number;
  masteryLevel: number;     // 1..10
  successCount: number;
  failCount: number;
}

export interface AvailableTrick extends TrickDef {
  isLearned: boolean;
  stageMet: boolean;
  levelMet: boolean;
  canLearn: boolean;
}

export interface TrainingState {
  trickId: string;
  attempts: number;
  startedAt: number;
}

export interface TricksState {
  learned: LearnedTrick[];
  training: TrainingState | null;
  lastTrickAt: number;
  totalTricksPerformed: number;
}

export interface TrainingStats {
  treatsUsed: number;
  trainingSessionsToday: number;
}

export interface PetStatsWithTricks extends PetStats {
  tricks?: TricksState;
  trainingStats?: TrainingStats;
}

// ============================================================================
// Catalog
// ============================================================================

export const TRICKS: Record<string, TrickDef> = {
  sit: {
    id: 'sit',
    displayName: 'Ngồi',
    emoji: '🪑',
    description: 'Bảo pet ngồi ngoan ngoãn',
    command: 'sit',
    difficulty: 1,
    category: 'basic',
    animation: 'SIT',
    unlockLevel: 1,
    unlockStage: 'YOUNG',
  },
  lie_down: {
    id: 'lie_down',
    displayName: 'Nằm xuống',
    emoji: '🛌',
    description: 'Bảo pet nằm thư giãn',
    command: 'lie down',
    difficulty: 2,
    category: 'basic',
    animation: 'SLEEP',
    unlockLevel: 3,
    unlockStage: 'YOUNG',
  },
  roll_over: {
    id: 'roll_over',
    displayName: 'Lăn',
    emoji: '🔄',
    description: 'Bảo pet lăn tròn trên sàn',
    command: 'roll',
    difficulty: 2,
    category: 'basic',
    animation: 'CUSTOM',
    unlockLevel: 5,
    unlockStage: 'YOUNG',
  },
  shake_hand: {
    id: 'shake_hand',
    displayName: 'Bắt tay',
    emoji: '🤝',
    description: 'Đưa chân chào hỏi thân thiện',
    command: 'shake',
    difficulty: 3,
    category: 'intermediate',
    animation: 'CUSTOM',
    unlockLevel: 8,
    unlockStage: 'JUVENILE',
  },
  fetch: {
    id: 'fetch',
    displayName: 'Đi lấy đồ',
    emoji: '🎾',
    description: 'Ném bóng và pet chạy đi nhặt',
    command: 'fetch',
    difficulty: 4,
    category: 'intermediate',
    animation: 'WALK',
    unlockLevel: 12,
    unlockStage: 'JUVENILE',
    requiresItem: 'ball',
  },
  jump: {
    id: 'jump',
    displayName: 'Nhảy qua vòng',
    emoji: '⭕',
    description: 'Nhảy qua vòng tròn điệu nghệ',
    command: 'jump',
    difficulty: 4,
    category: 'advanced',
    animation: 'JUMP',
    unlockLevel: 18,
    unlockStage: 'ADULT',
    requiresItem: 'ring',
  },
  dance: {
    id: 'dance',
    displayName: 'Nhảy múa',
    emoji: '💃',
    description: 'Pet lắc lư nhảy múa theo điệu nhạc',
    command: 'dance',
    difficulty: 5,
    category: 'advanced',
    animation: 'DANCE',
    unlockLevel: 25,
    unlockStage: 'ADULT',
    requiresItem: 'music_box',
  },
  back_flip: {
    id: 'back_flip',
    displayName: 'Lộn ngược',
    emoji: '🤸',
    description: 'Lộn nhào ngược người ngoạn mục',
    command: 'backflip',
    difficulty: 5,
    category: 'expert',
    animation: 'CUSTOM',
    unlockLevel: 35,
    unlockStage: 'ADULT',
  },
};

export const TRICK_CATEGORIES: TrickCategory[] = ['basic', 'intermediate', 'advanced', 'expert'];
export const TRICK_CATEGORY_LABELS: Record<TrickCategory, string> = {
  basic: 'Cơ bản',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
  expert: 'Chuyên gia',
};

export const STAGE_ORDER: Record<LifeStage, number> = {
  NEWBORN: 0,
  YOUNG: 1,
  JUVENILE: 2,
  ADULT: 3,
  SENIOR: 4,
};

export const STAGE_LABELS: Record<LifeStage, string> = {
  NEWBORN: 'Sơ sinh',
  YOUNG: 'Nhỏ',
  JUVENILE: 'Thiếu niên',
  ADULT: 'Trưởng thành',
  SENIOR: 'Già',
};

export const PERFORM_COOLDOWN_MS = 15_000;
export const DEFAULT_REQUIRED_ATTEMPTS = 3;
export const MAX_MASTERY_LEVEL = 10;
export const MAX_TREATS = 20;

// ============================================================================
// Helpers
// ============================================================================

export function getTrickById(id: string): TrickDef | null {
  return TRICKS[id] ?? null;
}

export function listAllTricks(): TrickDef[] {
  return Object.values(TRICKS);
}

export function listTricksByCategory(category: TrickCategory): TrickDef[] {
  return Object.values(TRICKS).filter((t) => t.category === category);
}

export function ensureTricksStructure(stats: PetStatsWithTricks): PetStatsWithTricks {
  if (!stats.tricks || typeof stats.tricks !== 'object') {
    stats.tricks = {
      learned: [],
      training: null,
      lastTrickAt: 0,
      totalTricksPerformed: 0,
    };
  }
  if (!Array.isArray(stats.tricks.learned)) {
    stats.tricks.learned = [];
  }
  if (!stats.trainingStats || typeof stats.trainingStats !== 'object') {
    stats.trainingStats = {
      treatsUsed: 5,
      trainingSessionsToday: 0,
    };
  }
  return stats;
}

export function getLearnedTricks(stats: PetStatsWithTricks): (TrickDef & LearnedTrick)[] {
  ensureTricksStructure(stats);
  return (stats.tricks!.learned || []).map((t) => {
    const def = listAllTricks().find((item) => item.id === t.trickId) || ({} as TrickDef);
    return { ...def, ...t };
  });
}

export function getAvailableTricks(
  stats: PetStatsWithTricks,
  currentStageKey: LifeStage = 'YOUNG'
): AvailableTrick[] {
  ensureTricksStructure(stats);
  const userLevel = stats.level ?? 1;
  const learnedIds = (stats.tricks!.learned || []).map((t) => t.trickId);
  const stageRank = STAGE_ORDER[currentStageKey] ?? 1;

  return listAllTricks().map((trick) => {
    const isLearned = learnedIds.includes(trick.id);
    const reqStageRank = STAGE_ORDER[trick.unlockStage] ?? 1;
    const stageMet = currentStageKey !== 'NEWBORN' && stageRank >= reqStageRank;
    const levelMet = userLevel >= trick.unlockLevel;
    const canLearn = !isLearned && stageMet && levelMet;

    return {
      ...trick,
      isLearned,
      stageMet,
      levelMet,
      canLearn,
    };
  });
}

export function getRequiredAttempts(difficulty: number): number {
  return Math.max(DEFAULT_REQUIRED_ATTEMPTS, difficulty * 3);
}

// ============================================================================
// Learn / Practice / Perform
// ============================================================================

export interface LearnResult {
  success: boolean;
  error?: string;
  message?: string;
  training?: TrainingState;
}

export function learnTrick(
  trickId: string,
  stats: PetStatsWithTricks,
  currentStageKey: LifeStage = 'YOUNG'
): LearnResult {
  ensureTricksStructure(stats);
  const trick = getTrickById(trickId);
  if (!trick) return { success: false, error: 'Trick không tồn tại' };

  if (currentStageKey === 'NEWBORN') {
    return { success: false, error: 'Pet còn bé xíu, chưa thể học trick' };
  }

  const userLevel = stats.level ?? 1;
  if (userLevel < trick.unlockLevel) {
    return { success: false, error: `Cần đạt Level ${trick.unlockLevel} để học trick này` };
  }

  const stageRank = STAGE_ORDER[currentStageKey] ?? 1;
  const reqStageRank = STAGE_ORDER[trick.unlockStage] ?? 1;
  if (stageRank < reqStageRank) {
    return { success: false, error: `Pet cần đạt giai đoạn ${STAGE_LABELS[trick.unlockStage]} để học` };
  }

  if (stats.tricks!.learned.some((t) => t.trickId === trickId)) {
    return { success: false, error: 'Pet đã thuần thục trick này rồi' };
  }

  stats.tricks!.training = {
    trickId,
    attempts: 0,
    startedAt: Date.now(),
  };

  return {
    success: true,
    message: `Đã bắt đầu huấn luyện "${trick.displayName}"!`,
    training: stats.tricks!.training,
  };
}

export interface PracticeResult {
  success: boolean;
  mastered: boolean;
  attempts: number;
  requiredAttempts: number;
  remaining: number;
  trick?: TrickDef;
  message: string;
}

export function practiceTrick(
  trickId: string,
  useTreat: boolean,
  stats: PetStatsWithTricks,
  personality: { obedience?: number } = {},
  randomFn: () => number = Math.random
): PracticeResult {
  ensureTricksStructure(stats);
  const trick = getTrickById(trickId);
  if (!trick) {
    return { success: false, mastered: false, attempts: 0, requiredAttempts: 0, remaining: 0, message: 'Trick không tồn tại' };
  }

  if (!stats.tricks!.training || stats.tricks!.training.trickId !== trickId) {
    return {
      success: false,
      mastered: false,
      attempts: 0,
      requiredAttempts: 0,
      remaining: 0,
      message: 'Chưa bắt đầu khóa huấn luyện trick này',
    };
  }

  const training = stats.tricks!.training;
  training.attempts = (training.attempts || 0) + 1;

  // Success rate calculation
  let successRate = 0.5;
  if (personality.obedience) {
    successRate = 0.3 + (personality.obedience / 100) * 0.4;
  }

  // Treat bonus
  if (useTreat) {
    if ((stats.trainingStats!.treatsUsed || 0) > 0) {
      stats.trainingStats!.treatsUsed -= 1;
      successRate += 0.25;
    }
  }

  // Familiarity bonus
  const familiarityBonus = Math.min(0.25, training.attempts * 0.04);
  successRate += familiarityBonus;

  const isSuccess = randomFn() < Math.min(0.95, successRate);
  const requiredAttempts = getRequiredAttempts(trick.difficulty);

  if (isSuccess && training.attempts >= requiredAttempts) {
    // Trick mastered
    const learnedItem: LearnedTrick = {
      trickId,
      learnedAt: Date.now(),
      masteryLevel: 1,
      successCount: training.attempts,
      failCount: 0,
    };
    stats.tricks!.learned.push(learnedItem);
    stats.tricks!.training = null;
    stats.tricks!.lastTrickAt = Date.now();

    return {
      success: true,
      mastered: true,
      attempts: training.attempts,
      requiredAttempts,
      remaining: 0,
      trick,
      message: `🎉 Thú cưng đã thuần thục trick "${trick.displayName}"!`,
    };
  }

  return {
    success: isSuccess,
    mastered: false,
    attempts: training.attempts,
    requiredAttempts,
    remaining: Math.max(0, requiredAttempts - training.attempts),
    trick,
    message: isSuccess
      ? `Luyện tập tốt! Tiến độ: ${training.attempts}/${requiredAttempts}`
      : `Pet đang cố gắng học... Hãy thử lại!`,
  };
}

export interface PerformResult {
  success: boolean;
  error?: string;
  trick?: TrickDef;
  learned?: LearnedTrick;
  xpGained?: number;
  message: string;
}

export function performTrick(
  trickId: string,
  stats: PetStatsWithTricks,
  now: number = Date.now()
): PerformResult {
  ensureTricksStructure(stats);
  const trick = getTrickById(trickId);
  if (!trick) {
    return { success: false, error: 'Trick không tồn tại', message: 'Trick không tồn tại' };
  }

  const learned = stats.tricks!.learned.find((t) => t.trickId === trickId);
  if (!learned) {
    return {
      success: false,
      error: `Pet chưa học trick "${trick.displayName}"`,
      message: `Pet chưa học trick "${trick.displayName}"`,
    };
  }

  const lastTrickAt = stats.tricks!.lastTrickAt || 0;
  if (now - lastTrickAt < PERFORM_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((PERFORM_COOLDOWN_MS - (now - lastTrickAt)) / 1000);
    return {
      success: false,
      error: `Pet cần nghỉ ${waitSeconds}s trước khi làm trick tiếp`,
      message: `Pet cần nghỉ ${waitSeconds}s trước khi làm trick tiếp`,
    };
  }

  learned.successCount = (learned.successCount || 0) + 1;
  learned.masteryLevel = Math.min(MAX_MASTERY_LEVEL, Number(((learned.masteryLevel || 1) + 0.1).toFixed(1)));

  stats.tricks!.lastTrickAt = now;
  stats.tricks!.totalTricksPerformed = (stats.tricks!.totalTricksPerformed || 0) + 1;

  const xpGained = Math.round(5 * (learned.masteryLevel || 1));

  return {
    success: true,
    trick,
    learned,
    xpGained,
    message: `Pet biểu diễn "${trick.displayName}" ${trick.emoji} xuất sắc! (+${xpGained} XP)`,
  };
}

// ============================================================================
// Command parsing (Vietnamese + English + trick id)
// ============================================================================

export function parseCommand(
  input: string,
  stats: PetStatsWithTricks,
  now: number = Date.now()
): PerformResult | { success: false; error: string; message: string } {
  const normalized = (input || '').toLowerCase().trim();
  if (!normalized) {
    return { success: false, error: 'Vui lòng nhập lệnh', message: 'Vui lòng nhập lệnh' };
  }

  for (const trick of listAllTricks()) {
    if (
      trick.command === normalized ||
      trick.id === normalized ||
      trick.displayName.toLowerCase() === normalized
    ) {
      return performTrick(trick.id, stats, now);
    }
  }

  return {
    success: false,
    error: `Không nhận diện được lệnh "${input}"`,
    message: `Không nhận diện được lệnh "${input}"`,
  };
}
