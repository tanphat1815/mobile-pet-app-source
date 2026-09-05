/**
 * Mini-games API — Step 12g
 *
 * Ported from desktop src/core/game-config.js,
 *                  src/core/catch-fall-game.js,
 *                  src/core/timing-game.js.
 *
 * Two mini-games:
 *   - Catch Fall: move paddle horizontally to catch falling objects
 *                 (fish/cake/star/toy = +10..20 pts, bomb = -10, miss = -life)
 *   - Timing: stop indicator inside green zone for max points
 *             (perfect center = 20pts, edge = 10pts, miss = -5pts)
 *
 * Pure logic (no React Native or DOM). The screens implement the render
 * loop and consume GameState + callbacks.
 */

// ============================================================================
// Constants
// ============================================================================

export const GAME_IDS = {
  CATCH_FALL: 'catch_fall',
  TIMING: 'timing',
} as const;

export type GameId = (typeof GAME_IDS)[keyof typeof GAME_IDS];

export const CATCH_FALL_DEFAULT_DURATION_SEC = 45;
export const CATCH_FALL_DEFAULT_LIVES = 3;
export const CATCH_FALL_DEFAULT_SPAWN_MS = 700;
export const CATCH_FALL_PLAY_AREA_WIDTH = 300;
export const CATCH_FALL_PLAY_AREA_HEIGHT = 340;
export const CATCH_FALL_PADDLE_WIDTH = 70;
export const CATCH_FALL_PADDLE_HEIGHT = 44;
export const CATCH_FALL_OBJECT_SIZE = 28;

export const TIMING_MAX_ROUNDS = 10;
export const TIMING_DEFAULT_SPEED = 1.4;
export const TIMING_SPEED_PER_ROUND = 0.15;
export const TIMING_RESULT_DELAY_MS = 750;
export const TIMING_TARGET_MIN_START = 25;
export const TIMING_TARGET_MAX_START = 65;
export const TIMING_TARGET_MIN_WIDTH = 15;
export const TIMING_TARGET_BASE_WIDTH = 25;
export const TIMING_TARGET_WIDTH_PER_ROUND_DEC = 1;

export const PERFECT_SCORE = 20;
export const GOOD_SCORE = 10;
export const MISS_SCORE = -5;
export const BOMB_HIT_SCORE = -10;

export const MIN_XP_FROM_SCORE = 5;

// ============================================================================
// Types
// ============================================================================

export interface GameMeta {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  minLevel: number;
  duration: number | null;       // null for round-based
  rewardType: 'xp' | 'item';
}

export interface CatchFallObject {
  id: number;
  type: 'fish' | 'cake' | 'star' | 'toy' | 'bomb';
  icon: string;
  points: number;
  bad: boolean;
  x: number;
  y: number;
  speed: number;
}

export interface CatchFallState {
  score: number;
  lives: number;
  timeLeft: number;
  objects: CatchFallObject[];
  paddleX: number;            // 0..(WIDTH - PADDLE_WIDTH)
  running: boolean;
  finished: boolean;
  success: boolean;
}

export interface TimingState {
  score: number;
  round: number;              // 1-based, current round
  maxRounds: number;
  indicatorPos: number;       // 0..100
  indicatorDir: 1 | -1;
  speed: number;
  targetStart: number;        // 0..100
  targetEnd: number;          // 0..100
  canPress: boolean;
  lastResult: 'perfect' | 'good' | 'miss' | null;
  lastPoints: number;
  running: boolean;
  finished: boolean;
  success: boolean;
}

export interface GameScore {
  gameId: GameId;
  score: number;
  date: number;
  durationSec: number;
  success: boolean;
}

export interface MiniGamesState {
  highScores: Record<GameId, number>;
  recent: GameScore[];        // capped 20
  totalPlayed: number;
  totalWins: number;
}

export type GameState = CatchFallState | TimingState;

// ============================================================================
// Catalog
// ============================================================================

export const GAMES: Record<GameId, GameMeta> = {
  catch_fall: {
    id: GAME_IDS.CATCH_FALL,
    name: 'Bắt đồ vật',
    description: 'Di chuyển bắt cá, bánh ngọt và né tránh bom!',
    icon: '🎯',
    minLevel: 1,
    duration: CATCH_FALL_DEFAULT_DURATION_SEC,
    rewardType: 'xp',
  },
  timing: {
    id: GAME_IDS.TIMING,
    name: 'Phản xạ nhanh',
    description: 'Căn đúng vùng xanh và nhấn để ghi điểm tối đa!',
    icon: '⚡',
    minLevel: 2,
    duration: null,
    rewardType: 'xp',
  },
};

export function getGameMeta(id: GameId): GameMeta | null {
  return GAMES[id] ?? null;
}

export function listGames(): GameMeta[] {
  return Object.values(GAMES);
}

// ============================================================================
// State normalizers
// ============================================================================

export function ensureMiniGamesStructure(state: MiniGamesState | null | undefined): MiniGamesState {
  const base = state && typeof state === 'object' ? state : ({} as MiniGamesState);
  return {
    highScores: {
      catch_fall: base.highScores?.catch_fall ?? 0,
      timing: base.highScores?.timing ?? 0,
    },
    recent: Array.isArray(base.recent) ? base.recent.slice(0, 20) : [],
    totalPlayed: base.totalPlayed ?? 0,
    totalWins: base.totalWins ?? 0,
  };
}

// ============================================================================
// Catch Fall — pure helpers
// ============================================================================

const CATCH_FALL_OBJECT_TYPES = [
  { type: 'fish' as const, points: 10, icon: '🐟', bad: false },
  { type: 'cake' as const, points: 15, icon: '🎂', bad: false },
  { type: 'star' as const, points: 20, icon: '⭐', bad: false },
  { type: 'toy' as const, points: 10, icon: '🧶', bad: false },
  { type: 'bomb' as const, points: -10, icon: '💣', bad: true },
];

export interface SpawnObjectInput {
  randomFn?: () => number;
  now?: number;
  playAreaWidth?: number;
}

export function spawnCatchFallObject(input: SpawnObjectInput = {}): CatchFallObject {
  const { randomFn = Math.random, now = Date.now(), playAreaWidth = CATCH_FALL_PLAY_AREA_WIDTH } = input;
  const idx = Math.floor(randomFn() * CATCH_FALL_OBJECT_TYPES.length);
  const chosen = CATCH_FALL_OBJECT_TYPES[idx];
  return {
    id: now + Math.floor(randomFn() * 1e6),
    type: chosen.type,
    icon: chosen.icon,
    points: chosen.points,
    bad: chosen.bad,
    x: 10 + randomFn() * (playAreaWidth - 40),
    y: 0,
    speed: 3 + randomFn() * 2,
  };
}

export interface CatchFallTickInput {
  state: CatchFallState;
  now?: number;
  deltaMs?: number;
  randomFn?: () => number;
}

export interface CatchFallTickResult {
  state: CatchFallState;
  events: { kind: 'caught' | 'missed' | 'finished'; obj: CatchFallObject; livesLost?: number; pointsGained?: number }[];
}

export function tickCatchFall(input: CatchFallTickInput): CatchFallTickResult {
  const { state, deltaMs = 16, randomFn = Math.random } = input;
  if (!state.running || state.finished) {
    return { state, events: [] };
  }

  const events: CatchFallTickResult['events'] = [];
  const objects = [...state.objects];
  let score = state.score;
  let lives = state.lives;

  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    obj.y = Math.max(0, obj.y + obj.speed * (deltaMs / 16));

    const paddleTop = CATCH_FALL_PLAY_AREA_HEIGHT - 70;
    const paddleLeft = state.paddleX;
    const hit =
      obj.x < paddleLeft + CATCH_FALL_PADDLE_WIDTH + 10 &&
      obj.x + CATCH_FALL_OBJECT_SIZE > paddleLeft - 10 &&
      obj.y < paddleTop + CATCH_FALL_PADDLE_HEIGHT &&
      obj.y + CATCH_FALL_OBJECT_SIZE > paddleTop - 5;

    if (hit) {
      score = Math.max(0, score + obj.points);
      events.push({ kind: 'caught', obj, pointsGained: obj.points });
      objects.splice(i, 1);
      continue;
    }

    if (obj.y > CATCH_FALL_PLAY_AREA_HEIGHT - 30) {
      if (!obj.bad) {
        lives -= 1;
        events.push({ kind: 'missed', obj, livesLost: 1 });
        if (lives <= 0) {
          return {
            state: { ...state, score, lives: 0, objects: [], finished: true, success: false, running: false },
            events: [...events, { kind: 'finished', obj, livesLost: 1 }],
          };
        }
      }
      objects.splice(i, 1);
    }
  }

  return {
    state: { ...state, score, lives, objects },
    events,
  };
}

export function createCatchFallState(input?: { now?: number; paddleX?: number; lives?: number; timeLeft?: number }): CatchFallState {
  const start = input?.now ?? 0;
  return {
    score: 0,
    lives: input?.lives ?? CATCH_FALL_DEFAULT_LIVES,
    timeLeft: input?.timeLeft ?? CATCH_FALL_DEFAULT_DURATION_SEC,
    objects: [],
    paddleX: input?.paddleX ?? Math.floor((CATCH_FALL_PLAY_AREA_WIDTH - CATCH_FALL_PADDLE_WIDTH) / 2),
    running: false,
    finished: false,
    success: false,
  };
}

export function startCatchFall(state: CatchFallState, now: number = Date.now()): CatchFallState {
  return {
    ...createCatchFallState({ paddleX: state.paddleX, lives: state.lives, timeLeft: state.timeLeft }),
    running: true,
  };
}export function setPaddleX(state: CatchFallState, paddleX: number): CatchFallState {
  const clampedX = Math.max(0, Math.min(CATCH_FALL_PLAY_AREA_WIDTH - CATCH_FALL_PADDLE_WIDTH, paddleX));
  return { ...state, paddleX: clampedX };
}

export function decrementTime(state: CatchFallState): CatchFallState {
  if (!state.running) return state;
  const t = Math.max(0, state.timeLeft - 1);
  if (t === 0) {
    return { ...state, timeLeft: 0, running: false, finished: true, success: state.score >= 30 };
  }
  return { ...state, timeLeft: t };
}

export function finishCatchFall(state: CatchFallState, success: boolean = state.score >= 30): CatchFallState {
  return { ...state, running: false, finished: true, success };
}

// ============================================================================
// Timing Game — pure helpers
// ============================================================================

export function createTimingState(now: number = Date.now()): TimingState {
  return {
    score: 0,
    round: 0,
    maxRounds: TIMING_MAX_ROUNDS,
    indicatorPos: 0,
    indicatorDir: 1,
    speed: TIMING_DEFAULT_SPEED,
    targetStart: 40,
    targetEnd: 60,
    canPress: true,
    lastResult: null,
    lastPoints: 0,
    running: false,
    finished: false,
    success: false,
  };
}

export function startTiming(state: TimingState, randomFn: () => number = Math.random): TimingState {
  const fresh = createTimingState();
  const afterRound = nextTimingRound(fresh, randomFn);
  return { ...afterRound, running: true };
}

export function tickTimingIndicator(state: TimingState, deltaUnits: number = 1): TimingState {
  if (!state.running || state.finished || !state.canPress) return state;
  let pos = state.indicatorPos + state.speed * state.indicatorDir * deltaUnits;
  let dir: 1 | -1 = state.indicatorDir;
  if (pos >= 100) {
    pos = 100;
    dir = -1;
  } else if (pos <= 0) {
    pos = 0;
    dir = 1;
  }
  return { ...state, indicatorPos: pos, indicatorDir: dir };
}

export interface TimingPressResult {
  state: TimingState;
  result: 'perfect' | 'good' | 'miss';
  points: number;
}

export function pressTiming(state: TimingState): TimingPressResult {
  if (!state.running || !state.canPress) {
    return { state, result: 'miss', points: 0 };
  }
  const pos = state.indicatorPos;
  const inside = pos >= state.targetStart && pos <= state.targetEnd;
  const targetCenter = (state.targetStart + state.targetEnd) / 2;
  const targetRadius = (state.targetEnd - state.targetStart) / 2;
  const distFromCenter = Math.abs(pos - targetCenter);

  let result: 'perfect' | 'good' | 'miss';
  let points: number;
  if (inside) {
    if (distFromCenter <= targetRadius * 0.5) {
      result = 'perfect';
      points = PERFECT_SCORE;
    } else {
      result = 'good';
      points = GOOD_SCORE;
    }
  } else {
    result = 'miss';
    points = MISS_SCORE;
  }

  const updated: TimingState = {
    ...state,
    score: Math.max(0, state.score + points),
    canPress: false,
    lastResult: result,
    lastPoints: points,
  };

  return { state: updated, result, points };
}

export function nextTimingRound(state: TimingState, randomFn: () => number = Math.random): TimingState {
  const newRound = state.round + 1;
  if (newRound > state.maxRounds) {
    return finishTiming(state, state.score >= 30);
  }
  const targetStart = Math.floor(TIMING_TARGET_MIN_START + randomFn() * (TIMING_TARGET_MAX_START - TIMING_TARGET_MIN_START));
  const targetWidth = Math.max(TIMING_TARGET_MIN_WIDTH, TIMING_TARGET_BASE_WIDTH - state.round * TIMING_TARGET_WIDTH_PER_ROUND_DEC);
  const targetEnd = Math.min(100, targetStart + targetWidth);
  const speed = TIMING_DEFAULT_SPEED + newRound * TIMING_SPEED_PER_ROUND;

  return {
    ...state,
    round: newRound,
    indicatorPos: 0,
    indicatorDir: 1,
    speed,
    targetStart,
    targetEnd,
    canPress: true,
    lastResult: null,
    lastPoints: 0,
  };
}

export function finishTiming(state: TimingState, success: boolean = state.score >= 30): TimingState {
  return { ...state, running: false, finished: true, success };
}

// ============================================================================
// Score calculation
// ============================================================================

export function xpFromScore(score: number): number {
  return Math.max(MIN_XP_FROM_SCORE, Math.floor(score / 2));
}

// ============================================================================
// Persistence helpers
// ============================================================================

export function recordGameResult(
  state: MiniGamesState,
  result: GameScore
): MiniGamesState {
  const highScores = { ...state.highScores };
  if (result.score > (highScores[result.gameId] ?? 0)) {
    highScores[result.gameId] = result.score;
  }
  const recent = [result, ...(state.recent ?? [])].slice(0, 20);
  return {
    ...state,
    highScores,
    recent,
    totalPlayed: (state.totalPlayed ?? 0) + 1,
    totalWins: result.success ? (state.totalWins ?? 0) + 1 : state.totalWins ?? 0,
  };
}

export function getHighScore(state: MiniGamesState, gameId: GameId): number {
  return state.highScores?.[gameId] ?? 0;
}

export function getRecentScores(state: MiniGamesState, gameId?: GameId, limit: number = 5): GameScore[] {
  if (!gameId) return state.recent.slice(0, limit);
  return state.recent.filter((r) => r.gameId === gameId).slice(0, limit);
}

// ============================================================================
// Mini-game session record factory
// ============================================================================

export function buildGameScore(
  gameId: GameId,
  score: number,
  success: boolean,
  durationSec: number,
  now: number = Date.now()
): GameScore {
  return { gameId, score, success, durationSec, date: now };
}
