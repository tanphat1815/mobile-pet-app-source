/**
 * Step 12f — Competitions unit tests.
 *
 * Cover:
 *  - COMPETITION_TEMPLATES has 5 entries
 *  - COMPETITION_TEMPLATE_IDS contains expected ids
 *  - COMPETITION_TYPES / COMPETITION_STATUS constant sets
 *  - getCompetitionTemplate finds / returns null
 *  - listCompetitionTemplates returns 5
 *  - ensureCompetitionsStructure fills defaults
 *  - generateCompetitionId format
 *  - createCompetition uses template defaults + auto-seeds bots
 *  - register happy path + dedup + max-players + entry fee
 *  - register auto-fail after registration closes
 *  - submitScore updates highest/total + counts
 *  - submitScore auto-registers during in_progress
 *  - quickPlay submits a random score
 *  - generateBracket builds correct number of rounds
 *  - generateBracket emits champion in final match
 *  - generateBracket handles <size participants
 *  - autoGenerateCompetitions seeds daily templates if missing
 *  - checkStatusTransitions moves registration→in_progress and ends competitions
 *  - endCompetition builds sorted results with prizes
 *  - endCompetition updates user stats
 *  - getPrizeForRank matches numeric/string/range/plus
 *  - prizeRewardsTotal sums coins/xp/items
 *  - getActive/Live/Registration/Upcoming/History selectors
 *  - findCompetitionById across active+history
 *  - getLeaderboard sorts and caps to limit
 *  - getTimeRemaining clamps to 0
 *  - formatTimeRemaining formats hh:mm:ss / mm:ss
 *  - formatScore abbreviates 10000+
 *  - COMPETITIONS_STATE STORE: hydrate + tick + register + submit + end
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  COMPETITION_TEMPLATES,
  COMPETITION_TEMPLATE_IDS,
  COMPETITION_TYPES,
  COMPETITION_STATUS,
  COMPETITION_TYPE_LABELS,
  COMPETITION_STATUS_LABELS,
  DEFAULT_BRACKET_SIZE,
  DEFAULT_DURATION_MS,
  DEFAULT_REGISTRATION_MS,
  HISTORY_LIMIT,
  LEADERBOARD_LIMIT,
  autoGenerateCompetitions,
  checkStatusTransitions,
  createCompetition,
  endCompetition,
  ensureCompetitionsStructure,
  findCompetitionById as findCompetitionByIdFn,
  formatScore,
  formatTimeRemaining,
  generateBracket,
  generateCompetitionId,
  getActiveCompetitions,
  getCompetitionTemplate,
  getLeaderboard,
  getLiveCompetitions,
  getPrizeForRank,
  getRegistrationCompetitions,
  getTimeRemaining,
  getUpcomingCompetitions,
  listCompetitionTemplates,
  prizeRewardsTotal,
  quickPlay,
  register,
  seedSampleBots,
  submitScore,
  type Competition,
  type CompetitionsState,
} from '../api/competitions';

// ──────────────────────────────────────────────────────────────────────────────
// Constants / catalog
// ──────────────────────────────────────────────────────────────────────────────

describe('COMPETITION_TEMPLATES', () => {
  it('has 5 entries', () => {
    expect(Object.keys(COMPETITION_TEMPLATES)).toHaveLength(5);
  });

  it('contains expected ids', () => {
    expect(COMPETITION_TEMPLATE_IDS).toEqual(
      expect.arrayContaining(['daily_catch', 'weekend_tournament', 'timing_rush', 'marathon_24h', 'tricks_show'])
    );
  });

  it('all templates have required fields', () => {
    for (const t of Object.values(COMPETITION_TEMPLATES)) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(Object.values(COMPETITION_TYPES)).toContain(t.type);
      expect(['daily', 'weekly', 'once']).toContain(t.schedule);
      expect(t.duration).toBeGreaterThan(0);
      expect(t.registrationDuration).toBeGreaterThan(0);
      expect(t.maxPlayers).toBeGreaterThan(0);
      expect(t.minPlayers).toBeGreaterThanOrEqual(1);
      expect(t.minPlayers).toBeLessThanOrEqual(t.maxPlayers);
      expect(t.prizePool.length).toBeGreaterThan(0);
    }
  });

  it('weekly tournament has bracketSize=16', () => {
    expect(COMPETITION_TEMPLATES.weekend_tournament.bracketSize).toBe(16);
  });

  it('type and status label sets cover all values', () => {
    for (const k of Object.values(COMPETITION_TYPES)) {
      expect(COMPETITION_TYPE_LABELS[k]).toBeTruthy();
    }
    for (const k of Object.values(COMPETITION_STATUS)) {
      expect(COMPETITION_STATUS_LABELS[k]).toBeTruthy();
    }
  });

  it('default constants are sane', () => {
    expect(DEFAULT_BRACKET_SIZE).toBe(8);
    expect(DEFAULT_DURATION_MS).toBe(60 * 60 * 1000);
    expect(DEFAULT_REGISTRATION_MS).toBe(15 * 60 * 1000);
    expect(LEADERBOARD_LIMIT).toBe(10);
    expect(HISTORY_LIMIT).toBe(50);
  });
});

describe('getCompetitionTemplate / listCompetitionTemplates', () => {
  it('finds known templates', () => {
    expect(getCompetitionTemplate('daily_catch')?.id).toBe('daily_catch');
  });

  it('returns null for unknown', () => {
    expect(getCompetitionTemplate('nope')).toBeNull();
  });

  it('listCompetitionTemplates returns 5', () => {
    expect(listCompetitionTemplates()).toHaveLength(5);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ensureCompetitionsStructure
// ──────────────────────────────────────────────────────────────────────────────

describe('ensureCompetitionsStructure', () => {
  it('returns defaults for null', () => {
    const out = ensureCompetitionsStructure(null);
    expect(out.active).toEqual([]);
    expect(out.history).toEqual([]);
    expect(out.userStats.played).toBe(0);
    expect(out.userStats.trophies).toEqual([]);
  });

  it('fills missing userStats fields', () => {
    const out = ensureCompetitionsStructure({ active: [], history: [], userStats: { played: 5 } as any });
    expect(out.userStats.played).toBe(5);
    expect(out.userStats.wins).toBe(0);
    expect(out.userStats.podiums).toBe(0);
  });

  it('preserves existing arrays', () => {
    const dummy = { id: 'comp_x', name: 'x', results: [] } as any;
    const out = ensureCompetitionsStructure({ active: [dummy], history: [], userStats: { played: 1, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } });
    expect(out.active).toHaveLength(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ID generation
// ──────────────────────────────────────────────────────────────────────────────

describe('generateCompetitionId', () => {
  it('starts with comp_<id>_', () => {
    const id = generateCompetitionId('daily_catch');
    expect(id.startsWith('comp_daily_catch_')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// createCompetition + seedSampleBots
// ──────────────────────────────────────────────────────────────────────────────

describe('createCompetition', () => {
  it('uses template defaults', () => {
    const comp = createCompetition('daily_catch', 1000);
    expect(comp.templateId).toBe('daily_catch');
    expect(comp.status).toBe(COMPETITION_STATUS.REGISTRATION);
    expect(comp.registrationStart).toBe(1000);
    expect(comp.startAt).toBe(1000 + 15 * 60 * 1000);
    expect(comp.endAt).toBe(1000 + 15 * 60 * 1000 + 60 * 60 * 1000);
  });

  it('seeds sample bots', () => {
    const comp = createCompetition('daily_catch', 1000, {}, () => 0.5);
    expect(comp.participants.length).toBeGreaterThan(0);
    expect(comp.participants.every((p) => p.isBot)).toBe(true);
    expect(comp.currentPlayers).toBe(comp.participants.length);
  });

  it('seeds 7 bots for bracket', () => {
    const comp = createCompetition('weekend_tournament', 1000, {}, () => 0.5);
    expect(comp.participants.length).toBe(7);
  });

  it('throws for unknown template (falls back to daily_catch)', () => {
    const comp = createCompetition('nonexistent');
    expect(comp.templateId).toBe('daily_catch');
  });

  it('has empty bracket initially', () => {
    const comp = createCompetition('weekend_tournament');
    expect(comp.bracket).toEqual([]);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// register
// ──────────────────────────────────────────────────────────────────────────────

describe('register', () => {
  let comp: Competition;
  beforeEach(() => {
    comp = createCompetition('daily_catch', 1000, {}, () => 0.5);
  });

  it('happy path', () => {
    const result = register(comp, { userCode: 'player', petName: 'Mochi', userCoins: 0 });
    expect(result.success).toBe(true);
    expect(comp.participants.some((p) => p.userCode === 'player')).toBe(true);
    expect(comp.currentPlayers).toBeGreaterThan(4); // 4 bots + 1 player
  });

  it('rejects duplicate registration', () => {
    register(comp, { userCode: 'player' });
    const dup = register(comp, { userCode: 'player' });
    expect(dup.success).toBe(false);
    expect(dup.message).toMatch(/đã đăng ký/);
  });

  it('rejects when full', () => {
    const tiny = createCompetition('daily_catch', 1000, { maxPlayers: 5 } as any, () => 0);
    // Pre-fill
    for (let i = 0; i < 5; i++) {
      register(tiny, { userCode: `u${i}` });
    }
    const result = register(tiny, { userCode: 'extra' });
    expect(result.success).toBe(false);
  });

  it('rejects when registration closed', () => {
    const tiny = createCompetition('daily_catch', 1000, {}, () => 0);
    tiny.status = COMPETITION_STATUS.IN_PROGRESS;
    const result = register(tiny, { userCode: 'late' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/kết thúc/);
  });

  it('rejects when entry fee > balance', () => {
    const tiny = createCompetition('timing_rush', 1000, {}, () => 0); // entryFee 50
    const result = register(tiny, { userCode: 'poor', userCoins: 10 });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Không đủ xu/);
  });

  it('accepts when balance covers fee', () => {
    const tiny = createCompetition('timing_rush', 1000, {}, () => 0);
    const result = register(tiny, { userCode: 'rich', userCoins: 100 });
    expect(result.success).toBe(true);
    expect(result.feeDeducted).toBe(50);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// submitScore / quickPlay
// ──────────────────────────────────────────────────────────────────────────────

describe('submitScore', () => {
  let comp: Competition;
  beforeEach(() => {
    comp = createCompetition('daily_catch', Date.now(), {}, () => 0.5);
    register(comp, { userCode: 'player' });
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
  });

  it('updates highest and total', () => {
    const result1 = submitScore(comp, { userCode: 'player', score: 100 });
    const result2 = submitScore(comp, { userCode: 'player', score: 200 });
    const result3 = submitScore(comp, { userCode: 'player', score: 50 });
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);
    const p = comp.participants.find((x) => x.userCode === 'player')!;
    expect(p.highestScore).toBe(200);
    expect(p.totalScore).toBe(350);
    expect(p.submissionCount).toBe(3);
  });

  it('auto-registers when submitting mid-progress and capacity allows', () => {
    const result = submitScore(comp, { userCode: 'newbie', score: 50 });
    expect(result.success).toBe(true);
    expect(comp.participants.some((p) => p.userCode === 'newbie')).toBe(true);
  });

  it('rejects after endAt', () => {
    comp.endAt = 999;
    const result = submitScore(comp, { userCode: 'late', score: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects if not started', () => {
    comp.status = COMPETITION_STATUS.REGISTRATION;
    const result = submitScore(comp, { userCode: 'prem', score: 10 });
    expect(result.success).toBe(false);
  });

  it('clamps negative score to 0', () => {
    const result = submitScore(comp, { userCode: 'player', score: -50 });
    expect(result.success).toBe(true);
    const p = comp.participants.find((x) => x.userCode === 'player');
    expect(p?.highestScore).toBe(0);
  });
});

describe('quickPlay', () => {
  it('submits a random score', () => {
    const comp = createCompetition('daily_catch', Date.now(), {}, () => 0.5);
    register(comp, { userCode: 'player' });
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    const result = quickPlay(comp, 'player', 'Mochi', () => 0.5);
    expect(result.success).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(200);
    expect(result.score).toBeLessThanOrEqual(800);
  });

  it('fails when in registration', () => {
    const comp = createCompetition('daily_catch', Date.now(), {}, () => 0.5);
    const result = quickPlay(comp, 'player', 'Mochi', () => 0.5);
    expect(result.success).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// generateBracket
// ──────────────────────────────────────────────────────────────────────────────

describe('generateBracket', () => {
  it('builds 3 rounds for size=8', () => {
    const comp = createCompetition('weekend_tournament', 1000, { bracketSize: 8 } as any, () => 0);
    // bracketSize 8 override reduces seeding pool but should still build 3 rounds (Q/S/F)
    const bracket = generateBracket(comp.participants, 8);
    expect(bracket).toHaveLength(3);
    expect(bracket[0].name).toBe('Tứ Kết');
    expect(bracket[1].name).toBe('Bán Kết');
    expect(bracket[2].name).toMatch(/Chung Kết/);
  });

  it('builds 4 rounds for size=16', () => {
    const comp = createCompetition('weekend_tournament', 1000, {}, () => 0);
    const bracket = generateBracket(comp.participants, 16);
    expect(bracket).toHaveLength(4);
    expect(bracket[0].name).toBe('Vòng 1/8');
    expect(bracket[3].name).toMatch(/Chung Kết/);
  });

  it('emits champion in final match', () => {
    const comp = createCompetition('weekend_tournament', 1000, {}, () => 0);
    const bracket = generateBracket(comp.participants, 8);
    const finalMatch = bracket[bracket.length - 1].matches[0];
    expect(finalMatch.winner).toBeTruthy();
  });

  it('pads participants when fewer than size', () => {
    const small: any[] = [
      { userCode: 'p1', petName: 'A', isBot: false, registeredAt: 0, highestScore: 100, totalScore: 100, submissionCount: 1 },
    ];
    const bracket = generateBracket(small, 4);
    expect(bracket[0].matches).toHaveLength(2);
  });

  it('handles empty participants with bye bots', () => {
    const bracket = generateBracket([], 4);
    expect(bracket).toHaveLength(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// autoGenerateCompetitions
// ──────────────────────────────────────────────────────────────────────────────

describe('autoGenerateCompetitions', () => {
  it('seeds daily templates if missing', () => {
    const empty: CompetitionsState = { active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    const next = autoGenerateCompetitions(empty, 1000);
    expect(next.active.some((c) => c.templateId === 'daily_catch')).toBe(true);
    expect(next.active.some((c) => c.templateId === 'timing_rush')).toBe(true);
    expect(next.active.some((c) => c.templateId === 'tricks_show')).toBe(true);
  });

  it('does not duplicate active comps', () => {
    const seeded = autoGenerateCompetitions({ active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } }, 1000);
    const again = autoGenerateCompetitions(seeded, 2000);
    const dailies = again.active.filter((c) => c.templateId === 'daily_catch');
    expect(dailies.length).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// checkStatusTransitions
// ──────────────────────────────────────────────────────────────────────────────

describe('checkStatusTransitions', () => {
  it('moves registration to in_progress after startAt', () => {
    const seeded = autoGenerateCompetitions({ active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } }, 1000);
    const comp = seeded.active[0];
    const result = checkStatusTransitions(seeded, comp.startAt + 1);
    const updated = result.state.active.find((c) => c.instanceId === comp.instanceId);
    expect(updated?.status).toBe(COMPETITION_STATUS.IN_PROGRESS);
    expect(result.events.some((e) => e.type === 'started')).toBe(true);
  });

  it('builds bracket on bracket comp start', () => {
    const seeded = autoGenerateCompetitions({ active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } }, 1000);
    const weekend = createCompetition('weekend_tournament', 1000, {}, () => 0);
    const state: CompetitionsState = { active: [weekend], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    const result = checkStatusTransitions(state, weekend.startAt + 1);
    const updated = result.state.active.find((c) => c.templateId === 'weekend_tournament');
    expect(updated?.bracket?.length).toBeGreaterThan(0);
  });

  it('ends competition after endAt and moves to history with results', () => {
    const seeded = autoGenerateCompetitions({ active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } }, 1000);
    const comp = seeded.active[0];
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    const result = checkStatusTransitions(seeded, comp.endAt + 1);
    expect(result.state.history.some((c) => c.instanceId === comp.instanceId)).toBe(true);
    expect(result.state.active.some((c) => c.instanceId === comp.instanceId)).toBe(false);
    expect(result.events.some((e) => e.type === 'ended')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// endCompetition
// ──────────────────────────────────────────────────────────────────────────────

describe('endCompetition', () => {
  it('returns null for unknown id', () => {
    const state: CompetitionsState = { active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    expect(endCompetition(state, 'unknown')).toBeNull();
  });

  it('builds results and updates user stats when player participated', () => {
    const comp = createCompetition('daily_catch', Date.now(), {}, () => 0);
    register(comp, { userCode: 'player' });
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    submitScore(comp, { userCode: 'player', score: 9999 }); // player wins
    const state: CompetitionsState = { active: [comp], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    const result = endCompetition(state, comp.instanceId, 99999);
    expect(result).not.toBeNull();
    expect(result!.results[0].userCode).toBe('player');
    expect(result!.results[0].rank).toBe(1);
    expect(result!.state.userStats.played).toBe(1);
    expect(result!.state.userStats.wins).toBe(1);
    expect(result!.state.userStats.podiums).toBe(1);
    expect(result!.userPrize).not.toBeNull();
  });

  it('player comes second when bots outrank', () => {
    const comp = createCompetition('daily_catch', Date.now(), {}, () => 0);
    register(comp, { userCode: 'player' });
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    // kuro = 820 + 0 = 820, player below that
    submitScore(comp, { userCode: 'player', score: 800 });
    const state: CompetitionsState = { active: [comp], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    const result = endCompetition(state, comp.instanceId, 99999);
    const playerResult = result!.results.find((r) => r.userCode === 'player');
    expect(playerResult?.rank).toBeGreaterThan(1);
    expect(playerResult?.rank).toBeLessThanOrEqual(3); // 800 > 540, 490
    expect(result!.state.userStats.podiums).toBe(1);
  });

  it('does not count bot wins', () => {
    const comp = createCompetition('daily_catch', Date.now(), {}, () => 0);
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    const state: CompetitionsState = { active: [comp], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    const result = endCompetition(state, comp.instanceId, 99999);
    expect(result!.state.userStats.played).toBe(0);
  });

  it('caps history at HISTORY_LIMIT', () => {
    const state: CompetitionsState = { active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } };
    let cur = state;
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      const comp = createCompetition('daily_catch', 1000 + i, {}, () => 0);
      comp.status = COMPETITION_STATUS.IN_PROGRESS;
      cur = { ...cur, active: [comp] };
      const result = endCompetition(cur, comp.instanceId, 2000 + i);
      cur = result!.state;
    }
    expect(cur.history.length).toBeLessThanOrEqual(HISTORY_LIMIT);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getPrizeForRank
// ──────────────────────────────────────────────────────────────────────────────

describe('getPrizeForRank', () => {
  const pool = COMPETITION_TEMPLATES.daily_catch.prizePool;

  it('matches rank 1, 2, 3', () => {
    expect(getPrizeForRank(pool, 1)?.coins).toBe(1000);
    expect(getPrizeForRank(pool, 2)?.coins).toBe(500);
    expect(getPrizeForRank(pool, 3)?.coins).toBe(250);
  });

  it('matches range "4-10"', () => {
    expect(getPrizeForRank(pool, 4)?.coins).toBe(100);
    expect(getPrizeForRank(pool, 10)?.coins).toBe(100);
    expect(getPrizeForRank(pool, 11)?.xp).toBe(10); // 11+
  });

  it('returns null for empty pool', () => {
    expect(getPrizeForRank([], 1)).toBeNull();
  });

  it('returns null for rank beyond pool', () => {
    expect(getPrizeForRank([{ rank: 1, rewards: { coins: 1 } }], 5)).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// prizeRewardsTotal
// ──────────────────────────────────────────────────────────────────────────────

describe('prizeRewardsTotal', () => {
  it('zeros for null', () => {
    expect(prizeRewardsTotal(null)).toEqual({ coins: 0, xp: 0, items: 0 });
  });

  it('sums coins and xp', () => {
    expect(prizeRewardsTotal({ coins: 50, xp: 100 })).toEqual({ coins: 50, xp: 100, items: 0 });
  });

  it('sums items quantity', () => {
    expect(
      prizeRewardsTotal({ coins: 0, xp: 0, items: [{ id: 'a', quantity: 2, name: 'A' }, { id: 'b', quantity: 3, name: 'B' }] })
    ).toEqual({ coins: 0, xp: 0, items: 5 });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Selectors
// ──────────────────────────────────────────────────────────────────────────────

describe('selectors', () => {
  let state: CompetitionsState;
  beforeEach(() => {
    state = autoGenerateCompetitions({ active: [], history: [], userStats: { played: 0, wins: 0, podiums: 0, totalCoinsEarned: 0, trophies: [] } }, 1000);
  });

  it('getActiveCompetitions filters completed', () => {
    expect(getActiveCompetitions(state).length).toBeGreaterThan(0);
  });

  it('getRegistrationCompetitions finds only registration', () => {
    expect(getRegistrationCompetitions(state).every((c) => c.status === COMPETITION_STATUS.REGISTRATION)).toBe(true);
  });

  it('getLiveCompetitions finds only in_progress', () => {
    expect(getLiveCompetitions(state).every((c) => c.status === COMPETITION_STATUS.IN_PROGRESS)).toBe(true);
  });

  it('getUpcomingCompetitions finds only upcoming', () => {
    expect(getUpcomingCompetitions(state).every((c) => c.status === COMPETITION_STATUS.UPCOMING)).toBe(true);
  });

  it('findCompetitionById across active + history', () => {
    const c = state.active[0];
    expect(c).toBeTruthy();
    const found = findCompetitionByIdFn(state, c.instanceId);
    expect(found?.instanceId).toBe(c.instanceId);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Leaderboard
// ──────────────────────────────────────────────────────────────────────────────

describe('getLeaderboard', () => {
  it('sorts by highestScore desc', () => {
    const comp = createCompetition('daily_catch', Date.now(), {}, () => 0);
    register(comp, { userCode: 'a', petName: 'A' });
    register(comp, { userCode: 'b', petName: 'B' });
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    submitScore(comp, { userCode: 'a', score: 99999 }); // way above all bots
    submitScore(comp, { userCode: 'b', score: 100 });
    const board = getLeaderboard(comp, 'a');
    expect(board[0].userCode).toBe('a');
    expect(board[0].isYou).toBe(true);
    expect(board[0].highestScore).toBe(99999);
    // Bot kuro (820+0=820) should outrank player b (100)
    expect(board[1].userCode).toBe('bot_kuro');
  });

  it('caps at limit', () => {
    const comp = createCompetition('daily_catch', 1000, {}, () => 0);
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    const board = getLeaderboard(comp, 'x', 2);
    expect(board.length).toBeLessThanOrEqual(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Time helpers
// ──────────────────────────────────────────────────────────────────────────────

describe('getTimeRemaining / formatTimeRemaining', () => {
  it('clamps to 0', () => {
    expect(getTimeRemaining(100, 200)).toBe(0);
  });

  it('formats seconds', () => {
    expect(formatTimeRemaining(0)).toBe('00:00');
    expect(formatTimeRemaining(65000)).toBe('01:05');
  });

  it('formats hours', () => {
    expect(formatTimeRemaining(3661000)).toMatch(/1:01:01/);
  });

  it('formats days', () => {
    expect(formatTimeRemaining(25 * 60 * 60 * 1000)).toMatch(/1d/);
  });
});

describe('formatScore', () => {
  it('passes through < 10000', () => {
    expect(formatScore(500)).toBe('500');
  });

  it('abbreviates >= 10000', () => {
    expect(formatScore(12300)).toBe('12.3k');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// STORE
// ──────────────────────────────────────────────────────────────────────────────

import { useCompetitionsStore } from '../stores/CompetitionsStore';

describe('CompetitionsStore', () => {
  beforeEach(() => {
    // Reset before each store test
    useCompetitionsStore.getState().reset();
  });

  it('starts with default state after reset', () => {
    const s = useCompetitionsStore.getState();
    expect(s.state.active).toEqual([]);
    expect(s.state.history).toEqual([]);
    expect(s.state.userStats.played).toBe(0);
    expect(s.initialized).toBe(true);
  });

  it('createCustomCompetition adds to active', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch');
    expect(comp).not.toBeNull();
    expect(useCompetitionsStore.getState().state.active.length).toBeGreaterThan(0);
  });

  it('createCustomCompetition returns null for unknown', () => {
    expect(useCompetitionsStore.getState().createCustomCompetition('nope')).toBeNull();
  });

  it('ensureTemplates seeds daily templates', () => {
    useCompetitionsStore.getState().ensureTemplates();
    const s = useCompetitionsStore.getState().state;
    expect(s.active.some((c) => c.templateId === 'daily_catch')).toBe(true);
  });

  it('registerForCompetition returns success', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    const result = useCompetitionsStore.getState().registerForCompetition(comp.instanceId, 'Mochi', 0);
    expect(result.success).toBe(true);
    expect(useCompetitionsStore.getState().selectActiveParticipant(comp.instanceId, 'player')).not.toBeNull();
  });

  it('registerForCompetition fails for unknown id', () => {
    const result = useCompetitionsStore.getState().registerForCompetition('xx', 'Mochi', 0);
    expect(result.success).toBe(false);
  });

  it('submitScoreAction updates score', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    comp.status = COMPETITION_STATUS.IN_PROGRESS;
    useCompetitionsStore.setState((s) => ({ state: { ...s.state, active: s.state.active.map((c) => c.instanceId === comp.instanceId ? { ...c, status: 'in_progress' } : c) } }));
    const result = useCompetitionsStore.getState().submitScoreAction(comp.instanceId, 500);
    expect(result.success).toBe(true);
  });

  it('quickPlayAction updates score', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    useCompetitionsStore.setState((s) => ({ state: { ...s.state, active: s.state.active.map((c) => c.instanceId === comp.instanceId ? { ...c, status: 'in_progress' } : c) } }));
    const result = useCompetitionsStore.getState().quickPlayAction(comp.instanceId, 'Mochi');
    expect(result.success).toBe(true);
  });

  it('endCompetitionAction returns null for unknown id', () => {
    expect(useCompetitionsStore.getState().endCompetitionAction('xx')).toBeNull();
  });

  it('endCompetitionAction completes a comp', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    useCompetitionsStore.setState((s) => ({ state: { ...s.state, active: s.state.active.map((c) => c.instanceId === comp.instanceId ? { ...c, status: 'in_progress' } : c) } }));
    useCompetitionsStore.getState().registerForCompetition(comp.instanceId, 'Mochi', 0);
    const result = useCompetitionsStore.getState().endCompetitionAction(comp.instanceId);
    expect(result).not.toBeNull();
    expect(useCompetitionsStore.getState().state.history.some((c) => c.instanceId === comp.instanceId)).toBe(true);
  });

  it('selectById finds active + history', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    expect(useCompetitionsStore.getState().selectById(comp.instanceId)).not.toBeNull();
  });

  it('selectLeaderboard returns array', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    const board = useCompetitionsStore.getState().selectLeaderboard(comp.instanceId, 'player');
    expect(Array.isArray(board)).toBe(true);
  });

  it('selectUserStats returns stats', () => {
    const stats = useCompetitionsStore.getState().selectUserStats();
    expect(stats.played).toBe(0);
    expect(stats.trophies).toEqual([]);
  });

  it('selectAllActive / Live / Registration / Upcoming / History work', () => {
    useCompetitionsStore.getState().createCustomCompetition('daily_catch');
    expect(Array.isArray(useCompetitionsStore.getState().selectAllActive())).toBe(true);
    expect(Array.isArray(useCompetitionsStore.getState().selectLive())).toBe(true);
    expect(Array.isArray(useCompetitionsStore.getState().selectRegistration())).toBe(true);
    expect(Array.isArray(useCompetitionsStore.getState().selectUpcoming())).toBe(true);
    expect(Array.isArray(useCompetitionsStore.getState().selectHistory())).toBe(true);
  });

  it('generateBracketAction returns false for non-bracket', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('daily_catch')!;
    expect(useCompetitionsStore.getState().generateBracketAction(comp.instanceId)).toBe(false);
  });

  it('generateBracketAction returns true for bracket', () => {
    const comp = useCompetitionsStore.getState().createCustomCompetition('weekend_tournament')!;
    expect(useCompetitionsStore.getState().generateBracketAction(comp.instanceId)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// seedSampleBots direct
// ──────────────────────────────────────────────────────────────────────────────

describe('seedSampleBots', () => {
  it('seeds 7 for bracket', () => {
    const comp: Competition = {
      ...createCompetition('daily_catch', 1000, {}, () => 0.5),
      participants: [],
      currentPlayers: 0,
      type: COMPETITION_TYPES.BRACKET,
    } as Competition;
    seedSampleBots(comp, () => 0);
    expect(comp.participants.length).toBe(7);
    expect(comp.currentPlayers).toBe(7);
  });
});
