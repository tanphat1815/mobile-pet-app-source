/**
 * WellnessStore (Zustand) — Step 12a
 *
 * Holds wellness sessions, gratitude journal entries, and mood tracker
 * entries. All persisted to AsyncStorage via the existing `storage`
 * helper.
 */

import { create } from 'zustand';
import {
  WellnessSession,
  GratitudeEntry,
  MoodEntry,
  PomodoroConfig,
  DEFAULT_POMODORO,
  WELLNESS_STORAGE_KEYS,
  todayISO,
} from '../api/wellness';
import { storage } from '../api/storage';

// ============================================================================
// Types
// ============================================================================

export interface WellnessState {
  sessions: WellnessSession[];
  gratitude: GratitudeEntry[];
  mood: MoodEntry[];
  pomodoroConfig: PomodoroConfig;
  hydrated: boolean;

  // Session actions
  startSession: (kind: WellnessSession['kind'], preset?: string) => WellnessSession;
  endSession: (id: string, durationSec: number, notes?: string) => void;

  // Gratitude actions
  addGratitude: (content: string) => GratitudeEntry;
  removeGratitude: (id: string) => void;

  // Mood actions
  addMood: (score: MoodEntry['score'], tags: string[], notes?: string) => MoodEntry;
  removeMood: (id: string) => void;

  // Pomodoro
  setPomodoroConfig: (config: Partial<PomodoroConfig>) => void;

  // Hydration
  hydrate: () => Promise<void>;
  clearAll: () => void;
}

// ============================================================================
// Persistence helpers
// ============================================================================

async function persistJSON<T>(key: string, value: T): Promise<void> {
  try {
    await storage.setJSON(key as any, value);
  } catch {
    /* ignore */
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Store
// ============================================================================

export const useWellnessStore = create<WellnessState>((set, get) => ({
  sessions: [],
  gratitude: [],
  mood: [],
  pomodoroConfig: { ...DEFAULT_POMODORO },
  hydrated: false,

  // ============================================================================
  // Sessions
  // ============================================================================

  startSession: (kind, preset) => {
    const session: WellnessSession = {
      id: generateId('ws'),
      kind,
      startedAt: new Date().toISOString(),
      durationSec: 0,
      preset,
    };
    set({ sessions: [...get().sessions, session] });
    persistJSON(WELLNESS_STORAGE_KEYS.Sessions, get().sessions);
    return session;
  },

  endSession: (id, durationSec, notes) => {
    const next = get().sessions.map((s) =>
      s.id === id
        ? {
            ...s,
            endedAt: new Date().toISOString(),
            durationSec,
            notes,
          }
        : s
    );
    set({ sessions: next });
    persistJSON(WELLNESS_STORAGE_KEYS.Sessions, next);
  },

  // ============================================================================
  // Gratitude
  // ============================================================================

  addGratitude: (content) => {
    const entry: GratitudeEntry = {
      id: generateId('g'),
      userId: 'self',
      date: todayISO(),
      content,
      createdAt: new Date().toISOString(),
    };
    const next = [...get().gratitude, entry];
    set({ gratitude: next });
    persistJSON(WELLNESS_STORAGE_KEYS.Gratitude, next);
    return entry;
  },

  removeGratitude: (id) => {
    const next = get().gratitude.filter((g) => g.id !== id);
    set({ gratitude: next });
    persistJSON(WELLNESS_STORAGE_KEYS.Gratitude, next);
  },

  // ============================================================================
  // Mood
  // ============================================================================

  addMood: (score, tags, notes) => {
    const entry: MoodEntry = {
      id: generateId('m'),
      userId: 'self',
      date: todayISO(),
      score,
      tags,
      notes,
      createdAt: new Date().toISOString(),
    };
    const next = [...get().mood, entry];
    set({ mood: next });
    persistJSON(WELLNESS_STORAGE_KEYS.Mood, next);
    return entry;
  },

  removeMood: (id) => {
    const next = get().mood.filter((m) => m.id !== id);
    set({ mood: next });
    persistJSON(WELLNESS_STORAGE_KEYS.Mood, next);
  },

  // ============================================================================
  // Pomodoro config
  // ============================================================================

  setPomodoroConfig: (config) => {
    const next = { ...get().pomodoroConfig, ...config };
    set({ pomodoroConfig: next });
    persistJSON(WELLNESS_STORAGE_KEYS.PomodoroConfig, next);
  },

  // ============================================================================
  // Hydration
  // ============================================================================

  hydrate: async () => {
    if (get().hydrated) return;
    const [sessions, gratitude, mood, pomodoroConfig] = await Promise.all([
      storage.getJSON<WellnessSession[]>(WELLNESS_STORAGE_KEYS.Sessions as any),
      storage.getJSON<GratitudeEntry[]>(WELLNESS_STORAGE_KEYS.Gratitude as any),
      storage.getJSON<MoodEntry[]>(WELLNESS_STORAGE_KEYS.Mood as any),
      storage.getJSON<PomodoroConfig>(WELLNESS_STORAGE_KEYS.PomodoroConfig as any),
    ]);
    set({
      sessions: sessions ?? [],
      gratitude: gratitude ?? [],
      mood: mood ?? [],
      pomodoroConfig: pomodoroConfig ?? { ...DEFAULT_POMODORO },
      hydrated: true,
    });
  },

  clearAll: () => {
    set({
      sessions: [],
      gratitude: [],
      mood: [],
    });
    persistJSON(WELLNESS_STORAGE_KEYS.Sessions, []);
    persistJSON(WELLNESS_STORAGE_KEYS.Gratitude, []);
    persistJSON(WELLNESS_STORAGE_KEYS.Mood, []);
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectStreak = (s: WellnessState): number => {
  // Imported lazily to avoid a cycle with @/api/wellness (already there)
  const { streakFromSessions } = require('../api/wellness');
  return streakFromSessions(s.sessions);
};

export const selectTodayMinutes = (s: WellnessState): number => {
  const { totalMinutes } = require('../api/wellness');
  return totalMinutes(s.sessions, 1);
};
