/**
 * searchIndex.ts
 *
 * Step 14 — Global Quick Switcher search engine.
 *
 * Wraps Fuse.js with our app-specific SearchableItem schema. Indexes are
 * built lazily from in-memory store snapshots (no AsyncStorage cost on
 * hot path). Items are categorized by `kind` so the UI can group results
 * and render appropriate icons.
 *
 * Performance budget:
 *   - Build index from 200 items: < 50ms
 *   - Query 200 items: < 30ms
 *
 * The module is pure (no React imports) so it can be unit-tested in
 * isolation and consumed by both the QuickSwitcher modal and any
 * future inline search widgets.
 */

import Fuse, { type IFuseOptions } from 'fuse.js';
import type { MainStackParamList } from '../navigation/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchableKind =
  | 'screen'
  | 'friend'
  | 'chat'
  | 'quest'
  | 'achievement'
  | 'setting'
  | 'action';

export interface SearchableItem {
  /** Unique id (route name, friend id, etc.) */
  id: string;
  kind: SearchableKind;
  /** Primary label shown in UI */
  title: string;
  /** Secondary line (description, subtitle, pet name, etc.) */
  subtitle?: string;
  /** Optional emoji icon (matches existing row emoji pattern) */
  icon?: string;
  /** Tokens for Fuse.js search (lowercased, includes aliases) */
  keywords: string[];
  /** Route name to navigate (undefined for non-screen items) */
  route?: keyof MainStackParamList;
  /** Optional navigation params */
  params?: Record<string, unknown>;
  /** Score weight (higher = match earlier) */
  weight?: number;
}

export interface SearchResult extends SearchableItem {
  /** Fuse.js score (0 = perfect, 1 = no match) */
  score: number;
  /** Optional matched indices for highlighting */
  matches?: readonly (readonly [number, number])[];
}

// ---------------------------------------------------------------------------
// Screen alias map — covers 26 routes from MainStackParamList
// ---------------------------------------------------------------------------

export const SCREEN_ALIASES: Record<keyof MainStackParamList, string[]> = {
  Home: ['home', 'main', 'pet', 'trang chu', 'dashboard'],
  ChatList: ['chat', 'messages', 'tin nhan', 'conversation', 'inbox'],
  ChatThread: ['chat thread', 'tin nhan voi', 'conversation with'],
  Friends: ['friends', 'ban be', 'buddies', 'pal'],
  Pairing: ['pair', 'pairing', 'ket noi', '6 digit', 'invite code'],
  Achievements: ['achievements', 'thanh tuu', 'trophy', 'badge', 'ribbon'],
  Quests: ['quests', 'nhiem vu', 'mission', 'task', 'goal'],
  Settings: ['settings', 'cai dat', 'preferences', 'config', 'options'],
  Profile: ['profile', 'ho so', 'avatar', 'account'],
  WellnessHome: ['wellness', 'suc khoe', 'health', 'mindful'],
  Meditation: ['meditation', 'thien', 'mindfulness', 'sit'],
  Breathing: ['breathing', 'ho hap', 'breath', 'inhale'],
  Pomodoro: ['pomodoro', 'focus', 'timer', 'dem nguoc', '25 minutes'],
  Ambient: ['ambient', 'sound', 'am thanh', 'white noise', 'rain'],
  Gratitude: ['gratitude', 'biet on', 'journal', 'thankful'],
  Mood: ['mood', 'tinh than', 'cam xuc', 'feelings'],
  MusicHome: ['music', 'nhac', 'song', 'playlist', 'pet radio', 'radio'],
  AdventureHome: ['adventure', 'phieu luu', 'explore', 'journey'],
  AIChat: ['ai', 'chatbot', 'ai chat', 'tro ly', 'assistant'],
  AISettings: ['ai settings', 'ai key', 'byok', 'api key', 'openai'],
  TricksHome: ['tricks', 'training', 'huan luyen', 'dog tricks', 'skills'],
  CompetitionsHome: [
    'competitions',
    'tournament',
    'giai dau',
    'cup',
    'leaderboard',
  ],
  MiniGamesHome: ['mini games', 'game', 'choi game', 'arcade'],
  CatchFall: ['catch fall', 'catch', 'roi do', 'falling'],
  TimingGame: ['timing', 'pham vi', 'tap timing', 'rhythm'],
  Admin: ['admin', 'diagnostics', 'debug', 'dev', 'admin dashboard', 'tools'],
};

// ---------------------------------------------------------------------------
// Fuse.js configuration
// ---------------------------------------------------------------------------

const FUSE_OPTIONS: IFuseOptions<SearchableItem> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'subtitle', weight: 0.2 },
    { name: 'keywords', weight: 0.3 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  distance: 100,
  minMatchCharLength: 1,
  ignoreLocation: true,
};

// ---------------------------------------------------------------------------
// Index builders per source
// ---------------------------------------------------------------------------

const SCREEN_WEIGHT = 100;

function buildScreenItems(): SearchableItem[] {
  return (Object.entries(SCREEN_ALIASES) as Array<
    [keyof MainStackParamList, string[]]
  >).map(([route, aliases]) => ({
    id: route,
    kind: 'screen',
    title: route
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (c) => c.toUpperCase()),
    subtitle: aliases.slice(0, 3).join(' · '),
    icon: iconForScreen(route),
    keywords: aliases.map((a) => a.toLowerCase()),
    route,
    weight: SCREEN_WEIGHT,
  }));
}

function iconForScreen(route: keyof MainStackParamList): string {
  const map: Record<keyof MainStackParamList, string> = {
    Home: '🏠',
    ChatList: '💬',
    ChatThread: '💬',
    Friends: '🐾',
    Pairing: '🔗',
    Achievements: '🏆',
    Quests: '📜',
    Settings: '⚙️',
    Profile: '👤',
    WellnessHome: '🧘',
    Meditation: '🧘',
    Breathing: '🌬️',
    Pomodoro: '⏱️',
    Ambient: '🎧',
    Gratitude: '🙏',
    Mood: '😊',
    MusicHome: '🎵',
    AdventureHome: '🗺️',
    AIChat: '🤖',
    AISettings: '🤖',
    TricksHome: '🎪',
    CompetitionsHome: '🏅',
    MiniGamesHome: '🎮',
    CatchFall: '🎮',
    TimingGame: '🎮',
    Admin: '🛠️',
  };
  return map[route] ?? '📄';
}

// ---------------------------------------------------------------------------
// Entity indexers — pulled lazily from Zustand stores
// ---------------------------------------------------------------------------

export interface FriendSnapshot {
  id: string;
  name: string;
  friendCode?: string;
  petName?: string;
}

export interface ChatThreadSnapshot {
  id: string;
  peerName: string;
  lastMessage?: string;
}

export interface QuestSnapshot {
  id: string;
  title: string;
  description?: string;
  status?: string;
}

export interface AchievementSnapshot {
  id: string;
  title: string;
  description?: string;
}

export function buildFriendItems(friends: FriendSnapshot[]): SearchableItem[] {
  return friends.map((f) => ({
    id: `friend:${f.id}`,
    kind: 'friend',
    title: f.name,
    subtitle: f.petName
      ? `${f.petName} · ${f.friendCode ?? ''}`
      : f.friendCode,
    icon: '🐾',
    keywords: [f.name.toLowerCase(), f.friendCode?.toLowerCase() ?? '', f.petName?.toLowerCase() ?? ''].filter(Boolean),
    route: 'ChatThread',
    params: { conversationId: f.id },
    weight: 80,
  }));
}

export function buildChatItems(threads: ChatThreadSnapshot[]): SearchableItem[] {
  return threads.slice(0, 50).map((t) => ({
    id: `chat:${t.id}`,
    kind: 'chat',
    title: t.peerName,
    subtitle: t.lastMessage?.slice(0, 60),
    icon: '💬',
    keywords: [t.peerName.toLowerCase(), t.lastMessage?.toLowerCase() ?? ''].filter(Boolean),
    route: 'ChatThread',
    params: { conversationId: t.id },
    weight: 70,
  }));
}

export function buildQuestItems(quests: QuestSnapshot[]): SearchableItem[] {
  return quests.map((q) => ({
    id: `quest:${q.id}`,
    kind: 'quest',
    title: q.title,
    subtitle: q.description?.slice(0, 80) ?? q.status,
    icon: '📜',
    keywords: [q.title.toLowerCase(), q.description?.toLowerCase() ?? ''].filter(Boolean),
    route: 'Quests',
    weight: 60,
  }));
}

export function buildAchievementItems(
  achievements: AchievementSnapshot[],
): SearchableItem[] {
  return achievements.map((a) => ({
    id: `ach:${a.id}`,
    kind: 'achievement',
    title: a.title,
    subtitle: a.description?.slice(0, 80),
    icon: '🏆',
    keywords: [a.title.toLowerCase(), a.description?.toLowerCase() ?? ''].filter(Boolean),
    route: 'Achievements',
    weight: 60,
  }));
}

// ---------------------------------------------------------------------------
// QuickSwitcherIndex — incremental build + cached Fuse instance
// ---------------------------------------------------------------------------

export class QuickSwitcherIndex {
  private items: SearchableItem[] = [];
  private fuse: Fuse<SearchableItem> | null = null;

  /** Seed with screen items (always present, builds once at app boot). */
  seedScreens(): void {
    this.items = buildScreenItems();
    this.rebuild();
  }

  /** Replace entity buckets (friends/chats/quests/achievements). */
  setEntities(buckets: {
    friends?: FriendSnapshot[];
    chats?: ChatThreadSnapshot[];
    quests?: QuestSnapshot[];
    achievements?: AchievementSnapshot[];
  }): void {
    // Keep screen items, swap entity items
    const screens = this.items.filter((i) => i.kind === 'screen');
    const entities: SearchableItem[] = [
      ...(buckets.friends ? buildFriendItems(buckets.friends) : []),
      ...(buckets.chats ? buildChatItems(buckets.chats) : []),
      ...(buckets.quests ? buildQuestItems(buckets.quests) : []),
      ...(buckets.achievements ? buildAchievementItems(buckets.achievements) : []),
    ];
    this.items = [...screens, ...entities];
    this.rebuild();
  }

  private rebuild(): void {
    this.fuse = new Fuse(this.items, FUSE_OPTIONS);
  }

  /**
   * Query the index. Empty / whitespace query returns the full list
   * (the UI filters that down to pinned + recents separately).
   */
  query(rawQuery: string, limit = 20): SearchResult[] {
    const q = rawQuery.trim();
    if (!q) {
      return this.items
        .slice()
        .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
        .slice(0, limit)
        .map((item) => ({ ...item, score: 0 }));
    }
    if (!this.fuse) return [];
    return this.fuse
      .search(q, { limit })
      .map((r) => ({
        ...r.item,
        score: r.score ?? 1,
        matches: r.matches?.flatMap((m) => m.indices as readonly [number, number][]),
      }));
  }

  /** Lookup by id (used to resolve pinned/recents → full item). */
  byId(id: string): SearchableItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  /** All items (for debugging / tests). */
  all(): readonly SearchableItem[] {
    return this.items;
  }

  size(): number {
    return this.items.length;
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor (one index per app session)
// ---------------------------------------------------------------------------

let singleton: QuickSwitcherIndex | null = null;

export function getSearchIndex(): QuickSwitcherIndex {
  if (!singleton) {
    singleton = new QuickSwitcherIndex();
    singleton.seedScreens();
  }
  return singleton;
}

/** Reset singleton (used in tests). */
export function __resetSearchIndexForTests(): void {
  singleton = null;
}

/** Convenience helper for tests + one-off queries. */
export function search(query: string, limit = 20): SearchResult[] {
  return getSearchIndex().query(query, limit);
}
