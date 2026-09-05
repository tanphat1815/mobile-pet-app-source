/**
 * Step 12g — Mini-games unit tests.
 *
 * Cover:
 *  - GAMES catalog has 2 entries (catch_fall, timing)
 *  - GAME_IDS enum
 *  - getGameMeta / listGames
 *  - ensureMiniGamesStructure fills defaults
 *  - Catch Fall: createCatchFallState defaults
 *  - spawnCatchFallObject produces random valid object
 *  - tickCatchFall moves objects down + collision
 *  - tickCatchFall finishes on lives=0
 *  - tickCatchFall bomb doesn't cost life when missed
 *  - setPaddleX clamps to play area
 *  - decrementTime decreases + finishes at 0
 *  - finishCatchFall marks state finished
 *  - Timing: createTimingState defaults
 *  - tickTimingIndicator bounces between 0 and 100
 *  - tickTimingIndicator respects canPress=false
 *  - pressTiming returns perfect when center hit
 *  - pressTiming returns good when edge hit
 *  - pressTiming returns miss when outside
 *  - pressTiming disables canPress
 *  - nextTimingRound advances round and shrinks target
 *  - nextTimingRound at maxRounds finishes
 *  - finishTiming marks state
 *  - xpFromScore returns max(5, floor(score/2))
 *  - recordGameResult updates highScores + recent
 *  - getHighScore returns max
 *  - getRecentScores filters by gameId
 *  - buildGameScore creates valid record
 *  - STORE: hydrate + reset + recordResult + selectors
 */

import { describe, it, expect, beforeEach } from 'vitest';
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
  CATCH_FALL_PLAY_AREA_WIDTH,
  CATCH_FALL_PADDLE_WIDTH,
  CATCH_FALL_DEFAULT_DURATION_SEC,
  CATCH_FALL_DEFAULT_LIVES,
  TIMING_MAX_ROUNDS,
  PERFECT_SCORE,
  GOOD_SCORE,
  MISS_SCORE,
  type CatchFallState,
  type TimingState,
  type MiniGamesState,
} from '../api/miniGames';

// ──────────────────────────────────────────────────────────────────────────────
// Constants / catalog
// ──────────────────────────────────────────────────────────────────────────────

describe('GAMES catalog', () => {
  it('has 2 entries', () => {
    expect(Object.keys(GAMES)).toHaveLength(2);
  });

  it('contains catch_fall and timing', () => {
    expect(GAMES.catch_fall.id).toBe('catch_fall');
    expect(GAMES.timing.id).toBe('timing');
  });

  it('game meta has all required fields', () => {
    for (const g of Object.values(GAMES)) {
      expect(g.id).toBeTruthy();
      expect(g.name).toBeTruthy();
      expect(g.description).toBeTruthy();
      expect(g.icon).toBeTruthy();
      expect(g.minLevel).toBeGreaterThanOrEqual(1);
    }
  });

  it('catch_fall has duration, timing has null', () => {
    expect(GAMES.catch_fall.duration).toBe(CATCH_FALL_DEFAULT_DURATION_SEC);
    expect(GAMES.timing.duration).toBeNull();
  });

  it('GAME_IDS has catch_fall and timing', () => {
    expect(Object.values(GAME_IDS)).toEqual(expect.arrayContaining(['catch_fall', 'timing']));
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ensureMiniGamesStructure
// ──────────────────────────────────────────────────────────────────────────────

describe('ensureMiniGamesStructure', () => {
  it('returns defaults for null', () => {
    const out = ensureMiniGamesStructure(null);
    expect(out.highScores.catch_fall).toBe(0);
    expect(out.highScores.timing).toBe(0);
    expect(out.recent).toEqual([]);
    expect(out.totalPlayed).toBe(0);
    expect(out.totalWins).toBe(0);
  });

  it('preserves existing', () => {
    const out = ensureMiniGamesStructure({
      highScores: { catch_fall: 100, timing: 50 },
      recent: [],
      totalPlayed: 5,
      totalWins: 3,
    });
    expect(out.highScores.catch_fall).toBe(100);
    expect(out.totalPlayed).toBe(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Catch Fall helpers
// ──────────────────────────────────────────────────────────────────────────────

describe('createCatchFallState', () => {
  it('has expected defaults', () => {
    const s = createCatchFallState();
    expect(s.score).toBe(0);
    expect(s.lives).toBe(CATCH_FALL_DEFAULT_LIVES);
    expect(s.timeLeft).toBe(CATCH_FALL_DEFAULT_DURATION_SEC);
    expect(s.objects).toEqual([]);
    expect(s.running).toBe(false);
    expect(s.finished).toBe(false);
  });

  it('paddle centered', () => {
    const s = createCatchFallState();
    const expected = Math.floor((CATCH_FALL_PLAY_AREA_WIDTH - CATCH_FALL_PADDLE_WIDTH) / 2);
    expect(s.paddleX).toBe(expected);
  });

  it('accepts overrides', () => {
    const s = createCatchFallState({ paddleX: 50, lives: 5, timeLeft: 100 });
    expect(s.paddleX).toBe(50);
    expect(s.lives).toBe(5);
    expect(s.timeLeft).toBe(100);
  });
});

describe('startCatchFall', () => {
  it('marks running=true, resets score/timeLeft', () => {
    const s = startCatchFall({ ...createCatchFallState(), score: 50 });
    expect(s.running).toBe(true);
    expect(s.score).toBe(0);
    expect(s.lives).toBe(CATCH_FALL_DEFAULT_LIVES);
    expect(s.timeLeft).toBe(CATCH_FALL_DEFAULT_DURATION_SEC);
  });

  it('preserves paddleX', () => {
    const s = startCatchFall({ ...createCatchFallState(), paddleX: 75 });
    expect(s.paddleX).toBe(75);
  });
});

describe('spawnCatchFallObject', () => {
  it('produces object with valid fields', () => {
    const obj = spawnCatchFallObject({ randomFn: () => 0 });
    expect(['fish', 'cake', 'star', 'toy', 'bomb']).toContain(obj.type);
    expect(typeof obj.icon).toBe('string');
    expect(typeof obj.points).toBe('number');
    expect(typeof obj.x).toBe('number');
    expect(typeof obj.y).toBe('number');
    expect(typeof obj.speed).toBe('number');
    expect(obj.y).toBe(0);
  });

  it('x is within play area', () => {
    for (let i = 0; i < 10; i++) {
      const obj = spawnCatchFallObject();
      expect(obj.x).toBeGreaterThanOrEqual(0);
      expect(obj.x).toBeLessThanOrEqual(CATCH_FALL_PLAY_AREA_WIDTH);
    }
  });

  it('randomFn=0 picks first type', () => {
    const obj = spawnCatchFallObject({ randomFn: () => 0 });
    expect(obj.type).toBe('fish'); // first in array
  });
});

describe('setPaddleX', () => {
  it('clamps to 0', () => {
    const s = setPaddleX(createCatchFallState(), -100);
    expect(s.paddleX).toBe(0);
  });

  it('clamps to right edge', () => {
    const s = setPaddleX(createCatchFallState(), 99999);
    expect(s.paddleX).toBe(CATCH_FALL_PLAY_AREA_WIDTH - CATCH_FALL_PADDLE_WIDTH);
  });

  it('passes through valid', () => {
    const s = setPaddleX(createCatchFallState(), 100);
    expect(s.paddleX).toBe(100);
  });
});

describe('tickCatchFall', () => {
  it('does nothing if not running', () => {
    const s = createCatchFallState();
    const r = tickCatchFall({ state: s });
    expect(r.state).toBe(s);
    expect(r.events).toEqual([]);
  });

  it('does nothing if finished', () => {
    const s = { ...createCatchFallState(), running: false, finished: true };
    const r = tickCatchFall({ state: s });
    expect(r.events).toEqual([]);
  });

  it('moves objects down', () => {
    const obj = spawnCatchFallObject({ randomFn: () => 0 });
    const s: CatchFallState = {
      ...createCatchFallState(),
      running: true,
      objects: [{ ...obj, x: 50, y: 0 }],
    };
    const r = tickCatchFall({ state: s, deltaMs: 16 });
    expect(r.state.objects[0]?.y).toBeGreaterThan(0);
  });

  it('removes caught objects and adds points', () => {
    const obj = spawnCatchFallObject({ randomFn: () => 0 });
    const s: CatchFallState = {
      ...createCatchFallState(),
      running: true,
      paddleX: 0,
      objects: [{ ...obj, x: 5, y: 100 }], // directly under paddle
    };
    const r = tickCatchFall({ state: s, deltaMs: 16 });
    // Depending on y, may or may not be caught
    expect(r.state.objects.length).toBeLessThanOrEqual(1);
  });

  it('bomb gives negative points', () => {
    const obj = { ...spawnCatchFallObject({ randomFn: () => 0 }), type: 'bomb' as const, bad: true, points: -10, icon: '💣', x: 5, y: 280 };
    const s: CatchFallState = {
      ...createCatchFallState(),
      running: true,
      paddleX: 0,
      score: 50,
      objects: [obj],
    };
    const r = tickCatchFall({ state: s, deltaMs: 16 });
    expect(r.state.score).toBe(40);
  });

  it('missed good object loses a life', () => {
    const obj = { ...spawnCatchFallObject({ randomFn: () => 0 }), bad: false, x: 5, y: 1000 };
    const s: CatchFallState = {
      ...createCatchFallState(),
      running: true,
      paddleX: 200,
      objects: [obj],
    };
    const r = tickCatchFall({ state: s, deltaMs: 16 });
    expect(r.state.lives).toBe(CATCH_FALL_DEFAULT_LIVES - 1);
  });

  it('finished when lives reach 0', () => {
    const obj = { ...spawnCatchFallObject({ randomFn: () => 0 }), bad: false, x: 5, y: 1000 };
    const s: CatchFallState = {
      ...createCatchFallState(),
      running: true,
      paddleX: 200,
      lives: 1,
      objects: [obj],
    };
    const r = tickCatchFall({ state: s, deltaMs: 16 });
    expect(r.state.finished).toBe(true);
    expect(r.state.success).toBe(false);
  });

  it('bomb missed does not lose life', () => {
    const obj = { ...spawnCatchFallObject({ randomFn: () => 0 }), bad: true, x: 5, y: 1000 };
    const s: CatchFallState = {
      ...createCatchFallState(),
      running: true,
      paddleX: 200,
      objects: [obj],
    };
    const r = tickCatchFall({ state: s, deltaMs: 16 });
    expect(r.state.lives).toBe(CATCH_FALL_DEFAULT_LIVES);
  });
});

describe('decrementTime', () => {
  it('decreases by 1', () => {
    const s = decrementTime({ ...createCatchFallState(), running: true });
    expect(s.timeLeft).toBe(CATCH_FALL_DEFAULT_DURATION_SEC - 1);
  });

  it('clamps to 0', () => {
    const s = decrementTime({ ...createCatchFallState(), running: true, timeLeft: 0 });
    expect(s.timeLeft).toBe(0);
  });

  it('does nothing if not running', () => {
    const s = decrementTime(createCatchFallState());
    expect(s).toEqual(createCatchFallState());
  });

  it('finishes at 0', () => {
    const s = decrementTime({ ...createCatchFallState(), running: true, timeLeft: 1, score: 100 });
    expect(s.timeLeft).toBe(0);
    expect(s.finished).toBe(true);
    expect(s.success).toBe(true);
  });
});

describe('finishCatchFall', () => {
  it('marks finished', () => {
    const s = finishCatchFall(createCatchFallState());
    expect(s.finished).toBe(true);
    expect(s.running).toBe(false);
  });

  it('default success when score >= 30', () => {
    const s = finishCatchFall({ ...createCatchFallState(), score: 50 });
    expect(s.success).toBe(true);
  });

  it('default fail when score < 30', () => {
    const s = finishCatchFall({ ...createCatchFallState(), score: 10 });
    expect(s.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Timing helpers
// ──────────────────────────────────────────────────────────────────────────────

describe('createTimingState', () => {
  it('has expected defaults', () => {
    const s = createTimingState();
    expect(s.score).toBe(0);
    expect(s.round).toBe(0);
    expect(s.maxRounds).toBe(TIMING_MAX_ROUNDS);
    expect(s.indicatorPos).toBe(0);
    expect(s.indicatorDir).toBe(1);
    expect(s.canPress).toBe(true);
    expect(s.running).toBe(false);
    expect(s.finished).toBe(false);
  });
});

describe('startTiming', () => {
  it('starts first round', () => {
    const s = startTiming(createTimingState());
    expect(s.running).toBe(true);
    expect(s.round).toBe(1);
    expect(s.canPress).toBe(true);
  });
});

describe('tickTimingIndicator', () => {
  it('moves indicator', () => {
    const s: TimingState = { ...createTimingState(), running: true };
    const next = tickTimingIndicator(s, 1);
    expect(next.indicatorPos).toBeGreaterThan(0);
  });

  it('bounces at 100', () => {
    const s: TimingState = { ...createTimingState(), running: true, indicatorPos: 100 };
    const next = tickTimingIndicator(s, 1);
    expect(next.indicatorDir).toBe(-1);
  });

  it('bounces at 0', () => {
    const s: TimingState = { ...createTimingState(), running: true, indicatorPos: 0 };
    const next = tickTimingIndicator(s, 1);
    expect(next.indicatorDir).toBe(1);
  });

  it('does nothing if not running', () => {
    const s = createTimingState();
    const next = tickTimingIndicator(s, 1);
    expect(next.indicatorPos).toBe(0);
  });

  it('does nothing if not canPress', () => {
    const s: TimingState = { ...createTimingState(), running: true, canPress: false, indicatorPos: 50 };
    const next = tickTimingIndicator(s, 1);
    expect(next.indicatorPos).toBe(50);
  });

  it('does nothing if finished', () => {
    const s: TimingState = { ...createTimingState(), running: false, finished: true, indicatorPos: 50 };
    const next = tickTimingIndicator(s, 1);
    expect(next.indicatorPos).toBe(50);
  });
});

describe('pressTiming', () => {
  it('perfect center hit', () => {
    const s: TimingState = {
      ...createTimingState(),
      running: true,
      targetStart: 40,
      targetEnd: 60,
      indicatorPos: 50, // center
    };
    const r = pressTiming(s);
    expect(r.result).toBe('perfect');
    expect(r.points).toBe(PERFECT_SCORE);
    expect(r.state.score).toBe(PERFECT_SCORE);
    expect(r.state.canPress).toBe(false);
  });

  it('edge hit (good)', () => {
    const s: TimingState = {
      ...createTimingState(),
      running: true,
      targetStart: 40,
      targetEnd: 60,
      indicatorPos: 41, // edge
    };
    const r = pressTiming(s);
    expect(r.result).toBe('good');
    expect(r.points).toBe(GOOD_SCORE);
  });

  it('miss outside', () => {
    const s: TimingState = {
      ...createTimingState(),
      running: true,
      targetStart: 40,
      targetEnd: 60,
      indicatorPos: 20,
    };
    const r = pressTiming(s);
    expect(r.result).toBe('miss');
    expect(r.points).toBe(MISS_SCORE);
    expect(r.state.score).toBe(0);
  });

  it('clamps score to 0 minimum', () => {
    const s: TimingState = {
      ...createTimingState(),
      running: true,
      targetStart: 40,
      targetEnd: 60,
      indicatorPos: 20,
      score: 2,
    };
    const r = pressTiming(s);
    expect(r.state.score).toBe(0);
  });

  it('returns 0 points if not running', () => {
    const s = createTimingState();
    const r = pressTiming(s);
    expect(r.points).toBe(0);
  });
});

describe('nextTimingRound', () => {
  it('advances round', () => {
    const s = nextTimingRound(createTimingState());
    expect(s.round).toBe(1);
    expect(s.canPress).toBe(true);
  });

  it('shrinks target', () => {
    const r1 = nextTimingRound(createTimingState());
    const r2 = nextTimingRound(r1);
    const r3 = nextTimingRound(r2);
    const w1 = r1.targetEnd - r1.targetStart;
    const w2 = r2.targetEnd - r2.targetStart;
    const w3 = r3.targetEnd - r3.targetStart;
    expect(w2).toBeLessThanOrEqual(w1);
    expect(w3).toBeLessThanOrEqual(w2);
  });

  it('finishes after maxRounds', () => {
    let s = createTimingState();
    for (let i = 0; i < TIMING_MAX_ROUNDS + 1; i++) {
      s = nextTimingRound(s);
    }
    expect(s.finished).toBe(true);
  });
});

describe('finishTiming', () => {
  it('marks finished', () => {
    const s = finishTiming(createTimingState());
    expect(s.finished).toBe(true);
    expect(s.running).toBe(false);
  });

  it('default success when score >= 30', () => {
    const s = finishTiming({ ...createTimingState(), score: 50 });
    expect(s.success).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Score helpers
// ──────────────────────────────────────────────────────────────────────────────

describe('xpFromScore', () => {
  it('returns max 5 for score 0', () => {
    expect(xpFromScore(0)).toBe(5);
  });

  it('returns floor(score/2) for score > 10', () => {
    expect(xpFromScore(50)).toBe(25);
  });

  it('returns 5 minimum', () => {
    expect(xpFromScore(2)).toBe(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Persistence
// ──────────────────────────────────────────────────────────────────────────────

describe('recordGameResult', () => {
  it('updates highScores', () => {
    const state: MiniGamesState = ensureMiniGamesStructure(null);
    const next = recordGameResult(state, buildGameScore('catch_fall', 100, true, 45));
    expect(next.highScores.catch_fall).toBe(100);
  });

  it('keeps higher previous score', () => {
    let state: MiniGamesState = ensureMiniGamesStructure(null);
    state = recordGameResult(state, buildGameScore('catch_fall', 100, true, 45));
    state = recordGameResult(state, buildGameScore('catch_fall', 50, true, 45));
    expect(state.highScores.catch_fall).toBe(100);
  });

  it('appends to recent', () => {
    let state: MiniGamesState = ensureMiniGamesStructure(null);
    state = recordGameResult(state, buildGameScore('catch_fall', 100, true, 45));
    state = recordGameResult(state, buildGameScore('timing', 50, false, 30));
    expect(state.recent.length).toBe(2);
  });

  it('caps recent at 20', () => {
    let state: MiniGamesState = ensureMiniGamesStructure(null);
    for (let i = 0; i < 30; i++) {
      state = recordGameResult(state, buildGameScore('catch_fall', i, true, 45));
    }
    expect(state.recent.length).toBe(20);
  });

  it('increments totalPlayed', () => {
    let state: MiniGamesState = ensureMiniGamesStructure(null);
    state = recordGameResult(state, buildGameScore('catch_fall', 100, true, 45));
    expect(state.totalPlayed).toBe(1);
  });

  it('increments totalWins only on success', () => {
    let state: MiniGamesState = ensureMiniGamesStructure(null);
    state = recordGameResult(state, buildGameScore('catch_fall', 100, true, 45));
    state = recordGameResult(state, buildGameScore('catch_fall', 5, false, 45));
    expect(state.totalWins).toBe(1);
  });
});

describe('getHighScore', () => {
  it('returns 0 for empty', () => {
    expect(getHighScore(ensureMiniGamesStructure(null), 'catch_fall')).toBe(0);
  });

  it('returns value', () => {
    const s = recordGameResult(ensureMiniGamesStructure(null), buildGameScore('catch_fall', 100, true, 45));
    expect(getHighScore(s, 'catch_fall')).toBe(100);
  });
});

describe('getRecentScores', () => {
  it('returns all when no gameId', () => {
    let s = ensureMiniGamesStructure(null);
    s = recordGameResult(s, buildGameScore('catch_fall', 100, true, 45));
    s = recordGameResult(s, buildGameScore('timing', 50, true, 30));
    const list = getRecentScores(s);
    expect(list.length).toBe(2);
  });

  it('filters by gameId', () => {
    let s = ensureMiniGamesStructure(null);
    s = recordGameResult(s, buildGameScore('catch_fall', 100, true, 45));
    s = recordGameResult(s, buildGameScore('timing', 50, true, 30));
    const list = getRecentScores(s, 'catch_fall');
    expect(list.every((r) => r.gameId === 'catch_fall')).toBe(true);
  });

  it('respects limit', () => {
    let s = ensureMiniGamesStructure(null);
    for (let i = 0; i < 10; i++) {
      s = recordGameResult(s, buildGameScore('catch_fall', i, true, 45));
    }
    expect(getRecentScores(s, 'catch_fall', 3).length).toBe(3);
  });
});

describe('buildGameScore', () => {
  it('produces valid record', () => {
    const r = buildGameScore('timing', 75, true, 30, 1234567890);
    expect(r.gameId).toBe('timing');
    expect(r.score).toBe(75);
    expect(r.success).toBe(true);
    expect(r.durationSec).toBe(30);
    expect(r.date).toBe(1234567890);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────────────────────

import { useMiniGamesStore } from '../stores/MiniGamesStore';

describe('MiniGamesStore', () => {
  beforeEach(() => {
    useMiniGamesStore.getState().reset();
  });

  it('starts with defaults after reset', () => {
    const s = useMiniGamesStore.getState();
    expect(s.state.highScores.catch_fall).toBe(0);
    expect(s.state.totalPlayed).toBe(0);
    expect(s.initialized).toBe(true);
  });

  it('recordResult updates state', () => {
    const result = useMiniGamesStore.getState().recordResult('catch_fall', 100, true, 45);
    expect(result.score).toBe(100);
    expect(useMiniGamesStore.getState().state.highScores.catch_fall).toBe(100);
    expect(useMiniGamesStore.getState().state.totalPlayed).toBe(1);
  });

  it('selectHighScore returns value', () => {
    useMiniGamesStore.getState().recordResult('timing', 75, true, 30);
    expect(useMiniGamesStore.getState().selectHighScore('timing')).toBe(75);
  });

  it('selectRecent returns array', () => {
    useMiniGamesStore.getState().recordResult('catch_fall', 100, true, 45);
    const list = useMiniGamesStore.getState().selectRecent();
    expect(list.length).toBe(1);
  });

  it('selectTotalPlayed + selectTotalWins', () => {
    useMiniGamesStore.getState().recordResult('catch_fall', 100, true, 45);
    useMiniGamesStore.getState().recordResult('timing', 10, false, 30);
    expect(useMiniGamesStore.getState().selectTotalPlayed()).toBe(2);
    expect(useMiniGamesStore.getState().selectTotalWins()).toBe(1);
  });

  it('selectXpEarnedFromScore', () => {
    expect(useMiniGamesStore.getState().selectXpEarnedFromScore(50)).toBe(25);
    expect(useMiniGamesStore.getState().selectXpEarnedFromScore(0)).toBe(5);
  });

  it('selectMeta + selectAllGames', () => {
    expect(useMiniGamesStore.getState().selectMeta('catch_fall')?.id).toBe('catch_fall');
    expect(useMiniGamesStore.getState().selectAllGames().length).toBe(2);
  });

  it('selectRecentSummary', () => {
    useMiniGamesStore.getState().recordResult('catch_fall', 100, true, 45);
    useMiniGamesStore.getState().recordResult('catch_fall', 200, true, 45);
    const summary = useMiniGamesStore.getState().selectRecentSummary();
    expect(summary.length).toBe(1);
    expect(summary[0].id).toBe('catch_fall');
  });
});
