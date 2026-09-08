/**
 * CompetitionsStore (Zustand) — Step 12f
 *
 * Manages active + history competitions, user stats, and the lobby
 * lifecycle (upcoming → registration → in_progress → completed).
 *
 * Auto-persists to AsyncStorage and auto-creates daily/weekly templates
 * on hydrate (daily_catch, timing_rush, tricks_show).
 */

import { create } from 'zustand';
import { storage, StorageKeys } from '../api/storage';
import {
  COMPETITION_STATUS,
  COMPETITION_TEMPLATES,
  autoGenerateCompetitions,
  checkStatusTransitions,
  createCompetition,
  endCompetition,
  ensureCompetitionsStructure,
  findCompetitionById,
  generateBracket,
  getActiveCompetitions,
  getLeaderboard,
  getLiveCompetitions,
  getRegistrationCompetitions,
  getUpcomingCompetitions,
  quickPlay,
  register,
  submitScore,
  type CompetitionsState,
  type Competition,
  type CompetitionResult,
  type EndCompetitionResult,
  type LeaderboardEntry,
  type Participant,
  type PrizeRewards,
  type RegisterResult,
  type SubmitScoreResult,
  type UserCompetitionStats,
} from '../api/competitions';

// ============================================================================
// Types
// ============================================================================

const DEFAULT_STATE: CompetitionsState = {
  active: [],
  history: [],
  userStats: {
    played: 0,
    wins: 0,
    podiums: 0,
    totalCoinsEarned: 0,
    trophies: [],
  },
};

export interface CompetitionsStoreState {
  state: CompetitionsState;
  initialized: boolean;
  lastTickAt: number;

  // ─── Loaders ───
  hydrate: () => Promise<void>;
  reset: () => void;

  // ─── Lobby lifecycle ───
  tick: () => void;                                            // check status transitions
  ensureTemplates: () => void;                                 // auto-create daily/weekly
  createCustomCompetition: (templateId: string) => Competition | null;

  // ─── Actions ───
  registerForCompetition: (instanceId: string, petName: string, userCoins: number) => RegisterResult;
  submitScoreAction: (instanceId: string, score: number) => SubmitScoreResult;
  quickPlayAction: (instanceId: string, petName: string) => SubmitScoreResult;
  endCompetitionAction: (instanceId: string) => EndCompetitionResult | null;
  generateBracketAction: (instanceId: string) => boolean;

  // ─── Selectors ───
  selectAllActive: () => Competition[];
  selectLive: () => Competition[];
  selectRegistration: () => Competition[];
  selectUpcoming: () => Competition[];
  selectHistory: () => Competition[];
  selectById: (instanceId: string) => Competition | null;
  selectLeaderboard: (instanceId: string, userCode: string, limit?: number) => LeaderboardEntry[];
  selectUserStats: () => UserCompetitionStats;
  selectActiveParticipant: (instanceId: string, userCode: string) => Participant | null;

  // ─── Persistence ───
  _persist: () => Promise<void>;
}

// ============================================================================
// Helpers
// ============================================================================

function patch(state: CompetitionsState, comp: Competition): Competition[] {
  return state.active.map((c) => (c.instanceId === comp.instanceId ? comp : c));
}

// ============================================================================
// Store
// ============================================================================

export const useCompetitionsStore = create<CompetitionsStoreState>((set, get) => {
  const persistDebounced = (() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const s = get().state;
        storage.setJSON(StorageKeys.CompetitionsState, s).catch(() => undefined);
      }, 50);
    };
  })();

  return {
    state: { ...DEFAULT_STATE },
    initialized: false,
    lastTickAt: 0,

    // ── Persistence ──
    async hydrate() {
      const raw = await storage.getJSON<CompetitionsState>(StorageKeys.CompetitionsState);
      const structured = ensureCompetitionsStructure(raw ?? null);
      let next: CompetitionsState = structured;

      // Auto-generate daily/weekly templates if missing
      next = autoGenerateCompetitions(next);
      // Run transitions so old timestamped entries are processed
      const transitioned = checkStatusTransitions(next);
      next = transitioned.state;

      set({ state: next, initialized: true, lastTickAt: Date.now() });
      await storage.setJSON(StorageKeys.CompetitionsState, next);
    },

    reset() {
      set({ state: { ...DEFAULT_STATE }, initialized: true, lastTickAt: Date.now() });
      storage.delete(StorageKeys.CompetitionsState).catch(() => undefined);
    },

    // ── Lobby lifecycle ──
    tick() {
      const cur = get().state;
      // Don't tick more than once per second to avoid drift
      if (Date.now() - get().lastTickAt < 1000) return;
      const { state: next, events } = checkStatusTransitions(cur);
      set({ state: next, lastTickAt: Date.now() });
      if (events.length > 0) persistDebounced();
    },

    ensureTemplates() {
      const cur = get().state;
      const next = autoGenerateCompetitions(cur);
      if (next.active.length !== cur.active.length) {
        set({ state: next });
        persistDebounced();
      }
    },

    createCustomCompetition(templateId) {
      if (!COMPETITION_TEMPLATES[templateId]) return null;
      const comp = createCompetition(templateId);
      set((s) => ({ state: { ...s.state, active: [...s.state.active, comp] } }));
      persistDebounced();
      return comp;
    },

    // ── Actions ──
    registerForCompetition(instanceId, petName, userCoins) {
      const cur = get().state;
      const idx = cur.active.findIndex((c) => c.instanceId === instanceId);
      if (idx === -1) {
        return { success: false, message: 'Không tìm thấy giải đấu yêu cầu!' };
      }
      const comp = { ...cur.active[idx], participants: [...cur.active[idx].participants] };
      const result = register(comp, { userCode: 'player', petName, userCoins });
      if (!result.success) {
        return result;
      }
      const updatedActive = [...cur.active];
      updatedActive[idx] = comp;
      set({ state: { ...cur, active: updatedActive } });
      persistDebounced();
      return result;
    },

    submitScoreAction(instanceId, score) {
      const cur = get().state;
      const idx = cur.active.findIndex((c) => c.instanceId === instanceId);
      if (idx === -1) return { success: false, message: 'Không tìm thấy giải đấu' };
      const comp = { ...cur.active[idx], participants: [...cur.active[idx].participants] };
      const result = submitScore(comp, { userCode: 'player', score });
      if (!result.success) return result;
      const updatedActive = patch(cur, comp);
      set({ state: { ...cur, active: updatedActive } });
      persistDebounced();
      return result;
    },

    quickPlayAction(instanceId, petName) {
      const cur = get().state;
      const idx = cur.active.findIndex((c) => c.instanceId === instanceId);
      if (idx === -1) return { success: false, message: 'Không tìm thấy giải đấu' };
      const comp = { ...cur.active[idx], participants: [...cur.active[idx].participants] };
      const result = quickPlay(comp, 'player', petName);
      const updatedActive = patch(cur, comp);
      set({ state: { ...cur, active: updatedActive } });
      persistDebounced();
      return result;
    },

    endCompetitionAction(instanceId) {
      const cur = get().state;
      const result = endCompetition(cur, instanceId);
      if (!result) return null;
      set({ state: result.state });
      persistDebounced();
      return result;
    },

    generateBracketAction(instanceId) {
      const cur = get().state;
      const idx = cur.active.findIndex((c) => c.instanceId === instanceId);
      if (idx === -1) return false;
      const comp = { ...cur.active[idx] };
      if (comp.type !== 'bracket') return false;
      comp.bracket = generateBracket(comp.participants, comp.bracketSize ?? 8);
      const updated = patch(cur, comp);
      set({ state: { ...cur, active: updated } });
      persistDebounced();
      return true;
    },

    // ── Selectors ──
    selectAllActive() {
      return getActiveCompetitions(get().state);
    },
    selectLive() {
      return getLiveCompetitions(get().state);
    },
    selectRegistration() {
      return getRegistrationCompetitions(get().state);
    },
    selectUpcoming() {
      return getUpcomingCompetitions(get().state);
    },
    selectHistory() {
      return get().state.history;
    },
    selectById(instanceId) {
      return findCompetitionById(get().state, instanceId);
    },
    selectLeaderboard(instanceId, userCode, limit) {
      const comp = findCompetitionById(get().state, instanceId);
      if (!comp) return [];
      return getLeaderboard(comp, userCode, limit);
    },
    selectUserStats() {
      return get().state.userStats;
    },
    selectActiveParticipant(instanceId, userCode) {
      const comp = findCompetitionById(get().state, instanceId);
      if (!comp) return null;
      return comp.participants.find((p) => p.userCode === userCode) ?? null;
    },

    // ── Persistence ──
    async _persist() {
      await storage.setJSON(StorageKeys.CompetitionsState, get().state);
    },
  };
});

// Auto-tick driver: throttled interval registered once per app session.
// Each call to hydrate/tick updates lastTickAt; the loop runs once per
// 5s while the app is in foreground.
let autoTickHandle: ReturnType<typeof setInterval> | null = null;

export function startCompetitionsAutoTick(): () => void {
  if (autoTickHandle) return () => {};
  autoTickHandle = setInterval(() => {
    try {
      useCompetitionsStore.getState().tick();
    } catch (err) {
      // silent: don't crash app over tick failure
    }
  }, 5000);
  return () => {
    if (autoTickHandle) {
      clearInterval(autoTickHandle);
      autoTickHandle = null;
    }
  };
}

// Re-export helper status constants for screens
export { COMPETITION_STATUS };
export type { Competition, CompetitionResult, LeaderboardEntry, Participant, PrizeRewards, UserCompetitionStats };
