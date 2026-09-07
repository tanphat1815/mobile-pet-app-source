/**
 * Friend Domain Types
 *
 * Friend list, friend requests, presence, and suggestions.
 *
 * Step 4 mở rộng Friend với:
 *   - tags: FriendTag[] cho quick categorization
 *   - giftsReceived: tổng quà đã nhận (counter)
 *   - lastActivity: timestamp event gần nhất
 */

export type FriendStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

/** Online presence level */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * Step 4 — Tags phân loại friend.
 * Port từ desktop `advanced-friend-manager.js` PRESET_TAGS.
 */
export type FriendTag =
  | 'best_friend'
  | 'family'
  | 'rival'
  | 'study_buddy'
  | 'gaming'
  | 'workout';

export interface FriendTagMeta {
  id: FriendTag;
  label: string;
  icon: string;
  /** Tint cho chip background */
  tint: string;
  /** Tint cho chip text */
  textColor: string;
}

export const FRIEND_TAGS: FriendTagMeta[] = [
  { id: 'best_friend',  label: 'Best Friend',  icon: '⭐', tint: '#FFE9A8', textColor: '#8A5A00' },
  { id: 'family',       label: 'Family',       icon: '👨‍👩‍👧', tint: '#FFD1DC', textColor: '#8B2D5A' },
  { id: 'rival',        label: 'Rival',        icon: '⚔️', tint: '#FFC1C1', textColor: '#7A1F1F' },
  { id: 'study_buddy',  label: 'Study Buddy',  icon: '📚', tint: '#D6E4FF', textColor: '#1E3A8A' },
  { id: 'gaming',       label: 'Gaming',       icon: '🎮', tint: '#E2D6FF', textColor: '#4C1D95' },
  { id: 'workout',      label: 'Workout',      icon: '💪', tint: '#D1F0D8', textColor: '#14532D' },
];

/** Lookup by id */
export function getFriendTagMeta(id: FriendTag): FriendTagMeta | undefined {
  return FRIEND_TAGS.find((t) => t.id === id);
}

/** A single friend (already-accepted relationship). */
export interface Friend {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  /** Pet-level summary for quick display in the friend list */
  petLevel?: number;
  petSpecies?: string;
  /** Online presence */
  presence: PresenceStatus;
  /** Timestamp of last activity (ms). Useful for "Last seen 5m ago". */
  lastSeen?: number;
  /** When the friendship was accepted */
  friendsSince: number;
  /** Optional status message / mood */
  statusMessage?: string;
  /** Step 4 — tags user-assigned */
  tags?: FriendTag[];
  /** Step 4 — counter tổng gift đã nhận */
  giftsReceived?: number;
  /** Step 4 — last activity event timestamp */
  lastActivity?: number;
}

/**
 * Step 4 — Gift types + record.
 * Port từ desktop `friend-gift-manager.js` GiftType.
 */
export type FriendGiftType =
  | 'rose'
  | 'cake'
  | 'gem'
  | 'energy_drink'
  | 'book'
  | 'cookie';

export interface FriendGiftTypeMeta {
  id: FriendGiftType;
  label: string;
  icon: string;
  /** Cost in coins */
  price: number;
  /** Brief tagline */
  description: string;
  /** Tint color */
  tint: string;
}

export const FRIEND_GIFT_TYPES: FriendGiftTypeMeta[] = [
  { id: 'rose',          label: 'Hoa Hồng',    icon: '🌹', price: 50,  description: 'Tình bạn thắm thiết', tint: '#FFB6C1' },
  { id: 'cake',          label: 'Bánh Kem',    icon: '🍰', price: 100, description: 'Ăn mừng cột mốc',    tint: '#FFE9A8' },
  { id: 'gem',           label: 'Đá Quý',      icon: '💎', price: 500, description: 'Quà cao cấp',         tint: '#C2E0FF' },
  { id: 'energy_drink',  label: 'Nước Tăng Lực', icon: '🥤', price: 30,  description: 'Tiếp năng lượng',     tint: '#D1F0D8' },
  { id: 'book',          label: 'Sách',        icon: '📚', price: 80,  description: 'Chia sẻ kiến thức',   tint: '#E5D1FF' },
  { id: 'cookie',        label: 'Bánh Quy',    icon: '🍪', price: 20,  description: 'Quà vặt hàng ngày',   tint: '#FFE4C4' },
];

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__FRIEND_TAGS_COUNT__ = FRIEND_TAGS.length;
  (globalThis as any).__FRIEND_GIFT_TYPES__ = FRIEND_GIFT_TYPES;
  (globalThis as any).__ACTIVITY_KINDS__ = [
    'level_up', 'achievement', 'new_pet', 'quest_complete',
    'gift_sent', 'gift_received', 'tag_added', 'friend_joined',
  ];
  if (typeof window !== 'undefined') {
    (window as any).__FRIEND_TAGS_COUNT__ = FRIEND_TAGS.length;
    (window as any).__FRIEND_GIFT_TYPES__ = FRIEND_GIFT_TYPES;
    (window as any).__ACTIVITY_KINDS__ = (globalThis as any).__ACTIVITY_KINDS__;
  }
}

export function getGiftTypeMeta(id: FriendGiftType): FriendGiftTypeMeta | undefined {
  return FRIEND_GIFT_TYPES.find((g) => g.id === id);
}

export interface FriendGift {
  id: string;
  fromUserId: string;
  fromDisplayName?: string;
  toUserId: string;
  toDisplayName?: string;
  giftType: FriendGiftType;
  quantity: number;
  message?: string;
  sentAt: number;
  acknowledged: boolean;
}

/**
 * Step 4 — Activity feed event.
 */
export type FriendActivityKind =
  | 'level_up'
  | 'achievement'
  | 'new_pet'
  | 'quest_complete'
  | 'gift_sent'
  | 'gift_received'
  | 'tag_added'
  | 'friend_joined';

export interface FriendActivity {
  id: string;
  userId: string;
  userDisplayName?: string;
  userPetSpecies?: string;
  kind: FriendActivityKind;
  /** Per-kind payload (e.g. { level: 12 } for level_up, { giftType: 'rose' } for gift_sent) */
  payload?: Record<string, unknown>;
  createdAt: number;
}

/** An incoming or outgoing friend request. */
export interface FriendRequest {
  id: string;
  /** The other party */
  fromUserId: string;
  fromDisplayName?: string;
  fromAvatarUrl?: string;
  /** Direction relative to the current user */
  direction: 'incoming' | 'outgoing';
  ts: number;
  /** Optional message accompanying the request */
  message?: string;
}

/** Friend suggestion (people the user may know). */
export interface FriendSuggestion {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  /** Number of mutual friends */
  mutualFriends: number;
  /** Optional headline (e.g. "Plays Mochi") */
  reason?: string;
}

export interface FriendRequestDecisionInput {
  requestId: string;
  decision: 'accept' | 'decline';
}

export interface SendFriendRequestInput {
  userId: string;
  message?: string;
}

export interface RemoveFriendInput {
  userId: string;
}

// ============================================================================
// Helpers
// ============================================================================

/** Sort helper: online first, then away, then offline; alphabetical within. */
export function byPresenceThenName(a: Friend, b: Friend): number {
  const order: Record<PresenceStatus, number> = { online: 0, away: 1, offline: 2 };
  const diff = order[a.presence] - order[b.presence];
  if (diff !== 0) return diff;
  return a.displayName.localeCompare(b.displayName);
}

/** Sort requests: incoming first, then by ts desc */
export function byRequestOrder(a: FriendRequest, b: FriendRequest): number {
  if (a.direction !== b.direction) {
    return a.direction === 'incoming' ? -1 : 1;
  }
  return b.ts - a.ts;
}

/** Last-seen relative formatter. */
export function formatLastSeen(ts: number | undefined, now = Date.now()): string {
  if (!ts) return 'offline';
  const diff = now - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const date = new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}