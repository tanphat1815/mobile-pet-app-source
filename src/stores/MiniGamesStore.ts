/**
 * MiniGamesStore (Zustand) — Step 12g
 *
 * Stores high scores + recent plays for both mini-games. Pure helpers
 * (spawnCatchFallObject, tickCatchFall, pressTiming, ...) are called
 * directly from screens via the dev exposes during gameplay; this
 * store handles persistence and metrics.
 */

import { create } from 'zustand';
import { storage, StorageKeys } from '../api/storage';
import {
  GAME_IDS,
  GAMES as GAME_META,
  buildGameScore,
  ensureMiniGamesStructure,
  getHighScore,
  getRecentScores,
  recordGameResult,
  xpFromScore,
  type GameId,
  type GameMeta,
  type GameScore,
  type MiniGamesState,
} from '../api/miniGames';

// Re-export alias for screens that import META from here
const META: Record<GameId, GameMeta> = GAME_META as unknown as Record<GameId, GameMeta>;

const DEFAULT_STATE: MiniGamesState = {
  highScores: { catch_fall: 0, timing: 0 },
  recent: [],
  totalPlayed: 0,
  totalWins: 0,
};

export interface MiniGamesStoreState {
  state: MiniGamesState;
  initialized: boolean;
  hydrate: () => Promise<void>;
  reset: () => void;
  recordResult: (gameId: GameId, score: number, success: boolean, durationSec: number) => GameScore;
  // Selectors
  selectHighScore: (gameId: GameId) => number;
  selectRecent: (gameId?: GameId, limit?: number) => GameScore[];
  selectTotalPlayed: () => number;
  selectTotalWins: () => number;
  selectXpEarnedFromScore: (score: number) => number;
  selectMeta: (gameId: GameId) => GameMeta | null;
  selectAllGames: () => GameMeta[];
  selectRecentSummary: () => GameMeta[];
  _persist: () => Promise<void>;
}

export const useMiniGamesStore = create<MiniGamesStoreState>((set, get) => ({
  state: { ...DEFAULT_STATE },
  initialized: false,

  async hydrate() {
    const raw = await storage.getJSON<MiniGamesState>(StorageKeys.MiniGamesState);
    const next = ensureMiniGamesStructure(raw ?? null);
    set({ state: next, initialized: true });
    await storage.setJSON(StorageKeys.MiniGamesState, next);
  },

  reset() {
    set({ state: { ...DEFAULT_STATE }, initialized: true });
    storage.delete(StorageKeys.MiniGamesState).catch(() => undefined);
  },

  recordResult(gameId, score, success, durationSec) {
    const result = buildGameScore(gameId, score, success, durationSec);
    const cur = get().state;
    const next = recordGameResult(cur, result);
    set({ state: next });
    storage.setJSON(StorageKeys.MiniGamesState, next).catch(() => undefined);
    return result;
  },

  selectHighScore(gameId) {
    return getHighScore(get().state, gameId);
  },
  selectRecent(gameId, limit) {
    return getRecentScores(get().state, gameId, limit);
  },
  selectTotalPlayed() {
    return get().state.totalPlayed;
  },
  selectTotalWins() {
    return get().state.totalWins;
  },
  selectXpEarnedFromScore(score) {
    return xpFromScore(score);
  },
  selectMeta(gameId) {
    return META[gameId] ?? null;
  },
  selectAllGames() {
    return Object.values(META);
  },
  selectRecentSummary() {
    // Most recently played distinct games, sorted by recency
    const seen = new Set<string>();
    const list: GameMeta[] = [];
    for (const r of get().state.recent) {
      if (seen.has(r.gameId)) continue;
      seen.add(r.gameId);
      const m = META[r.gameId as GameId];
      if (m) list.push(m);
    }
    return list;
  },

  async _persist() {
    await storage.setJSON(StorageKeys.MiniGamesState, get().state);
  },
}));
