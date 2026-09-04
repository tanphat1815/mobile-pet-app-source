/**
 * Wellness dev exposes — Step 12a e2e
 *
 * Side-effect module installed when running in __DEV__ mode. Adds
 * window hooks that allow the Playwright e2e tests to drive the
 * WellnessStore without rendering screens.
 */

import {
  useWellnessStore,
} from '../stores/WellnessStore';
import {
  AMBIENT_SOUNDS,
} from './ambientSounds';
import {
  BREATHING_PRESETS,
  MEDITATION_PRESETS,
  formatTime,
  streakFromSessions,
  moodHistory,
  DEFAULT_POMODORO,
} from './wellness';
import { formatTime as fmt } from './wellness';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  // Reads
  (globalThis as any).__WELLNESS_GET_GRATITUDE_COUNT__ = () =>
    useWellnessStore.getState().gratitude.length;
  (globalThis as any).__WELLNESS_GET_MOOD_LIST__ = () =>
    useWellnessStore.getState().mood;

  // Writes
  (globalThis as any).__WELLNESS_ADD_SESSION__ = (
    kind: 'meditation' | 'breathing' | 'pomodoro' | 'ambient' | 'gratitude' | 'mood',
    preset?: string
  ) => useWellnessStore.getState().startSession(kind, preset);
  (globalThis as any).__WELLNESS_ADD_GRATITUDE__ = (content: string) =>
    useWellnessStore.getState().addGratitude(content);
  (globalThis as any).__WELLNESS_REMOVE_GRATITUDE__ = (id: string) =>
    useWellnessStore.getState().removeGratitude(id);
  (globalThis as any).__WELLNESS_ADD_MOOD__ = (
    score: 1 | 2 | 3 | 4 | 5,
    tags: string[],
    notes?: string
  ) => useWellnessStore.getState().addMood(score, tags, notes);
  (globalThis as any).__WELLNESS_REMOVE_MOOD__ = (id: string) =>
    useWellnessStore.getState().removeMood(id);

  // Computed
  (globalThis as any).__WELLNESS_STREAK_TODAY__ = () => {
    // add a "today" session then return streak (so test sees ≥1)
    const store = useWellnessStore.getState();
    const s = store.startSession('meditation', 'streak-test');
    store.endSession(s.id, 300);
    return streakFromSessions(useWellnessStore.getState().sessions);
  };
  (globalThis as any).__WELLNESS_MOOD_HISTORY_LEN__ = () =>
    moodHistory(useWellnessStore.getState().mood, 14).length;

  // Ambient catalog
  (globalThis as any).__WELLNESS_AMBIENT_COUNT__ = AMBIENT_SOUNDS.length;
  (globalThis as any).__WELLNESS_AMBIENT_IDS__ = AMBIENT_SOUNDS.map((s) => s.id);

  // Pomodoro config
  (globalThis as any).__WELLNESS_POMODORO_INITIAL__ = () =>
    fmt(DEFAULT_POMODORO.focusMin * 60);

  // Mirror to window for Playwright
  if (typeof window !== 'undefined') {
    const w = window as any;
    w.__WELLNESS_GET_GRATITUDE_COUNT__ = (globalThis as any).__WELLNESS_GET_GRATITUDE_COUNT__;
    w.__WELLNESS_GET_MOOD_LIST__ = (globalThis as any).__WELLNESS_GET_MOOD_LIST__;
    w.__WELLNESS_ADD_SESSION__ = (globalThis as any).__WELLNESS_ADD_SESSION__;
    w.__WELLNESS_ADD_GRATITUDE__ = (globalThis as any).__WELLNESS_ADD_GRATITUDE__;
    w.__WELLNESS_REMOVE_GRATITUDE__ = (globalThis as any).__WELLNESS_REMOVE_GRATITUDE__;
    w.__WELLNESS_ADD_MOOD__ = (globalThis as any).__WELLNESS_ADD_MOOD__;
    w.__WELLNESS_REMOVE_MOOD__ = (globalThis as any).__WELLNESS_REMOVE_MOOD__;
    w.__WELLNESS_STREAK_TODAY__ = (globalThis as any).__WELLNESS_STREAK_TODAY__;
    w.__WELLNESS_MOOD_HISTORY_LEN__ = (globalThis as any).__WELLNESS_MOOD_HISTORY_LEN__;
    w.__WELLNESS_AMBIENT_COUNT__ = (globalThis as any).__WELLNESS_AMBIENT_COUNT__;
    w.__WELLNESS_AMBIENT_IDS__ = (globalThis as any).__WELLNESS_AMBIENT_IDS__;
    w.__WELLNESS_POMODORO_INITIAL__ = (globalThis as any).__WELLNESS_POMODORO_INITIAL__;
  }
}
