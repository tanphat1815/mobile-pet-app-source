/**
 * Friend API
 *
 * REST endpoints for friends + friend requests + suggestions, with a
 * local mock state so the friend list UI is fully testable without a
 * real backend.
 *
 * Endpoints (target):
 *   GET  /friends                  -> Friend[]
 *   GET  /friends/requests         -> FriendRequest[]
 *   GET  /friends/suggestions      -> FriendSuggestion[]
 *   POST /friends/requests         -> FriendRequest      { userId, message? }
 *   POST /friends/requests/decide  -> { ok: true }        { requestId, decision }
 *   DELETE /friends/:userId        -> { ok: true }
 *   GET  /friends/search?q=...     -> FriendSuggestion[]
 */

import apiClient from './client';
import { getApiError } from './client';
import {
  Friend,
  FriendActivity,
  FriendGift,
  FriendRequest,
  FriendSuggestion,
  FriendTag,
  FriendGiftType,
} from './friendTypes';

// ============================================================================
// Mock state
// ============================================================================

function makeMockFriends(): Friend[] {
  const now = Date.now();
  const m = (n: number) => now - n * 60 * 1000;
  const h = (n: number) => now - n * 60 * 60 * 1000;
  return [
    {
      userId: 'u_alice',
      displayName: 'Alice',
      petLevel: 12,
      petSpecies: 'cat',
      presence: 'online',
      lastSeen: m(2),
      friendsSince: h(48),
      statusMessage: 'Walking Mochi',
      tags: ['best_friend'],
      giftsReceived: 5,
      lastActivity: m(15),
    },
    {
      userId: 'u_carol',
      displayName: 'Carol',
      petLevel: 9,
      petSpecies: 'dragon',
      presence: 'online',
      lastSeen: m(5),
      friendsSince: h(72),
      tags: ['gaming', 'study_buddy'],
      giftsReceived: 2,
    },
    {
      userId: 'u_dave',
      displayName: 'Dave',
      petLevel: 4,
      petSpecies: 'dog',
      presence: 'away',
      lastSeen: m(20),
      friendsSince: h(24),
      tags: ['workout'],
    },
    {
      userId: 'u_bob',
      displayName: 'Bob',
      petLevel: 7,
      petSpecies: 'fox',
      presence: 'offline',
      lastSeen: h(2),
      friendsSince: h(120),
      tags: ['rival'],
    },
    {
      userId: 'u_emma',
      displayName: 'Emma',
      petLevel: 3,
      petSpecies: 'hamster',
      presence: 'offline',
      lastSeen: h(48),
      friendsSince: h(8),
      tags: ['family'],
    },
  ];
}

function makeMockRequests(): FriendRequest[] {
  const now = Date.now();
  const m = (n: number) => now - n * 60 * 1000;
  return [
    {
      id: 'req_1',
      fromUserId: 'u_frank',
      fromDisplayName: 'Frank',
      direction: 'incoming',
      ts: m(10),
      message: 'Hey, saw you in the leaderboard!',
    },
    {
      id: 'req_2',
      fromUserId: 'u_grace',
      fromDisplayName: 'Grace',
      direction: 'incoming',
      ts: m(60),
      message: 'Want to pair our pets?',
    },
    {
      id: 'req_3',
      fromUserId: 'u_henry',
      fromDisplayName: 'Henry',
      direction: 'outgoing',
      ts: m(120),
    },
  ];
}

function makeMockSuggestions(): FriendSuggestion[] {
  return [
    {
      userId: 'u_iris',
      displayName: 'Iris',
      mutualFriends: 3,
      reason: 'Plays dragon',
    },
    {
      userId: 'u_jack',
      displayName: 'Jack',
      mutualFriends: 1,
      reason: 'Nearby',
    },
    {
      userId: 'u_kate',
      displayName: 'Kate',
      mutualFriends: 5,
      reason: 'Same guild',
    },
  ];
}

let mockFriends: Friend[] = makeMockFriends();
let mockRequests: FriendRequest[] = makeMockRequests();
let mockSuggestions: FriendSuggestion[] = makeMockSuggestions();
let nextRequestId = 100;

// ============================================================================
// API
// ============================================================================

export async function listFriends(): Promise<Friend[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_friends' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockFriends;
}

export async function listFriendRequests(): Promise<FriendRequest[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_friend_requests' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockRequests;
}

export async function listFriendSuggestions(): Promise<FriendSuggestion[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_friend_suggestions' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockSuggestions;
}

export async function searchFriends(query: string): Promise<FriendSuggestion[]> {
  try {
    await apiClient.get('/get', { params: { action: 'search_friends', q: query } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return [
    ...mockFriends,
    ...mockSuggestions,
  ]
    .filter((x) => x.displayName.toLowerCase().includes(q))
    .map<FriendSuggestion>((x) => ({
      userId: x.userId,
      displayName: x.displayName,
      avatar: (x as Friend).avatarUrl,
      mutualFriends: 0,
    }));
}

export async function sendFriendRequest(
  userId: string,
  message?: string
): Promise<FriendRequest> {
  try {
    await apiClient.post('/post', { action: 'send_friend_request', userId, message });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  // De-duplicate: if there's already an outgoing request for this user,
  // return it.
  const existing = mockRequests.find(
    (r) => r.direction === 'outgoing' && r.fromUserId === userId
  );
  if (existing) return existing;

  nextRequestId += 1;
  const req: FriendRequest = {
    id: `req_${nextRequestId}`,
    fromUserId: userId,
    fromDisplayName:
      mockFriends.find((f) => f.userId === userId)?.displayName ??
      mockSuggestions.find((s) => s.userId === userId)?.displayName ??
      userId,
    direction: 'outgoing',
    ts: Date.now(),
    message,
  };
  mockRequests = [req, ...mockRequests];
  // Remove from suggestions
  mockSuggestions = mockSuggestions.filter((s) => s.userId !== userId);
  return req;
}

export async function decideFriendRequest(
  requestId: string,
  decision: 'accept' | 'decline'
): Promise<{ ok: true; friend?: Friend }> {
  try {
    await apiClient.post('/post', {
      action: 'decide_friend_request',
      requestId,
      decision,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const req = mockRequests.find((r) => r.id === requestId);
  mockRequests = mockRequests.filter((r) => r.id !== requestId);
  if (!req || decision === 'decline') return { ok: true };

  // Promote to friend
  const newFriend: Friend = {
    userId: req.fromUserId,
    displayName: req.fromDisplayName ?? req.fromUserId,
    presence: 'offline',
    friendsSince: Date.now(),
  };
  mockFriends = [...mockFriends, newFriend];
  return { ok: true, friend: newFriend };
}

export async function removeFriend(userId: string): Promise<{ ok: true }> {
  try {
    await apiClient.delete('/delete', {
      params: { action: 'remove_friend', userId },
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  mockFriends = mockFriends.filter((f) => f.userId !== userId);
  return { ok: true };
}

/**
 * Cancel an outgoing request. Same as sending a "decline" against your
 * own request. No-op if not found.
 */
export async function cancelFriendRequest(requestId: string): Promise<{ ok: true }> {
  try {
    await apiClient.delete('/delete', {
      params: { action: 'cancel_friend_request', requestId },
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  mockRequests = mockRequests.filter((r) => r.id !== requestId);
  return { ok: true };
}

// ============================================================================
// Step 4 — Tags, Gifts, Activity
// ============================================================================

/**
 * Update tags của 1 friend. Optimistic update với rollback on failure.
 */
export async function updateFriendTags(
  userId: string,
  tags: FriendTag[]
): Promise<Friend> {
  try {
    await apiClient.post('/post', {
      action: 'update_friend_tags',
      userId,
      tags,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const next = mockFriends.map((f) =>
    f.userId === userId ? { ...f, tags: [...tags] } : f
  );
  mockFriends = next;
  return next.find((f) => f.userId === userId)!;
}

/** Add 1 tag (idempotent). */
export async function addFriendTag(
  userId: string,
  tag: FriendTag
): Promise<Friend> {
  const friend = findFriend(userId);
  const tags = friend?.tags ?? [];
  if (tags.includes(tag)) return friend!;
  return updateFriendTags(userId, [...tags, tag]);
}

/** Remove 1 tag. */
export async function removeFriendTag(
  userId: string,
  tag: FriendTag
): Promise<Friend> {
  const friend = findFriend(userId);
  const tags = friend?.tags ?? [];
  return updateFriendTags(
    userId,
    tags.filter((t) => t !== tag)
  );
}

// ---------- Gifts ----------

let mockGifts: FriendGift[] = [
  {
    id: 'gift_1',
    fromUserId: 'me',
    fromDisplayName: 'You',
    toUserId: 'u_alice',
    toDisplayName: 'Alice',
    giftType: 'rose',
    quantity: 1,
    message: 'Congrats on level 12!',
    sentAt: Date.now() - 86400000,
    acknowledged: true,
  },
  {
    id: 'gift_2',
    fromUserId: 'u_carol',
    fromDisplayName: 'Carol',
    toUserId: 'me',
    toDisplayName: 'You',
    giftType: 'cake',
    quantity: 1,
    message: 'Happy friendship anniversary!',
    sentAt: Date.now() - 3600000,
    acknowledged: false,
  },
];
let nextGiftId = 100;

export async function sendFriendGift(input: {
  toUserId: string;
  giftType: FriendGiftType;
  quantity?: number;
  message?: string;
}): Promise<FriendGift> {
  try {
    await apiClient.post('/post', {
      action: 'send_friend_gift',
      ...input,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  nextGiftId += 1;
  const gift: FriendGift = {
    id: `gift_${nextGiftId}`,
    fromUserId: 'me',
    fromDisplayName: 'You',
    toUserId: input.toUserId,
    toDisplayName:
      findFriend(input.toUserId)?.displayName ?? input.toUserId,
    giftType: input.giftType,
    quantity: input.quantity ?? 1,
    message: input.message,
    sentAt: Date.now(),
    acknowledged: false,
  };
  mockGifts = [gift, ...mockGifts];
  // Bump friend's giftsReceived counter
  mockFriends = mockFriends.map((f) =>
    f.userId === input.toUserId
      ? { ...f, giftsReceived: (f.giftsReceived ?? 0) + gift.quantity }
      : f
  );
  return gift;
}

export async function listGiftHistory(userId?: string): Promise<FriendGift[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_gift_history', userId } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  if (!userId) return mockGifts;
  return mockGifts.filter(
    (g) => g.fromUserId === userId || g.toUserId === userId
  );
}

export async function acknowledgeGift(giftId: string): Promise<FriendGift> {
  try {
    await apiClient.post('/post', { action: 'acknowledge_gift', giftId });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  mockGifts = mockGifts.map((g) =>
    g.id === giftId ? { ...g, acknowledged: true } : g
  );
  return mockGifts.find((g) => g.id === giftId)!;
}

// ---------- Activity feed ----------

let mockActivity: FriendActivity[] = [
  {
    id: 'act_1',
    userId: 'u_alice',
    userDisplayName: 'Alice',
    userPetSpecies: 'cat',
    kind: 'level_up',
    payload: { level: 12, petName: 'Mochi' },
    createdAt: Date.now() - 1800000,
  },
  {
    id: 'act_2',
    userId: 'u_carol',
    userDisplayName: 'Carol',
    userPetSpecies: 'dragon',
    kind: 'achievement',
    payload: { achievement: 'First Quest Complete' },
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'act_3',
    userId: 'u_bob',
    userDisplayName: 'Bob',
    userPetSpecies: 'fox',
    kind: 'gift_sent',
    payload: { giftType: 'rose', toUserId: 'u_alice' },
    createdAt: Date.now() - 7200000,
  },
];
let nextActivityId = 100;

export async function listActivityFeed(limit = 50): Promise<FriendActivity[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_activity_feed', limit } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockActivity.slice(0, limit);
}

export function pushActivity(activity: Omit<FriendActivity, 'id'>): FriendActivity {
  nextActivityId += 1;
  const full: FriendActivity = {
    ...activity,
    id: `act_${nextActivityId}`,
  };
  mockActivity = [full, ...mockActivity];
  return full;
}

// ============================================================================
// Local helpers (used by realtime events from SyncManager)
// ============================================================================

/** Add an incoming friend request (from `friend:request` realtime event). */
export function injectIncomingRequest(req: FriendRequest): void {
  if (mockRequests.find((r) => r.id === req.id)) return;
  mockRequests = [req, ...mockRequests];
}

/** Update a friend's presence (from `friend:status` realtime event). */
export function setFriendPresence(
  userId: string,
  presence: Friend['presence'],
  lastSeen?: number
): void {
  mockFriends = mockFriends.map((f) =>
    f.userId === userId
      ? { ...f, presence, lastSeen: lastSeen ?? f.lastSeen }
      : f
  );
}

/** Get a friend by userId (mock-only). */
export function findFriend(userId: string): Friend | undefined {
  return mockFriends.find((f) => f.userId === userId);
}