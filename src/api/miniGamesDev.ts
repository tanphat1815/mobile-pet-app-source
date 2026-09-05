/**
 * Mini-games dev exposes — Step 12g e2e
 *
 * Side-effect module that registers __MG_*__ globals on globalThis + window
 * for Playwright to drive game state deterministically.
 */

import {
  GAME_IDS,
  GAMES,
  buildGameScore,
  createCatchFallState,
  createTimingState,
  decrementTime,
  ensureMiniGamesStructure,
  finishCatchFall,
  finishTiming,
  getHighScore,
  getRecentScores,
  nextTimingRound,
  pressTiming,
  recordGameResult,
  setPaddleX,
  spawnCatchFallObject,
  startCatchFall,
  startTiming,
  tickCatchFall,
  tickTimingIndicator,
  xpFromScore,
  type CatchFallState,
  type GameId,
  type TimingState,
} from './miniGames';
import { useMiniGamesStore } from '../stores/MiniGamesStore';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  const g = globalThis as any;
  const w = typeof window !== 'undefined' ? (window as any) : null;

  // ── Catalog ──
  g.__MG_GAME_IDS__ = Object.values(GAME_IDS);
  g.__MG_CATCH_FALL__ = GAMES.catch_fall;
  g.__MG_TIMING__ = GAMES.timing;

  // ── Pure helpers ──
  g.__MG_GET_HIGH__ = (gameId: GameId) => getHighScore(useMiniGamesStore.getState().state, gameId);
  g.__MG_GET_RECENT__ = (gameId?: GameId, limit?: number) =>
    getRecentScores(useMiniGamesStore.getState().state, gameId, limit);
  g.__MG_XP_FROM_SCORE__ = (s: number) => xpFromScore(s);

  // Catch Fall
  g.__MG_CF_CREATE__ = (opts?: { now?: number; paddleX?: number; lives?: number; timeLeft?: number }) =>
    createCatchFallState(opts);
  g.__MG_CF_START__ = (s: CatchFallState) => startCatchFall(s);
  g.__MG_CF_SPAWN__ = (randomFn?: () => number) => spawnCatchFallObject({ randomFn });
  g.__MG_CF_TICK__ = (state: CatchFallState, opts?: { now?: number; deltaMs?: number; randomFn?: () => number }) =>
    tickCatchFall({ state, ...(opts ?? {}) });
  g.__MG_CF_SET_PADDLE__ = setPaddleX;
  g.__MG_CF_TICK_TIME__ = decrementTime;
  g.__MG_CF_FINISH__ = (s: CatchFallState, success?: boolean) => finishCatchFall(s, success);

  // Timing
  g.__MG_T_CREATE__ = createTimingState;
  g.__MG_T_START__ = (s: TimingState, randomFn?: () => number) => startTiming(s, randomFn);
  g.__MG_T_NEXT__ = (s: TimingState, randomFn?: () => number) => nextTimingRound(s, randomFn);
  g.__MG_T_INDICATOR__ = (s: TimingState, units?: number) => tickTimingIndicator(s, units);
  g.__MG_T_PRESS__ = (s: TimingState) => pressTiming(s);
  g.__MG_T_FINISH__ = (s: TimingState, success?: boolean) => finishTiming(s, success);

  // ── Persistence ──
  g.__MG_BUILD_SCORE__ = (gameId: GameId, score: number, success: boolean, durationSec: number) =>
    buildGameScore(gameId, score, success, durationSec);
  g.__MG_RECORD_RESULT__ = (gameId: GameId, score: number, success: boolean, durationSec: number) =>
    useMiniGamesStore.getState().recordResult(gameId, score, success, durationSec);
  g.__MG_RECORD_RAW__ = (state: any, result: any) => recordGameResult(state, result);
  g.__MG_ENSURE__ = (s: any) => ensureMiniGamesStructure(s);

  // ── Store ──
  g.__MG_RESET__ = () => useMiniGamesStore.getState().reset();
  g.__MG_HYDRATE__ = () => useMiniGamesStore.getState().hydrate();
  g.__MG_GET_STATE__ = () => useMiniGamesStore.getState().state;
  g.__MG_GET_HIGH_STORE__ = (gameId: GameId) => useMiniGamesStore.getState().selectHighScore(gameId);
  g.__MG_GET_RECENT_STORE__ = (gameId?: GameId, limit?: number) =>
    useMiniGamesStore.getState().selectRecent(gameId, limit);
  g.__MG_GET_TOTAL_PLAYED__ = () => useMiniGamesStore.getState().selectTotalPlayed();
  g.__MG_GET_TOTAL_WINS__ = () => useMiniGamesStore.getState().selectTotalWins();
  g.__MG_GET_META__ = (gameId: GameId) => useMiniGamesStore.getState().selectMeta(gameId);
  g.__MG_GET_ALL_GAMES__ = () => useMiniGamesStore.getState().selectAllGames();

  if (w) {
    const keys = [
      '__MG_GAME_IDS__',
      '__MG_CATCH_FALL__',
      '__MG_TIMING__',
      '__MG_GET_HIGH__',
      '__MG_GET_RECENT__',
      '__MG_XP_FROM_SCORE__',
      '__MG_CF_CREATE__',
      '__MG_CF_START__',
      '__MG_CF_SPAWN__',
      '__MG_CF_TICK__',
      '__MG_CF_SET_PADDLE__',
      '__MG_CF_TICK_TIME__',
      '__MG_CF_FINISH__',
      '__MG_T_CREATE__',
      '__MG_T_START__',
      '__MG_T_NEXT__',
      '__MG_T_INDICATOR__',
      '__MG_T_PRESS__',
      '__MG_T_FINISH__',
      '__MG_BUILD_SCORE__',
      '__MG_RECORD_RESULT__',
      '__MG_RECORD_RAW__',
      '__MG_ENSURE__',
      '__MG_RESET__',
      '__MG_HYDRATE__',
      '__MG_GET_STATE__',
      '__MG_GET_HIGH_STORE__',
      '__MG_GET_RECENT_STORE__',
      '__MG_GET_TOTAL_PLAYED__',
      '__MG_GET_TOTAL_WINS__',
      '__MG_GET_META__',
      '__MG_GET_ALL_GAMES__',
    ];
    for (const k of keys) (w as any)[k] = (g as any)[k];
  }
}
