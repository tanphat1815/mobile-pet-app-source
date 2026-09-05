/**
 * Competitions API — Step 12f
 *
 * Ported from desktop src/core/competitions/competition-config.js
 *                  + src/core/competitions/competition-manager.js.
 *
 * 4 competition templates × 5 types (SCORE_RACE / BRACKET / ROUND_ROBIN /
 * MARATHON / RARE_HUNT), with bracket generation, prize distribution,
 * and full lobby lifecycle (upcoming → registration → in_progress →
 * completed).
 *
 * Pure helpers — no storage or React. Store in src/stores/CompetitionsStore.ts
 * wires these into zustand + AsyncStorage.
 */

// ============================================================================
// Constants
// ============================================================================

export const COMPETITION_TYPES = {
  SCORE_RACE: 'score_race',
  BRACKET: 'bracket',
  ROUND_ROBIN: 'round_robin',
  MARATHON: 'marathon',
  RARE_HUNT: 'rare_hunt',
} as const;

export type CompetitionType =
  (typeof COMPETITION_TYPES)[keyof typeof COMPETITION_TYPES];

export const COMPETITION_STATUS = {
  UPCOMING: 'upcoming',
  REGISTRATION: 'registration',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type CompetitionStatus =
  (typeof COMPETITION_STATUS)[keyof typeof COMPETITION_STATUS];

export const COMPETITION_TYPE_LABELS: Record<CompetitionType, string> = {
  score_race: 'Đua điểm',
  bracket: 'Đấu loại',
  round_robin: 'Vòng tròn',
  marathon: 'Marathon',
  rare_hunt: 'Săn đồ hiếm',
};

export const COMPETITION_STATUS_LABELS: Record<CompetitionStatus, string> = {
  upcoming: 'Sắp mở',
  registration: 'Đang mở đăng ký',
  in_progress: 'Đang diễn ra',
  completed: 'Đã kết thúc',
};

export const DEFAULT_REGISTRATION_MS = 15 * 60 * 1000;       // 15 phút
export const DEFAULT_DURATION_MS = 60 * 60 * 1000;          // 1 giờ
export const DEFAULT_BRACKET_SIZE = 8;
export const LEADERBOARD_LIMIT = 10;
export const HISTORY_LIMIT = 50;
export const MIN_PLAYERS_FOR_PRIZES = 1;

// ============================================================================
// Types
// ============================================================================

export interface PrizeItem {
  id: string;
  quantity: number;
  name: string;
}

export interface PrizeRewards {
  coins?: number;
  xp?: number;
  items?: PrizeItem[];
}

export type PrizeRank = number | string; // 1, "3-4", "5-8", "11+"

export interface PrizeTier {
  rank: PrizeRank;
  rewards: PrizeRewards;
}

export type GameId = 'catch_fall' | 'timing_game' | 'tricks' | 'wellness' | 'all';
export type Schedule = 'daily' | 'weekly' | 'once';

export interface CompetitionTemplate {
  id: string;
  name: string;
  description: string;
  type: CompetitionType;
  icon: string;
  gameId: GameId;
  schedule: Schedule;
  duration: number;             // ms
  registrationDuration: number; // ms
  scoringMethod: 'highest_score' | 'total_score' | 'rare_count';
  minPlayers: number;
  maxPlayers: number;
  entryFee: number;
  prizePool: PrizeTier[];
  bracketSize?: number;
}

export interface Participant {
  userCode: string;
  petName: string;
  avatar: string;
  isBot: boolean;
  registeredAt: number;
  highestScore: number;
  totalScore: number;
  submissionCount: number;
}

export interface BracketMatch {
  matchId: string;
  player1: Participant | null;
  player2: Participant | null;
  score1: number;
  score2: number;
  winner: Participant | null;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface BracketRound {
  round: number;
  name: string;
  matches: BracketMatch[];
}

export interface CompetitionResult {
  rank: number;
  userCode: string;
  petName: string;
  isBot: boolean;
  score: number;
  prize: PrizeRewards | null;
}

export interface Competition extends CompetitionTemplate {
  instanceId: string;
  templateId: string;
  status: CompetitionStatus;
  createdAt: number;
  registrationStart: number;
  registrationEnd: number;
  startAt: number;
  endAt: number;
  completedAt?: number;
  currentPlayers: number;
  participants: Participant[];
  bracket?: BracketRound[];
  results?: CompetitionResult[];
}

export interface UserCompetitionStats {
  played: number;
  wins: number;
  podiums: number;        // Top 3
  totalCoinsEarned: number;
  trophies: { name: string; rank: number; compName: string; date: number }[];
}

export interface CompetitionsState {
  active: Competition[];
  history: Competition[];
  userStats: UserCompetitionStats;
}

// ============================================================================
// Template catalog
// ============================================================================

export const COMPETITION_TEMPLATES: Record<string, CompetitionTemplate> = {
  daily_catch: {
    id: 'daily_catch',
    name: 'Giải Vô Địch Bắt Táo Hàng Ngày',
    description: 'Thi đấu bắt táo Catch Fall tính điểm cao nhất trong 60 phút',
    type: COMPETITION_TYPES.SCORE_RACE,
    icon: '🍎',
    gameId: 'catch_fall',
    schedule: 'daily',
    duration: 60 * 60 * 1000,
    registrationDuration: 15 * 60 * 1000,
    scoringMethod: 'highest_score',
    minPlayers: 1,
    maxPlayers: 50,
    entryFee: 0,
    prizePool: [
      { rank: 1, rewards: { coins: 1000, xp: 200, items: [{ id: 'gold_trophy', quantity: 1, name: 'Cúp Vàng Danh Giá' }] } },
      { rank: 2, rewards: { coins: 500, xp: 100, items: [{ id: 'silver_trophy', quantity: 1, name: 'Cúp Bạc Xuất Sắc' }] } },
      { rank: 3, rewards: { coins: 250, xp: 50, items: [{ id: 'bronze_trophy', quantity: 1, name: 'Cúp Đồng Tài Năng' }] } },
      { rank: '4-10', rewards: { coins: 100, xp: 25 } },
      { rank: '11+', rewards: { xp: 10 } },
    ],
  },

  weekend_tournament: {
    id: 'weekend_tournament',
    name: 'Đại Hội Tinh Anh Cuối Tuần (16 Pet)',
    description: 'Giải đấu loại trực tiếp 16 tuyển thủ tranh Cúp Quán Quân',
    type: COMPETITION_TYPES.BRACKET,
    icon: '🏆',
    gameId: 'catch_fall',
    schedule: 'weekly',
    duration: 4 * 60 * 60 * 1000,
    registrationDuration: 30 * 60 * 1000,
    bracketSize: 16,
    scoringMethod: 'highest_score',
    minPlayers: 4,
    maxPlayers: 16,
    entryFee: 100,
    prizePool: [
      { rank: 1, rewards: { coins: 5000, xp: 1000, items: [{ id: 'tournament_champion', quantity: 1, name: 'Cúp Quán Quân Tinh Anh' }] } },
      { rank: 2, rewards: { coins: 2500, xp: 500 } },
      { rank: '3-4', rewards: { coins: 1000, xp: 250 } },
      { rank: '5-8', rewards: { coins: 500, xp: 100 } },
    ],
  },

  timing_rush: {
    id: 'timing_rush',
    name: 'Đấu Trường Phản Xạ Căn Thời Gian',
    description: 'Thử thách độ chính xác bấm thanh trượt Timing Game',
    type: COMPETITION_TYPES.SCORE_RACE,
    icon: '⚡',
    gameId: 'timing_game',
    schedule: 'daily',
    duration: 30 * 60 * 1000,
    registrationDuration: 10 * 60 * 1000,
    scoringMethod: 'highest_score',
    minPlayers: 1,
    maxPlayers: 30,
    entryFee: 50,
    prizePool: [
      { rank: 1, rewards: { coins: 2000, xp: 400, items: [{ id: 'lightning_badge', quantity: 1, name: 'Huy Hiệu Tia Chớp' }] } },
      { rank: 2, rewards: { coins: 1000, xp: 200 } },
      { rank: 3, rewards: { coins: 500, xp: 100 } },
      { rank: '4-10', rewards: { coins: 150, xp: 30 } },
    ],
  },

  marathon_24h: {
    id: 'marathon_24h',
    name: 'Thử Thách Marathon 24 Giờ Bền Bỉ',
    description: 'Ai tích lũy nhiều điểm mini-game nhất trong 24 giờ',
    type: COMPETITION_TYPES.MARATHON,
    icon: '🏃',
    gameId: 'all',
    schedule: 'weekly',
    duration: 24 * 60 * 60 * 1000,
    registrationDuration: 60 * 60 * 1000,
    scoringMethod: 'total_score',
    minPlayers: 1,
    maxPlayers: 100,
    entryFee: 0,
    prizePool: [
      { rank: 1, rewards: { coins: 3000, xp: 800, items: [{ id: 'marathon_medal', quantity: 1, name: 'Huy Chương Bền Bỉ' }] } },
      { rank: 2, rewards: { coins: 1500, xp: 400 } },
      { rank: 3, rewards: { coins: 800, xp: 200 } },
      { rank: '4-10', rewards: { coins: 200, xp: 50 } },
    ],
  },

  tricks_show: {
    id: 'tricks_show',
    name: 'Biểu Diễn Pet Tricks Đỉnh Cao',
    description: 'Pet nào biểu diễn tricks xuất sắc nhất tuần này',
    type: COMPETITION_TYPES.SCORE_RACE,
    icon: '🎓',
    gameId: 'tricks',
    schedule: 'weekly',
    duration: 7 * 24 * 60 * 60 * 1000,
    registrationDuration: 60 * 60 * 1000,
    scoringMethod: 'highest_score',
    minPlayers: 1,
    maxPlayers: 25,
    entryFee: 0,
    prizePool: [
      { rank: 1, rewards: { coins: 1500, xp: 300, items: [{ id: 'star_performer', quantity: 1, name: 'Huy Hiệu Ngôi Sao Biểu Diễn' }] } },
      { rank: 2, rewards: { coins: 800, xp: 150 } },
      { rank: 3, rewards: { coins: 400, xp: 75 } },
      { rank: '4-10', rewards: { coins: 120, xp: 30 } },
    ],
  },
};

export const COMPETITION_TEMPLATE_IDS = Object.keys(COMPETITION_TEMPLATES);

export function getCompetitionTemplate(id: string): CompetitionTemplate | null {
  return COMPETITION_TEMPLATES[id] ?? null;
}

export function listCompetitionTemplates(): CompetitionTemplate[] {
  return Object.values(COMPETITION_TEMPLATES);
}

// ============================================================================
// Structure normalizers
// ============================================================================

export function ensureCompetitionsStructure(state: CompetitionsState | null | undefined): CompetitionsState {
  const base: CompetitionsState = state && typeof state === 'object' ? state : ({} as CompetitionsState);
  return {
    active: Array.isArray(base.active) ? base.active : [],
    history: Array.isArray(base.history) ? base.history : [],
    userStats: {
      played: base.userStats?.played ?? 0,
      wins: base.userStats?.wins ?? 0,
      podiums: base.userStats?.podiums ?? 0,
      totalCoinsEarned: base.userStats?.totalCoinsEarned ?? 0,
      trophies: Array.isArray(base.userStats?.trophies) ? base.userStats.trophies : [],
    },
  };
}

// ============================================================================
// ID generation
// ============================================================================

export function generateCompetitionId(templateId: string, now = Date.now()): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `comp_${templateId}_${now}_${rand}`;
}

// ============================================================================
// Bot seeding
// ============================================================================

const SAMPLE_BOTS: Array<{ userCode: string; petName: string; avatar: string; baseScore: number }> = [
  { userCode: 'bot_mimi', petName: 'Mimi 🐱', avatar: '🐱', baseScore: 650 },
  { userCode: 'bot_kuro', petName: 'Kuro 🐾', avatar: '🐕', baseScore: 820 },
  { userCode: 'bot_luna', petName: 'Luna 🌙', avatar: '🐰', baseScore: 540 },
  { userCode: 'bot_shiba', petName: 'Shiba 🦊', avatar: '🦊', baseScore: 780 },
  { userCode: 'bot_dino', petName: 'Dino 🦖', avatar: '🦖', baseScore: 490 },
  { userCode: 'bot_meo_con', petName: 'Meo Con 🐈', avatar: '🐈', baseScore: 610 },
  { userCode: 'bot_pikachu', petName: 'Pika ⚡', avatar: '🐹', baseScore: 730 },
];

export function seedSampleBots(
  comp: Competition,
  randomFn: () => number = Math.random,
  botList = SAMPLE_BOTS
): void {
  const seedCount = comp.type === COMPETITION_TYPES.BRACKET ? 7 : 4;
  for (let i = 0; i < Math.min(seedCount, botList.length); i++) {
    const b = botList[i];
    comp.participants.push({
      userCode: b.userCode,
      petName: b.petName,
      avatar: b.avatar,
      isBot: true,
      registeredAt: Date.now() - 60000 * (i + 1),
      highestScore: b.baseScore + Math.floor(randomFn() * 200),
      totalScore: b.baseScore * 2,
      submissionCount: 2,
    });
    comp.currentPlayers += 1;
  }
}

// ============================================================================
// createCompetition
// ============================================================================

export function createCompetition(
  templateId: string,
  now: number = Date.now(),
  customOptions: Partial<Competition> = {},
  randomFn: () => number = Math.random
): Competition {
  const template = COMPETITION_TEMPLATES[templateId] ?? COMPETITION_TEMPLATES.daily_catch;
  if (!template) {
    throw new Error(`Competition template "${templateId}" not found`);
  }
  const regDuration = template.registrationDuration || DEFAULT_REGISTRATION_MS;
  const playDuration = template.duration || DEFAULT_DURATION_MS;

  const comp: Competition = {
    ...template,
    ...customOptions,
    instanceId: generateCompetitionId(templateId, now),
    templateId: template.id,
    status: COMPETITION_STATUS.REGISTRATION,
    createdAt: now,
    registrationStart: now,
    registrationEnd: now + regDuration,
    startAt: now + regDuration,
    endAt: now + regDuration + playDuration,
    currentPlayers: 0,
    participants: [],
    bracket: [],
    results: [],
  };

  seedSampleBots(comp, randomFn);
  return comp;
}

// ============================================================================
// register
// ============================================================================

export interface RegisterInput {
  userCode: string;
  petName?: string;
  userCoins?: number;
  now?: number;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  feeDeducted?: number;
  participant?: Participant;
}

export function register(
  comp: Competition,
  input: RegisterInput
): RegisterResult {
  const { userCode, petName = 'Bé Thú Cưng', userCoins = 0, now = Date.now() } = input;

  if (comp.status !== COMPETITION_STATUS.REGISTRATION && comp.status !== COMPETITION_STATUS.UPCOMING) {
    return { success: false, message: 'Thời gian đăng ký giải đấu đã kết thúc!' };
  }
  if (comp.currentPlayers >= comp.maxPlayers) {
    return { success: false, message: 'Giải đấu đã đủ số lượng người đăng ký tối đa!' };
  }
  if (comp.participants.some((p) => p.userCode === userCode)) {
    return { success: false, message: 'Bạn đã đăng ký tham gia giải đấu này rồi!' };
  }

  const fee = Number(comp.entryFee) || 0;
  if (fee > 0 && userCoins < fee) {
    return {
      success: false,
      message: `Không đủ xu! Phí tham gia là ${fee} xu (Hiện có: ${userCoins} xu).`,
    };
  }

  const participant: Participant = {
    userCode,
    petName,
    avatar: '🐾',
    isBot: false,
    registeredAt: now,
    highestScore: 0,
    totalScore: 0,
    submissionCount: 0,
  };

  comp.participants.push(participant);
  comp.currentPlayers += 1;

  return {
    success: true,
    message: `Đăng ký thành công giải đấu "${comp.name}"!`,
    feeDeducted: fee,
    participant,
  };
}

// ============================================================================
// submitScore
// ============================================================================

export interface SubmitScoreInput {
  userCode: string;
  score: number;
  petName?: string;
  now?: number;
}

export interface SubmitScoreResult {
  success: boolean;
  message?: string;
  highestScore?: number;
}

export function submitScore(
  comp: Competition,
  input: SubmitScoreInput
): SubmitScoreResult {
  const { userCode, score, petName = 'Bé Thú Cưng', now = Date.now() } = input;

  if (comp.status !== COMPETITION_STATUS.IN_PROGRESS) {
    return { success: false, message: 'Giải đấu chưa bắt đầu hoặc đã kết thúc!' };
  }
  if (now > comp.endAt) {
    return { success: false, message: 'Giải đấu đã kết thúc!' };
  }

  const numScore = Math.max(0, Number(score) || 0);
  let participant = comp.participants.find((p) => p.userCode === userCode);

  if (!participant) {
    // Auto-register during in_progress nếu còn chỗ
    if (comp.currentPlayers < comp.maxPlayers) {
      participant = {
        userCode,
        petName,
        avatar: '🐾',
        isBot: false,
        registeredAt: now,
        highestScore: numScore,
        totalScore: numScore,
        submissionCount: 1,
      };
      comp.participants.push(participant);
      comp.currentPlayers += 1;
    } else {
      return { success: false, message: 'Bạn chưa đăng ký tham gia giải đấu này' };
    }
  } else {
    if (numScore > participant.highestScore) {
      participant.highestScore = numScore;
    }
    participant.totalScore = (participant.totalScore || 0) + numScore;
    participant.submissionCount = (participant.submissionCount || 0) + 1;
  }

  return {
    success: true,
    highestScore: participant.highestScore,
  };
}

// ============================================================================
// Bracket generation
// ============================================================================

const BRACKET_ROUND_NAMES_16 = ['Vòng 1/8', 'Tứ Kết', 'Bán Kết', 'Chung Kết 🏆'];
const BRACKET_ROUND_NAMES_8 = ['Tứ Kết', 'Bán Kết', 'Chung Kết 🏆'];
const BRACKET_ROUND_NAMES_4 = ['Bán Kết', 'Chung Kết 🏆'];

export function generateBracket(
  participants: Participant[],
  bracketSize: number = DEFAULT_BRACKET_SIZE
): BracketRound[] {
  const size = bracketSize || DEFAULT_BRACKET_SIZE;
  const rounds = Math.max(1, Math.ceil(Math.log2(size)));
  const bracket: BracketRound[] = [];

  const players = [...participants];
  while (players.length < size) {
    players.push({
      userCode: `bot_bye_${players.length}`,
      petName: 'Thí sinh dự bị',
      avatar: '🤖',
      isBot: true,
      registeredAt: Date.now(),
      highestScore: 200 + players.length * 50,
      totalScore: 0,
      submissionCount: 0,
    });
  }

  // Round 1
  const round1Matches: BracketMatch[] = [];
  for (let i = 0; i < size; i += 2) {
    const p1 = players[i] ?? null;
    const p2 = players[i + 1] ?? null;
    const s1 = p1 ? p1.highestScore || 0 : 0;
    const s2 = p2 ? p2.highestScore || 0 : 0;
    const winner: Participant | null =
      !p1 ? p2 : !p2 ? p1 : s1 >= s2 ? p1 : p2;
    round1Matches.push({
      matchId: `r1_m${i / 2}`,
      player1: p1,
      player2: p2,
      score1: s1,
      score2: s2,
      winner,
      status: 'completed',
    });
  }
  const round1Name = size === 16 ? BRACKET_ROUND_NAMES_16[0] : size === 8 ? BRACKET_ROUND_NAMES_8[0] : BRACKET_ROUND_NAMES_4[0];
  bracket.push({ round: 1, name: round1Name, matches: round1Matches });

  // Round 2
  const round2Matches: BracketMatch[] = [];
  const numR2 = round1Matches.length / 2;
  for (let i = 0; i < numR2; i++) {
    const p1 = round1Matches[i * 2]?.winner ?? null;
    const p2 = round1Matches[i * 2 + 1]?.winner ?? null;
    const s1 = p1 ? p1.highestScore || 0 : 0;
    const s2 = p2 ? p2.highestScore || 0 : 0;
    const winner: Participant | null =
      !p1 ? p2 : !p2 ? p1 : s1 >= s2 ? p1 : p2;
    round2Matches.push({
      matchId: `r2_m${i}`,
      player1: p1,
      player2: p2,
      score1: s1,
      score2: s2,
      winner,
      status: 'completed',
    });
  }
  const round2Name =
    size === 16 ? BRACKET_ROUND_NAMES_16[1] : size === 8 ? BRACKET_ROUND_NAMES_8[1] : BRACKET_ROUND_NAMES_4[1];
  bracket.push({ round: 2, name: round2Name, matches: round2Matches });

  if (rounds >= 3) {
    // Round 3 (semi-final or final)
    const round3Matches: BracketMatch[] = [];
    const numR3 = Math.max(1, round2Matches.length / 2);
    for (let i = 0; i < numR3; i++) {
      const p1 = round2Matches[i * 2]?.winner ?? null;
      const p2 = round2Matches[i * 2 + 1]?.winner ?? null;
      const s1 = p1 ? p1.highestScore || 0 : 0;
      const s2 = p2 ? p2.highestScore || 0 : 0;
      const winner: Participant | null =
        !p1 ? p2 : !p2 ? p1 : s1 >= s2 ? p1 : p2;
      round3Matches.push({
        matchId: `r3_m${i}`,
        player1: p1,
        player2: p2,
        score1: s1,
        score2: s2,
        winner,
        status: 'completed',
      });
    }
    const round3Name = size === 16 ? BRACKET_ROUND_NAMES_16[2] : size === 8 ? BRACKET_ROUND_NAMES_8[2] : BRACKET_ROUND_NAMES_4[1];
    bracket.push({ round: 3, name: round3Name, matches: round3Matches });

    if (rounds >= 4 && size === 16) {
      // Round 4 (final)
      const finalP1 = round3Matches[0]?.winner ?? null;
      const finalP2 = round3Matches[1]?.winner ?? null;
      const f1 = finalP1 ? finalP1.highestScore || 0 : 0;
      const f2 = finalP2 ? finalP2.highestScore || 0 : 0;
      const champion: Participant | null =
        !finalP1 ? finalP2 : !finalP2 ? finalP1 : f1 >= f2 ? finalP1 : finalP2;
      bracket.push({
        round: 4,
        name: BRACKET_ROUND_NAMES_16[3],
        matches: [
          {
            matchId: 'r4_final',
            player1: finalP1,
            player2: finalP2,
            score1: f1,
            score2: f2,
            winner: champion,
            status: 'completed',
          },
        ],
      });
    }
  }
  return bracket;
}

// ============================================================================
// Auto-rotation
// ============================================================================

export function autoGenerateCompetitions(
  state: CompetitionsState,
  now: number = Date.now()
): CompetitionsState {
  const next: CompetitionsState = {
    ...state,
    active: [...state.active],
  };
  const want = ['daily_catch', 'timing_rush', 'tricks_show'];
  for (const tid of want) {
    const exists = next.active.some(
      (c) => c.templateId === tid && c.status !== COMPETITION_STATUS.COMPLETED
    );
    if (!exists) {
      next.active.push(createCompetition(tid, now));
    }
  }
  return next;
}

// ============================================================================
// Status transitions
// ============================================================================

export interface TransitionResult {
  state: CompetitionsState;
  events: { type: 'started' | 'ended' | 'completed'; comp: Competition; results?: CompetitionResult[] }[];
}

export function checkStatusTransitions(
  state: CompetitionsState,
  now: number = Date.now()
): TransitionResult {
  const events: TransitionResult['events'] = [];
  const nextActive: Competition[] = [];
  const nextHistory = [...state.history];

  for (const comp of state.active) {
    const updated: Competition = { ...comp };

    if (
      updated.status === COMPETITION_STATUS.REGISTRATION &&
      now >= updated.startAt
    ) {
      updated.status = COMPETITION_STATUS.IN_PROGRESS;
      if (
        updated.type === COMPETITION_TYPES.BRACKET &&
        (!updated.bracket || updated.bracket.length === 0)
      ) {
        updated.bracket = generateBracket(updated.participants, updated.bracketSize || DEFAULT_BRACKET_SIZE);
      }
      events.push({ type: 'started', comp: updated });
    }

    if (updated.status === COMPETITION_STATUS.IN_PROGRESS && now >= updated.endAt) {
      updated.status = COMPETITION_STATUS.COMPLETED;
      updated.completedAt = now;

      if (
        updated.type === COMPETITION_TYPES.BRACKET &&
        (!updated.bracket || updated.bracket.length === 0)
      ) {
        updated.bracket = generateBracket(updated.participants, updated.bracketSize || DEFAULT_BRACKET_SIZE);
      }

      const sorted = [...updated.participants].sort(
        (a, b) => (b.highestScore || 0) - (a.highestScore || 0)
      );
      const results: CompetitionResult[] = sorted.map((p, idx) => {
        const rank = idx + 1;
        const prize = getPrizeForRank(updated.prizePool, rank);
        return {
          rank,
          userCode: p.userCode,
          petName: p.petName,
          isBot: !!p.isBot,
          score: p.highestScore || 0,
          prize,
        };
      });
      updated.results = results;
      nextHistory.unshift(updated);
      if (nextHistory.length > HISTORY_LIMIT) nextHistory.length = HISTORY_LIMIT;
      events.push({ type: 'ended', comp: updated, results });
      continue;
    }

    nextActive.push(updated);
  }

  return {
    state: { ...state, active: nextActive, history: nextHistory },
    events,
  };
}

// ============================================================================
// endCompetition (manual)
// ============================================================================

export interface EndCompetitionResult {
  state: CompetitionsState;
  results: CompetitionResult[];
  comp: Competition;
  userPrize?: PrizeRewards;
}

export function endCompetition(
  state: CompetitionsState,
  instanceId: string,
  now: number = Date.now()
): EndCompetitionResult | null {
  const idx = state.active.findIndex((c) => c.instanceId === instanceId);
  if (idx === -1) return null;
  const comp = { ...state.active[idx] };
  comp.status = COMPETITION_STATUS.COMPLETED;
  comp.completedAt = now;

  if ((!comp.bracket || comp.bracket.length === 0) && comp.type === COMPETITION_TYPES.BRACKET) {
    comp.bracket = generateBracket(comp.participants, comp.bracketSize || DEFAULT_BRACKET_SIZE);
  }

  const sorted = [...comp.participants].sort((a, b) => (b.highestScore || 0) - (a.highestScore || 0));
  const results: CompetitionResult[] = sorted.map((p, i) => {
    const rank = i + 1;
    const prize = getPrizeForRank(comp.prizePool, rank);
    return {
      rank,
      userCode: p.userCode,
      petName: p.petName,
      isBot: !!p.isBot,
      score: p.highestScore || 0,
      prize,
    };
  });
  comp.results = results;

  const updatedStats: UserCompetitionStats = { ...state.userStats };
  let userPrize: PrizeRewards | undefined;
  for (const r of results) {
    if (r.isBot) continue;
    updatedStats.played += 1;
    if (r.rank === 1) updatedStats.wins += 1;
    if (r.rank <= 3) updatedStats.podiums += 1;
    if (r.prize?.coins) updatedStats.totalCoinsEarned += r.prize.coins;
    if (r.prize?.items?.length) {
      updatedStats.trophies.push({
        name: r.prize.items[0].name,
        rank: r.rank,
        compName: comp.name,
        date: now,
      });
      userPrize = r.prize;
    }
  }

  const nextHistory = [comp, ...state.history];
  if (nextHistory.length > HISTORY_LIMIT) nextHistory.length = HISTORY_LIMIT;

  const nextActive = state.active.filter((_, i) => i !== idx);

  return {
    state: {
      active: nextActive,
      history: nextHistory,
      userStats: updatedStats,
    },
    results,
    comp,
    userPrize,
  };
}

// ============================================================================
// Prize helpers
// ============================================================================

export function getPrizeForRank(prizePool: PrizeTier[], rank: number): PrizeRewards | null {
  if (!prizePool || !Array.isArray(prizePool)) return null;
  for (const entry of prizePool) {
    if (entry.rank === rank) return entry.rewards;
    if (typeof entry.rank === 'string') {
      if (entry.rank.includes('-')) {
        const [min, max] = entry.rank.split('-').map(Number);
        if (Number.isFinite(min) && Number.isFinite(max) && rank >= min && rank <= max) {
          return entry.rewards;
        }
      } else if (entry.rank.endsWith('+')) {
        const min = Number(entry.rank.replace('+', ''));
        if (Number.isFinite(min) && rank >= min) return entry.rewards;
      }
    }
  }
  return null;
}

export function prizeRewardsTotal(prize: PrizeRewards | null | undefined): { coins: number; xp: number; items: number } {
  if (!prize) return { coins: 0, xp: 0, items: 0 };
  const items = prize.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) ?? 0;
  return {
    coins: prize.coins ?? 0,
    xp: prize.xp ?? 0,
    items,
  };
}

// ============================================================================
// Loaders
// ============================================================================

export function getActiveCompetitions(state: CompetitionsState): Competition[] {
  return state.active.filter((c) => c.status !== COMPETITION_STATUS.COMPLETED);
}

export function getRegistrationCompetitions(state: CompetitionsState): Competition[] {
  return state.active.filter((c) => c.status === COMPETITION_STATUS.REGISTRATION);
}

export function getLiveCompetitions(state: CompetitionsState): Competition[] {
  return state.active.filter((c) => c.status === COMPETITION_STATUS.IN_PROGRESS);
}

export function getUpcomingCompetitions(state: CompetitionsState): Competition[] {
  return state.active.filter((c) => c.status === COMPETITION_STATUS.UPCOMING);
}

export function findCompetitionById(state: CompetitionsState, instanceId: string): Competition | null {
  return state.active.find((c) => c.instanceId === instanceId) ?? state.history.find((c) => c.instanceId === instanceId) ?? null;
}

// ============================================================================
// Leaderboard
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  userCode: string;
  petName: string;
  avatar: string;
  isBot: boolean;
  highestScore: number;
  totalScore: number;
  submissionCount: number;
  isYou: boolean;
}

export function getLeaderboard(
  comp: Competition,
  userCode: string,
  limit: number = LEADERBOARD_LIMIT
): LeaderboardEntry[] {
  const sorted = [...comp.participants].sort(
    (a, b) => (b.highestScore || 0) - (a.highestScore || 0)
  );
  return sorted.slice(0, limit).map((p, idx) => ({
    rank: idx + 1,
    userCode: p.userCode,
    petName: p.petName,
    avatar: p.avatar,
    isBot: !!p.isBot,
    highestScore: p.highestScore || 0,
    totalScore: p.totalScore || 0,
    submissionCount: p.submissionCount || 0,
    isYou: p.userCode === userCode,
  }));
}

// ============================================================================
// Time helpers
// ============================================================================

export function getTimeRemaining(target: number, now: number = Date.now()): number {
  return Math.max(0, target - now);
}

export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}h`;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function formatScore(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ============================================================================
// Quick play (auto-submit seed score)
// ============================================================================

export interface QuickPlayResult {
  score: number;
  highestScore: number;
  success: boolean;
  message?: string;
}

export function quickPlay(
  comp: Competition,
  userCode: string,
  petName: string,
  randomFn: () => number = Math.random,
  baseScore: number = 200
): QuickPlayResult {
  const score = baseScore + Math.floor(randomFn() * 600);
  const result = submitScore(comp, { userCode, score, petName });
  return {
    score,
    highestScore: result.highestScore ?? 0,
    success: result.success,
    message: result.message,
  };
}
