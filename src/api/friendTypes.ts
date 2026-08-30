/**
 * Friend Domain Types
 *
 * Friend list, friend requests, presence, and suggestions.
 */

export type FriendStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

/** Online presence level */
export type PresenceStatus = 'online' | 'away' | 'offline';

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