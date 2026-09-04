/**
 * Streak Types + Tracker
 *
 * Port từ desktop `src/core/stats/streak-tracker.js`. Quản lý chuỗi
 * ngày user tương tác với pet. Tính bonus multiplier cho rewards.
 *
 * Step 6 — xem docs/steps/step-06-quests-upgrade.md.
 */

export interface Streak {
  /** Số ngày hiện tại */
  current: number;
  /** Số ngày kỷ lục */
  longest: number;
  /** Timestamp của lần claim gần nhất */
  lastClaimedAt: number;
  /** Bonus multiplier for rewardXP — scale 1.0 → 2.0 dựa trên streak */
  bonusMultiplier: number;
}

/**
 * Tính bonus multiplier dựa trên streak:
 *  - 0-1 ngày: ×1.0
 *  - 2-6 ngày: tăng đều ×1.0 → ×1.3
 *  - 7-29 ngày: ×1.5
 *  - 30-99 ngày: ×1.7
 *  - 100+ ngày: ×2.0 (cap)
 */
export function calcBonusMultiplier(current: number): number {
  if (current <= 1) return 1.0;
  if (current < 7) return 1.0 + (current - 1) * 0.05; // ×1.0 → ×1.25
  if (current < 30) return 1.5;
  if (current < 100) return 1.7;
  return 2.0;
}

/**
 * Tạo streak mặc định cho user mới.
 */
export function makeFreshStreak(): Streak {
  return {
    current: 0,
    longest: 0,
    lastClaimedAt: 0,
    bonusMultiplier: 1.0,
  };
}

/**
 * Tính streak mới sau khi claim (tăng nếu consecutive day, reset nếu
 * bỏ ngày). Pure.
 *
 * @param prev streak hiện tại
 * @param nowTs claim timestamp hiện tại
 */
export function nextDayStreak(prev: Streak, nowTs: number): Streak {
  if (prev.lastClaimedAt === 0) {
    return {
      current: 1,
      longest: Math.max(1, prev.longest),
      lastClaimedAt: nowTs,
      bonusMultiplier: calcBonusMultiplier(1),
    };
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const elapsed = nowTs - prev.lastClaimedAt;
  let nextCurrent: number;

  if (elapsed < oneDayMs) {
    // Same day — không tăng
    nextCurrent = prev.current;
  } else if (elapsed < 2 * oneDayMs) {
    // Consecutive
    nextCurrent = prev.current + 1;
  } else {
    // Gap >= 2 ngày → reset
    nextCurrent = 1;
  }

  return {
    current: nextCurrent,
    longest: Math.max(prev.longest, nextCurrent),
    lastClaimedAt: nowTs,
    bonusMultiplier: calcBonusMultiplier(nextCurrent),
  };
}

/**
 * Format streak text. Ví dụ: "🔥 12 days" hoặc "🔥 1 day".
 */
export function streakLabel(s: Streak): string {
  const days = s.current;
  const dayWord = days === 1 ? 'day' : 'days';
  return `🔥 ${days} ${dayWord}`;
}

/**
 * Format bonus multiplier: "×1.5" (rounded 1 decimal).
 */
export function formatBonus(mult: number): string {
  return `×${mult.toFixed(mult % 1 === 0 ? 1 : 1)}`;
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__STREAK_API__ = {
    calcBonusMultiplier,
    nextDayStreak,
    streakLabel,
    formatBonus,
    makeFreshStreak,
  };
  (globalThis as any).__TEST_CALC_BONUS__ = (days: number) => calcBonusMultiplier(days);
  (globalThis as any).__TEST_NEXT_STREAK__ = (startDays: number) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    return nextDayStreak(
      {
        current: startDays,
        longest: startDays,
        lastClaimedAt: now - oneDay,
        bonusMultiplier: calcBonusMultiplier(startDays),
      },
      now
    );
  };
  (globalThis as any).__TEST_STREAK_LABEL__ = (days: number) =>
    streakLabel({
      current: days,
      longest: days,
      lastClaimedAt: 0,
      bonusMultiplier: 1.0,
    });
  if (typeof window !== 'undefined') {
    (window as any).__STREAK_API__ = (globalThis as any).__STREAK_API__;
    (window as any).__TEST_CALC_BONUS__ = (globalThis as any).__TEST_CALC_BONUS__;
    (window as any).__TEST_NEXT_STREAK__ = (globalThis as any).__TEST_NEXT_STREAK__;
    (window as any).__TEST_STREAK_LABEL__ = (globalThis as any).__TEST_STREAK_LABEL__;
  }
}
