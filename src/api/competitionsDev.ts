/**
 * Competitions dev exposes — Step 12f e2e
 *
 * Side-effect module for __DEV__ e2e testing.
 * Registers globals on globalThis and window under __COMP_*__ prefix.
 */

import {
  COMPETITION_TEMPLATES,
  COMPETITION_TYPES,
  COMPETITION_STATUS,
  COMPETITION_TYPE_LABELS,
  COMPETITION_STATUS_LABELS,
  COMPETITION_TEMPLATE_IDS,
  DEFAULT_BRACKET_SIZE,
  DEFAULT_DURATION_MS,
  DEFAULT_REGISTRATION_MS,
  HISTORY_LIMIT,
  LEADERBOARD_LIMIT,
  MIN_PLAYERS_FOR_PRIZES,
  autoGenerateCompetitions,
  checkStatusTransitions,
  createCompetition,
  endCompetition,
  ensureCompetitionsStructure,
  formatScore,
  formatTimeRemaining,
  generateBracket,
  getLeaderboard,
  getPrizeForRank,
  prizeRewardsTotal,
  quickPlay,
  register,
  submitScore,
  type Competition,
  type CompetitionType,
} from './competitions';
import { useCompetitionsStore, startCompetitionsAutoTick } from '../stores/CompetitionsStore';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  const g = globalThis as any;
  const w = typeof window !== 'undefined' ? (window as any) : null;

  // ── Catalog reads ──
  g.__COMP_COUNT__ = Object.keys(COMPETITION_TEMPLATES).length;
  g.__COMP_TEMPLATE_IDS__ = COMPETITION_TEMPLATE_IDS;
  g.__COMP_TYPES__ = Object.values(COMPETITION_TYPES);
  g.__COMP_STATUSES__ = Object.values(COMPETITION_STATUS);
  g.__COMP_TYPE_LABELS__ = COMPETITION_TYPE_LABELS;
  g.__COMP_STATUS_LABELS__ = COMPETITION_STATUS_LABELS;
  g.__COMP_DEFAULT_BRACKET_SIZE__ = DEFAULT_BRACKET_SIZE;
  g.__COMP_DEFAULT_DURATION_MS__ = DEFAULT_DURATION_MS;
  g.__COMP_DEFAULT_REGISTRATION_MS__ = DEFAULT_REGISTRATION_MS;
  g.__COMP_LEADERBOARD_LIMIT__ = LEADERBOARD_LIMIT;
  g.__COMP_HISTORY_LIMIT__ = HISTORY_LIMIT;

  // ── Helpers ──
  g.__COMP_GET_TEMPLATE__ = (id: string) => COMPETITION_TEMPLATES[id] ?? null;
  g.__COMP_GET_BY_ID__ = (id: string) => useCompetitionsStore.getState().selectById(id);
  g.__COMP_GET_LEADERBOARD__ = (id: string, limit?: number) =>
    useCompetitionsStore.getState().selectLeaderboard(id, 'player', limit);
  g.__COMP_GET_PRIZE_FOR_RANK__ = (templateId: string, rank: number) => {
    const t = COMPETITION_TEMPLATES[templateId];
    if (!t) return null;
    return getPrizeForRank(t.prizePool, rank);
  };
  g.__COMP_PRIZE_TOTAL__ = (prize: any) => prizeRewardsTotal(prize);
  g.__COMP_FORMAT_TIME__ = (ms: number) => formatTimeRemaining(ms);
  g.__COMP_FORMAT_SCORE__ = (n: number) => formatScore(n);
  g.__COMP_GENERATE_BRACKET__ = (instanceId: string) =>
    useCompetitionsStore.getState().generateBracketAction(instanceId);

  // ── Pure helper re-exports for unit-style tests ──
  g.__COMP_PURE_CREATE__ = (templateId: string) => createCompetition(templateId);
  g.__COMP_PURE_END__ = (state: any, instanceId: string) => endCompetition(state, instanceId);
  g.__COMP_PURE_TRANSITIONS__ = (state: any) => checkStatusTransitions(state);
  g.__COMP_PURE_AUTO_GEN__ = (state: any) => autoGenerateCompetitions(state);
  g.__COMP_PURE_REGISTER__ = (comp: Competition, args: { userCode: string; petName?: string; userCoins?: number }) =>
    register(comp, args);
  g.__COMP_PURE_SUBMIT__ = (comp: Competition, args: { userCode: string; score: number }) =>
    submitScore(comp, args);
  g.__COMP_PURE_QUICK_PLAY__ = (comp: Competition, userCode: string, petName: string) =>
    quickPlay(comp, userCode, petName);
  g.__COMP_PURE_ENSURE__ = (state: any) => ensureCompetitionsStructure(state);
  g.__COMP_PURE_LEADERBOARD__ = (comp: Competition, userCode: string, limit?: number) =>
    getLeaderboard(comp, userCode, limit);

  // ── Store actions ──
  g.__COMP_RESET__ = () => useCompetitionsStore.getState().reset();
  g.__COMP_TICK__ = () => useCompetitionsStore.getState().tick();
  g.__COMP_ENSURE_TEMPLATES__ = () => useCompetitionsStore.getState().ensureTemplates();
  g.__COMP_CREATE__ = (templateId: string) =>
    useCompetitionsStore.getState().createCustomCompetition(templateId);
  g.__COMP_REGISTER__ = (id: string, petName: string, userCoins: number) =>
    useCompetitionsStore.getState().registerForCompetition(id, petName, userCoins);
  g.__COMP_SUBMIT_SCORE__ = (id: string, score: number) =>
    useCompetitionsStore.getState().submitScoreAction(id, score);
  g.__COMP_QUICK_PLAY__ = (id: string, petName: string) =>
    useCompetitionsStore.getState().quickPlayAction(id, petName);
  g.__COMP_END__ = (id: string) => useCompetitionsStore.getState().endCompetitionAction(id);

  // ── Store getters ──
  g.__COMP_GET_ACTIVE__ = () => useCompetitionsStore.getState().selectAllActive();
  g.__COMP_GET_LIVE__ = () => useCompetitionsStore.getState().selectLive();
  g.__COMP_GET_REGISTRATION__ = () => useCompetitionsStore.getState().selectRegistration();
  g.__COMP_GET_UPCOMING__ = () => useCompetitionsStore.getState().selectUpcoming();
  g.__COMP_GET_HISTORY__ = () => useCompetitionsStore.getState().selectHistory();
  g.__COMP_GET_STATE__ = () => useCompetitionsStore.getState().state;
  g.__COMP_GET_USER_STATS__ = () => useCompetitionsStore.getState().selectUserStats();
  g.__COMP_GET_PARTICIPANT__ = (id: string) =>
    useCompetitionsStore.getState().selectActiveParticipant(id, 'player');

  // ── Lifecycle ──
  g.__COMP_START_TICK__ = () => startCompetitionsAutoTick();

  // Mirror to window for Playwright
  if (w) {
    const keys = [
      '__COMP_COUNT__',
      '__COMP_TEMPLATE_IDS__',
      '__COMP_TYPES__',
      '__COMP_STATUSES__',
      '__COMP_TYPE_LABELS__',
      '__COMP_STATUS_LABELS__',
      '__COMP_DEFAULT_BRACKET_SIZE__',
      '__COMP_DEFAULT_DURATION_MS__',
      '__COMP_DEFAULT_REGISTRATION_MS__',
      '__COMP_LEADERBOARD_LIMIT__',
      '__COMP_HISTORY_LIMIT__',
      '__COMP_GET_TEMPLATE__',
      '__COMP_GET_BY_ID__',
      '__COMP_GET_LEADERBOARD__',
      '__COMP_GET_PRIZE_FOR_RANK__',
      '__COMP_PRIZE_TOTAL__',
      '__COMP_FORMAT_TIME__',
      '__COMP_FORMAT_SCORE__',
      '__COMP_GENERATE_BRACKET__',
      '__COMP_PURE_CREATE__',
      '__COMP_PURE_END__',
      '__COMP_PURE_TRANSITIONS__',
      '__COMP_PURE_AUTO_GEN__',
      '__COMP_PURE_REGISTER__',
      '__COMP_PURE_SUBMIT__',
      '__COMP_PURE_QUICK_PLAY__',
      '__COMP_PURE_ENSURE__',
      '__COMP_PURE_LEADERBOARD__',
      '__COMP_RESET__',
      '__COMP_TICK__',
      '__COMP_ENSURE_TEMPLATES__',
      '__COMP_CREATE__',
      '__COMP_REGISTER__',
      '__COMP_SUBMIT_SCORE__',
      '__COMP_QUICK_PLAY__',
      '__COMP_END__',
      '__COMP_GET_ACTIVE__',
      '__COMP_GET_LIVE__',
      '__COMP_GET_REGISTRATION__',
      '__COMP_GET_UPCOMING__',
      '__COMP_GET_HISTORY__',
      '__COMP_GET_STATE__',
      '__COMP_GET_USER_STATS__',
      '__COMP_GET_PARTICIPANT__',
      '__COMP_START_TICK__',
    ];
    for (const k of keys) (w as any)[k] = (g as any)[k];
  }
}
