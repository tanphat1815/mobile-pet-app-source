/**
 * FriendStore (Zustand)
 *
 * Manages:
 *   - The user's friend list (presence, last seen, status message)
 *   - Incoming/outgoing friend requests
 *   - Friend suggestions
 *
 * Realtime bridge: subscribes to `friend:status` and `friend:request`
 * events from the SyncManager and pipes them into the store.
 */

import { create } from 'zustand';
import {
  listFriends,
  listFriendRequests,
  listFriendSuggestions,
  searchFriends,
  sendFriendRequest,
  decideFriendRequest,
  cancelFriendRequest,
  removeFriend,
  setFriendPresence,
  injectIncomingRequest,
} from '../api/friends';
import {
  Friend,
  FriendRequest,
  FriendSuggestion,
  FriendRequestDecisionInput,
} from '../api/friendTypes';
import { useSyncEvent } from './SyncStore';

// ============================================================================
// Types
// ============================================================================

export type FriendListStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'error';

export interface FriendState {
  friends: Friend[];
  requests: FriendRequest[];
  suggestions: FriendSuggestion[];
  status: FriendListStatus;
  error: string | null;
  /** True while a decision is in flight */
  decidingRequestIds: string[];
  /** True while search is in flight */
  searchResults: FriendSuggestion[];
  searchQuery: string;
  searching: boolean;

  // Actions
  loadAll: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadRequests: () => Promise<void>;
  loadSuggestions: () => Promise<void>;
  search: (q: string) => Promise<void>;
  clearSearch: () => void;
  sendRequest: (input: { userId: string; message?: string }) => Promise<FriendRequest>;
  decideRequest: (input: FriendRequestDecisionInput) => Promise<{ ok: true; friend?: Friend }>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  requests: [],
  suggestions: [],
  status: 'idle',
  error: null,
  decidingRequestIds: [],
  searchResults: [],
  searchQuery: '',
  searching: false,

  loadAll: async () => {
    set({ status: 'loading', error: null });
    try {
      const [friends, requests, suggestions] = await Promise.all([
        listFriends(),
        listFriendRequests(),
        listFriendSuggestions(),
      ]);
      set({ friends, requests, suggestions, status: 'ready' });
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load friends',
      });
    }
  },

  loadFriends: async () => {
    try {
      const friends = await listFriends();
      set({ friends });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load friends',
      });
    }
  },

  loadRequests: async () => {
    try {
      const requests = await listFriendRequests();
      set({ requests });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load requests',
      });
    }
  },

  loadSuggestions: async () => {
    try {
      const suggestions = await listFriendSuggestions();
      set({ suggestions });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load suggestions',
      });
    }
  },

  search: async (q: string) => {
    set({ searchQuery: q, searching: true });
    try {
      const results = await searchFriends(q);
      set({ searchResults: results, searching: false });
    } catch {
      set({ searchResults: [], searching: false });
    }
  },

  clearSearch: () => set({ searchResults: [], searchQuery: '', searching: false }),

  sendRequest: async ({ userId, message }) => {
    const req = await sendFriendRequest(userId, message);
    // Add to outgoing requests
    const existing = get().requests.find((r) => r.id === req.id);
    if (!existing) {
      set({ requests: [req, ...get().requests] });
    }
    // Remove from suggestions / search results
    set({
      suggestions: get().suggestions.filter((s) => s.userId !== userId),
      searchResults: get().searchResults.filter((s) => s.userId !== userId),
    });
    return req;
  },

  decideRequest: async ({ requestId, decision }) => {
    set({
      decidingRequestIds: [...get().decidingRequestIds, requestId],
    });
    try {
      const res = await decideFriendRequest(requestId, decision);
      set({
        requests: get().requests.filter((r) => r.id !== requestId),
      });
      if (res.friend) {
        set({ friends: [...get().friends, res.friend] });
      }
      return res;
    } finally {
      set({
        decidingRequestIds: get().decidingRequestIds.filter((id) => id !== requestId),
      });
    }
  },

  cancelRequest: async (requestId: string) => {
    await cancelFriendRequest(requestId);
    set({
      requests: get().requests.filter((r) => r.id !== requestId),
    });
  },

  removeFriend: async (userId: string) => {
    await removeFriend(userId);
    set({
      friends: get().friends.filter((f) => f.userId !== userId),
    });
  },

  reset: () => {
    set({
      friends: [],
      requests: [],
      suggestions: [],
      status: 'idle',
      error: null,
      decidingRequestIds: [],
      searchResults: [],
      searchQuery: '',
      searching: false,
    });
  },
}));

// ============================================================================
// Realtime bridge
// ============================================================================

/**
 * Subscribes to friend:status and friend:request events from the
 * SyncManager and pipes them into FriendStore. Mount once at the app
 * root or inside <SyncLifecycle>.
 */
export function useFriendRealtimeSync(): void {
  const loadAll = useFriendStore((s) => s.loadAll);

  useSyncEvent('friend:status', (payload) => {
    const { userId, online, lastSeen } = payload;
    setFriendPresence(userId, online ? 'online' : 'offline', lastSeen);
    // Mirror to store
    useFriendStore.setState({
      friends: useFriendStore.getState().friends.map((f) =>
        f.userId === userId
          ? { ...f, presence: online ? 'online' : 'offline', lastSeen: lastSeen ?? f.lastSeen }
          : f
      ),
    });
  });

  useSyncEvent('friend:request', (payload) => {
    const req: FriendRequest = {
      id: `req_${payload.fromUserId}_${Date.now()}`,
      fromUserId: payload.fromUserId,
      fromDisplayName: payload.fromDisplayName,
      direction: 'incoming',
      ts: Date.now(),
    };
    injectIncomingRequest(req);
    useFriendStore.setState({
      requests: [req, ...useFriendStore.getState().requests],
    });
  });

  // Lazy initial load so the friend list always has fresh data on first
  // mount.
  if (useFriendStore.getState().status === 'idle') {
    loadAll();
  }
}