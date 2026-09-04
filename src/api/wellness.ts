/**
 * Wellness Domain — Step 12a
 *
 * Types and helpers for wellness sessions, gratitude journal, and
 * mood tracker. Mirrors `desktop-pet-app-source/src/core/wellness/`.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

export type WellnessKind =
  | 'meditation'
  | 'breathing'
  | 'pomodoro'
  | 'ambient'
  | 'gratitude'
  | 'mood';

export interface WellnessSession {
  id: string;
  kind: WellnessKind;
  /** ISO timestamp */
  startedAt: string;
  /** ISO timestamp; undefined while in progress */
  endedAt?: string;
  durationSec: number;
  /** Preset id (e.g. '4-7-8', 'box') */
  preset?: string;
  /** User notes for the session */
  notes?: string;
}

export interface GratitudeEntry {
  id: string;
  userId: string;
  /** YYYY-MM-DD */
  date: string;
  content: string;
  createdAt: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  date: string;
  score: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  notes?: string;
  createdAt: string;
}

// ============================================================================
// Breathing presets
// ============================================================================

export interface BreathingPreset {
  id: string;
  label: string;
  description: string;
  inhale: number; // seconds
  hold1: number;  // hold after inhale
  exhale: number;
  hold2: number;  // hold after exhale (0 for some)
  cycles: number; // recommended number of cycles
}

export const BREATHING_PRESETS: BreathingPreset[] = [
  {
    id: '4-7-8',
    label: '4-7-8 Relax',
    description: 'Inhale 4, hold 7, exhale 8 — calming',
    inhale: 4, hold1: 7, exhale: 8, hold2: 0, cycles: 4,
  },
  {
    id: 'box',
    label: 'Box Breathing',
    description: 'Inhale 4, hold 4, exhale 4, hold 4',
    inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 5,
  },
  {
    id: 'alternate-nostril',
    label: 'Alternate Nostril',
    description: 'Inhale 4, hold 4, exhale 4, hold 4 (right-left)',
    inhale: 4, hold1: 4, exhale: 4, hold2: 4, cycles: 6,
  },
  {
    id: 'energizing',
    label: 'Energizing',
    description: 'Inhale 6, hold 1, exhale 4 — quick',
    inhale: 6, hold1: 1, exhale: 4, hold2: 0, cycles: 5,
  },
];

export function getPresetById(id: string): BreathingPreset | undefined {
  return BREATHING_PRESETS.find((p) => p.id === id);
}

// ============================================================================
// Pomodoro config
// ============================================================================

export interface PomodoroConfig {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesBeforeLongBreak: number;
}

export const DEFAULT_POMODORO: PomodoroConfig = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLongBreak: 4,
};

// ============================================================================
// Meditation presets
// ============================================================================

export interface MeditationPreset {
  id: string;
  label: string;
  durationMin: number;
  description: string;
}

export const MEDITATION_PRESETS: MeditationPreset[] = [
  { id: '5min',  label: '5 min',  durationMin: 5,  description: 'Quick reset' },
  { id: '10min', label: '10 min', durationMin: 10, description: 'Mindful break' },
  { id: '15min', label: '15 min', durationMin: 15, description: 'Deep focus' },
  { id: '20min', label: '20 min', durationMin: 20, description: 'Body scan' },
  { id: '30min', label: '30 min', durationMin: 30, description: 'Full session' },
];

// ============================================================================
// Helpers — formatting
// ============================================================================

export function formatTime(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compute a 7-day wellness streak. Counts consecutive days (including
 * today) where the user logged ≥ 1 session of any kind.
 */
export function streakFromSessions(
  sessions: WellnessSession[],
  now: Date = new Date()
): number {
  if (sessions.length === 0) return 0;
  const daySet = new Set<string>();
  for (const s of sessions) {
    const date = new Date(s.startedAt);
    const k = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    daySet.add(k);
  }
  let streak = 0;
  const cursor = new Date(now);
  while (true) {
    const k = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (daySet.has(k)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Compute total minutes of all sessions within a window (in days).
 */
export function totalMinutes(
  sessions: WellnessSession[],
  windowDays = 7,
  now: Date = new Date()
): number {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  let total = 0;
  for (const s of sessions) {
    if (new Date(s.startedAt).getTime() >= cutoff) {
      total += Math.round(s.durationSec / 60);
    }
  }
  return total;
}

/**
 * Group gratitude entries by date (newest first).
 */
export function groupGratitudeByDate(
  entries: GratitudeEntry[]
): Record<string, GratitudeEntry[]> {
  const out: Record<string, GratitudeEntry[]> = {};
  for (const e of entries) {
    if (!out[e.date]) out[e.date] = [];
    out[e.date].push(e);
  }
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return out;
}

/**
 * Mood score history (last N days), returning { date, score } pairs in
 * chronological order. Days without entries get null score.
 */
export interface MoodHistoryPoint {
  date: string;
  score: number | null;
}

export function moodHistory(
  entries: MoodEntry[],
  days: number = 14,
  now: Date = new Date()
): MoodHistoryPoint[] {
  const byDate = new Map<string, MoodEntry[]>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }
  const out: MoodHistoryPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayEntries = byDate.get(k);
    if (dayEntries && dayEntries.length > 0) {
      // Average score for that day
      const sum = dayEntries.reduce((acc, e) => acc + e.score, 0);
      out.push({ date: k, score: Math.round(sum / dayEntries.length) });
    } else {
      out.push({ date: k, score: null });
    }
  }
  return out;
}

// ============================================================================
// Storage keys
// ============================================================================

export const WELLNESS_STORAGE_KEYS = {
  Sessions: 'wellness.sessions',
  Gratitude: 'wellness.gratitude',
  Mood: 'wellness.mood',
  PomodoroConfig: 'wellness.pomodoro_config',
} as const;

// ============================================================================
// Dev expose (Step 12a) — e2e tests
// ============================================================================
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__WELLNESS_FORMAT_TIME__ = formatTime;
  (globalThis as any).__WELLNESS_BREATHING_COUNT__ = BREATHING_PRESETS.length;
  (globalThis as any).__WELLNESS_MEDITATION_COUNT__ = MEDITATION_PRESETS.length;
  if (typeof window !== 'undefined') {
    (window as any).__WELLNESS_FORMAT_TIME__ = formatTime;
    (window as any).__WELLNESS_BREATHING_COUNT__ = BREATHING_PRESETS.length;
    (window as any).__WELLNESS_MEDITATION_COUNT__ = MEDITATION_PRESETS.length;
  }
}
