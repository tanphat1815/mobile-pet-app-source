/**
 * MusicStore (Zustand) — Step 12b
 *
 * Holds music playback state:
 *  - currentTrack / queue / isPlaying / currentTime / duration
 *  - volume / shuffle / repeat
 *  - 3-band EQ (bass/mid/treble)
 *  - sleepTimer (minutes remaining) + endAt timestamp
 *  - history of played tracks
 *
 * The actual audio engine is injected via `setEngine()` from the
 * MusicPlayer / MusicHomeScreen. The store stays platform-agnostic.
 */

import { create } from 'zustand';
import {
  BUILTIN_TRACKS,
  EQ_PRESETS,
  getEQPresetByKey,
  type Track,
  type RepeatMode,
} from '../api/music';
import { storage, StorageKeys } from '../api/storage';

export interface EQ {
  bass: number;
  mid: number;
  treble: number;
}

export interface MusicState {
  // Playback
  currentTrack: Track | null;
  queue: Track[];
  queueIdx: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Modes
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;

  // EQ
  eq: EQ;

  // Sleep timer
  sleepTimerEndAt: number | null;

  // History (track ids in order)
  history: string[];

  // Engine handle (set by MusicPlayer on mount)
  _engine: any;

  // ─── actions ───
  setEngine: (engine: any) => void;
  play: (track?: Track) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (sec: number) => void;
  setVolume: (v: number) => void;
  setShuffle: (b: boolean) => void;
  setRepeat: (m: RepeatMode) => void;
  setEQ: (band: keyof EQ, value: number) => void;
  applyEQPreset: (key: string) => void;
  setSleepTimer: (minutes: number | null) => void;
  tickProgress: (deltaSec?: number) => void;
  syncFromTrack: (track: Track) => void;
  reset: () => void;

  // Persistence
  hydrate: () => Promise<void>;

  // private helpers (exposed for tests via store.getState())
  _recordPlay: (track: Track) => void;
  _persist: () => Promise<void>;
}

export const MUSIC_STORAGE_KEY = StorageKeys.MusicState;

interface PersistedSlice {
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  eq: EQ;
  history: string[];
}

const DEFAULT_EQ: EQ = { bass: 0, mid: 0, treble: 0 };

export const useMusicStore = create<MusicState>((set, get) => ({
  currentTrack: null,
  queue: [...BUILTIN_TRACKS],
  queueIdx: 0,
  isPlaying: false,
  currentTime: 0,
  duration: BUILTIN_TRACKS[0]?.duration ?? 180,

  volume: 0.7,
  shuffle: false,
  repeat: 'all',

  eq: { ...DEFAULT_EQ },
  sleepTimerEndAt: null,
  history: [],
  _engine: null,

  setEngine(engine) {
    set({ _engine: engine });
  },

  play(track) {
    const state = get();
    let nextTrack = track ?? state.currentTrack ?? state.queue[state.queueIdx] ?? BUILTIN_TRACKS[0];
    if (!nextTrack) return;

    const foundIdx = state.queue.findIndex((t) => t.id === nextTrack!.id);
    if (foundIdx !== -1) {
      set({ queueIdx: foundIdx });
    } else {
      const newQueue = [nextTrack, ...state.queue];
      set({ queue: newQueue, queueIdx: 0 });
    }

    set({
      currentTrack: nextTrack,
      duration: nextTrack.duration,
      currentTime: 0,
      isPlaying: true,
    });

    if (state._engine && typeof state._engine.play === 'function') {
      try {
        state._engine.play(nextTrack);
      } catch {
        // synth unavailable (native) — UI keeps working
      }
    }

    get()._recordPlay(nextTrack);
    void get()._persist();
  },

  pause() {
    const state = get();
    set({ isPlaying: false });
    if (state._engine?.stop) {
      try { state._engine.stop(); } catch { /* noop */ }
    }
  },

  togglePlay() {
    const state = get();
    if (state.isPlaying) {
      get().pause();
    } else {
      if (state.currentTrack) {
        set({ isPlaying: true });
        if (state._engine?.play && state.currentTrack) {
          try { state._engine.play(state.currentTrack); } catch { /* noop */ }
        }
      } else {
        get().play();
      }
    }
  },

  next() {
    const { queue, queueIdx, shuffle, repeat, isPlaying } = get();
    if (!queue.length) return;

    let nextIdx: number;
    if (shuffle) {
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === queueIdx && queue.length > 1);
    } else {
      nextIdx = (queueIdx + 1) % queue.length;
      if (nextIdx === 0 && repeat === 'none') {
        get().pause();
        set({ currentTime: 0 });
        return;
      }
    }
    set({ queueIdx: nextIdx });
    get().play(queue[nextIdx]);
  },

  previous() {
    const { queue, queueIdx, shuffle, currentTime } = get();
    if (!queue.length) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    let prevIdx: number;
    if (shuffle) {
      prevIdx = Math.floor(Math.random() * queue.length);
    } else {
      prevIdx = (queueIdx - 1 + queue.length) % queue.length;
    }
    set({ queueIdx: prevIdx });
    get().play(queue[prevIdx]);
  },

  seek(sec) {
    const { duration } = get();
    const v = Math.max(0, Math.min(duration, Number(sec) || 0));
    set({ currentTime: v });
  },

  setVolume(v) {
    const vol = Math.max(0, Math.min(1, Number(v) || 0));
    set({ volume: vol });
    const eng = get()._engine;
    if (eng?.setMasterGain) {
      try { eng.setMasterGain(vol); } catch { /* noop */ }
    }
    void get()._persist();
  },

  setShuffle(b) {
    set({ shuffle: !!b });
    void get()._persist();
  },

  setRepeat(m) {
    const mode: RepeatMode = ['none', 'one', 'all'].includes(m) ? m : 'all';
    set({ repeat: mode });
    void get()._persist();
  },

  setEQ(band, value) {
    const num = Math.max(-12, Math.min(12, Number(value) || 0));
    const next = { ...get().eq, [band]: num };
    set({ eq: next });
    void get()._persist();
  },

  applyEQPreset(key) {
    const preset = getEQPresetByKey(key) ?? EQ_PRESETS.flat;
    set({ eq: { bass: preset.bass, mid: preset.mid, treble: preset.treble } });
    // Apply to engine if it supports per-band set
    const eng = get()._engine;
    if (eng?.setEQ) {
      try {
        eng.setEQ('bass', preset.bass);
        eng.setEQ('mid', preset.mid);
        eng.setEQ('treble', preset.treble);
      } catch { /* noop */ }
    }
    void get()._persist();
  },

  setSleepTimer(minutes) {
    if (minutes == null) {
      set({ sleepTimerEndAt: null });
      return;
    }
    const mins = Number(minutes) || 15;
    const endAt = Date.now() + mins * 60 * 1000;
    set({ sleepTimerEndAt: endAt });
    // We don't actually setTimeout here — the consumer (MusicHomeScreen)
    // polls the endAt and stops playback when reached.
  },

  tickProgress(deltaSec = 1) {
    const { currentTime, duration, isPlaying, currentTrack, _engine } = get();
    if (!isPlaying) return;
    const next = currentTime + deltaSec;
    if (next >= duration) {
      // ended
      if (_engine?.stop) {
        try { _engine.stop(); } catch { /* noop */ }
      }
      set({ currentTime: duration, isPlaying: false });
      // Auto-next
      const { repeat } = get();
      if (repeat === 'one' && currentTrack) {
        get().play(currentTrack);
      } else {
        get().next();
      }
      return;
    }
    set({ currentTime: next });
  },

  syncFromTrack(track) {
    set({
      currentTrack: track,
      duration: track.duration,
      currentTime: 0,
      isPlaying: true,
    });
  },

  reset() {
    set({
      currentTrack: null,
      queue: [...BUILTIN_TRACKS],
      queueIdx: 0,
      isPlaying: false,
      currentTime: 0,
      duration: BUILTIN_TRACKS[0]?.duration ?? 180,
      volume: 0.7,
      shuffle: false,
      repeat: 'all',
      eq: { ...DEFAULT_EQ },
      sleepTimerEndAt: null,
      history: [],
    });
  },

  // ─── helpers ───
  _recordPlay(track) {
    const id = track.id;
    set((s) => ({ history: [id, ...s.history.filter((h) => h !== id)].slice(0, 50) }));
  },

  _persist: async () => {
    const { volume, shuffle, repeat, eq, history } = get();
    const slice: PersistedSlice = { volume, shuffle, repeat, eq, history };
    try {
      await storage.setJSON(MUSIC_STORAGE_KEY, slice);
    } catch {
      // ignore
    }
  },

  async hydrate() {
    try {
      const raw = await storage.getJSON<PersistedSlice>(MUSIC_STORAGE_KEY);
      if (!raw) return;
      set({
        volume: raw.volume ?? 0.7,
        shuffle: !!raw.shuffle,
        repeat: (raw.repeat as RepeatMode) ?? 'all',
        eq: raw.eq ?? { ...DEFAULT_EQ },
        history: raw.history ?? [],
      });
    } catch {
      // ignore
    }
  },
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectNowPlaying = (s: MusicState) => ({
  track: s.currentTrack,
  isPlaying: s.isPlaying,
  currentTime: s.currentTime,
  duration: s.duration,
  progress: s.duration > 0 ? s.currentTime / s.duration : 0,
});

export const selectVolume = (s: MusicState) => s.volume;
export const selectEQ = (s: MusicState) => s.eq;
export const selectSleepRemainingMs = (s: MusicState): number => {
  if (!s.sleepTimerEndAt) return 0;
  return Math.max(0, s.sleepTimerEndAt - Date.now());
};
