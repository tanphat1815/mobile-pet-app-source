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
  FriendRequest,
  FriendSuggestion,
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
    },
    {
      userId: 'u_carol',
      displayName: 'Carol',
      petLevel: 9,
      petSpecies: 'dragon',
      presence: 'online',
      lastSeen: m(5),
      friendsSince: h(72),
    },
    {
      userId: 'u_dave',
      displayName: 'Dave',
      petLevel: 4,
      petSpecies: 'dog',
      presence: 'away',
      lastSeen: m(20),
      friendsSince: h(24),
    },
    {
      userId: 'u_bob',
      displayName: 'Bob',
      petLevel: 7,
      petSpecies: 'fox',
      presence: 'offline',
      lastSeen: h(2),
      friendsSince: h(120),
    },
    {
      userId: 'u_emma',
      displayName: 'Emma',
      petLevel: 3,
      petSpecies: 'hamster',
      presence: 'offline',
      lastSeen: h(48),
      friendsSince: h(8),
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