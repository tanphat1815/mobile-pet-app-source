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
  updateFriendTags,
  addFriendTag,
  removeFriendTag,
  sendFriendGift,
  listGiftHistory,
  acknowledgeGift,
  listActivityFeed,
  pushActivity,
} from '../api/friends';
import {
  Friend,
  FriendActivity,
  FriendGift,
  FriendRequest,
  FriendSuggestion,
  FriendRequestDecisionInput,
  FriendTag,
  FriendGiftType,
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
  /** Step 4 — gift history (all gifts). */
  gifts: FriendGift[];
  /** Step 4 — pending gift sends. */
  giftsSending: string[];
  /** Step 4 — activity feed (limit 50). */
  activity: FriendActivity[];
  activityStatus: 'idle' | 'loading' | 'ready' | 'error';

  // Actions
  loadAll: () => Promise<void>;
  loadFriends: () => Promise<void>;
  loadRequests: () => Promise<void>;
  loadSuggestions: () => Promise<void>;
  loadActivity: () => Promise<void>;
  search: (q: string) => Promise<void>;
  clearSearch: () => void;
  sendRequest: (input: { userId: string; message?: string }) => Promise<FriendRequest>;
  decideRequest: (input: FriendRequestDecisionInput) => Promise<{ ok: true; friend?: Friend }>;
  cancelRequest: (requestId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  /** Step 4 — tags */
  updateTags: (userId: string, tags: FriendTag[]) => Promise<void>;
  addTag: (userId: string, tag: FriendTag) => Promise<void>;
  removeTag: (userId: string, tag: FriendTag) => Promise<void>;
  /** Step 4 — gifts */
  sendGift: (input: {
    toUserId: string;
    giftType: FriendGiftType;
    quantity?: number;
    message?: string;
  }) => Promise<FriendGift>;
  loadGifts: (userId?: string) => Promise<void>;
  acknowledgeGiftAction: (giftId: string) => Promise<void>;
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

  gifts: [],
  giftsSending: [],
  activity: [],
  activityStatus: 'idle',

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

  // ==========================================================================
  // Step 4 — Tags
  // ==========================================================================

  updateTags: async (userId, tags) => {
    // Optimistic
    const prev = get().friends;
    const optimistic = prev.map((f) =>
      f.userId === userId ? { ...f, tags: [...tags] } : f
    );
    set({ friends: optimistic });
    try {
      const updated = await updateFriendTags(userId, tags);
      // Reconcile với server response
      set({
        friends: get().friends.map((f) =>
          f.userId === userId ? updated : f
        ),
      });
    } catch (err) {
      // Rollback
      set({
        friends: prev,
        error: err instanceof Error ? err.message : 'Failed to update tags',
      });
      throw err;
    }
  },

  addTag: async (userId, tag) => {
    const friend = get().friends.find((f) => f.userId === userId);
    const tags = friend?.tags ?? [];
    if (tags.includes(tag)) return;
    return get().updateTags(userId, [...tags, tag]);
  },

  removeTag: async (userId, tag) => {
    const friend = get().friends.find((f) => f.userId === userId);
    const tags = friend?.tags ?? [];
    return get().updateTags(
      userId,
      tags.filter((t) => t !== tag)
    );
  },

  // ==========================================================================
  // Step 4 — Gifts
  // ==========================================================================

  sendGift: async (input) => {
    set({ giftsSending: [...get().giftsSending, input.toUserId + ':' + input.giftType] });
    try {
      const gift = await sendFriendGift(input);
      set({
        gifts: [gift, ...get().gifts],
        giftsSending: get().giftsSending.filter(
          (k) => k !== input.toUserId + ':' + input.giftType
        ),
      });
      // Push activity event
      pushActivity({
        userId: 'me',
        userDisplayName: 'You',
        kind: 'gift_sent',
        payload: { giftType: input.giftType, toUserId: input.toUserId },
        createdAt: Date.now(),
      });
      // Re-read activity (prepend only new one)
      const existing = get().activity;
      const newAct = pushActivity.bind(null);
      void existing; // tsc noUnused
      void newAct;
      return gift;
    } catch (err) {
      set({
        giftsSending: get().giftsSending.filter(
          (k) => k !== input.toUserId + ':' + input.giftType
        ),
        error: err instanceof Error ? err.message : 'Failed to send gift',
      });
      throw err;
    }
  },

  loadGifts: async (userId) => {
    try {
      const gifts = await listGiftHistory(userId);
      set({ gifts });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load gifts',
      });
    }
  },

  acknowledgeGiftAction: async (giftId) => {
    const prev = get().gifts;
    // Optimistic
    set({
      gifts: prev.map((g) =>
        g.id === giftId ? { ...g, acknowledged: true } : g
      ),
    });
    try {
      const updated = await acknowledgeGift(giftId);
      set({ gifts: get().gifts.map((g) => (g.id === giftId ? updated : g)) });
    } catch {
      set({ gifts: prev });
    }
  },

  // ==========================================================================
  // Step 4 — Activity
  // ==========================================================================

  loadActivity: async () => {
    set({ activityStatus: 'loading' });
    try {
      const activity = await listActivityFeed();
      set({ activity, activityStatus: 'ready' });
    } catch (err) {
      set({
        activityStatus: 'error',
        error: err instanceof Error ? err.message : 'Failed to load activity',
      });
    }
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
      gifts: [],
      giftsSending: [],
      activity: [],
      activityStatus: 'idle',
    });
  },
}));

// ============================================================================
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  const w: any = globalThis;
  if (!w.__MOBILE_PET__) w.__MOBILE_PET__ = {};
  w.__MOBILE_PET__.getFriendGifts = () => useFriendStore.getState().gifts;
  w.__MOBILE_PET__.getFriendActivity = () => useFriendStore.getState().activity;
  if (typeof window !== 'undefined') {
    (window as any).__MOBILE_PET__ = w.__MOBILE_PET__;
  }
  // Subscribe auto-update cho e2e test inspection
  useFriendStore.subscribe((state) => {
    (globalThis as any).__FRIEND_STORE_GIFTS__ = state.gifts.length;
    (globalThis as any).__FRIEND_STORE_ACTIVITY__ = state.activity.length;
    if (typeof window !== 'undefined') {
      (window as any).__FRIEND_STORE_GIFTS__ = state.gifts.length;
      (window as any).__FRIEND_STORE_ACTIVITY__ = state.activity.length;
    }
  });
  // Initial
  const init = useFriendStore.getState();
  (globalThis as any).__FRIEND_STORE_GIFTS__ = init.gifts.length;
  (globalThis as any).__FRIEND_STORE_ACTIVITY__ = init.activity.length;
  if (typeof window !== 'undefined') {
    (window as any).__FRIEND_STORE_GIFTS__ = init.gifts.length;
    (window as any).__FRIEND_STORE_ACTIVITY__ = init.activity.length;
  }
}

// Dev helpers — exposed khi store import. Mount DebugProvider
// trên screen FriendsChat sẽ hydrate state.
// ============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __MOBILE_PET__: any;
}

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  const existing = (globalThis as any).__MOBILE_PET__ || {};
  (globalThis as any).__MOBILE_PET__ = {
    ...existing,
    // Friends helpers
    triggerFriendActivity: (kind: any, payload: Record<string, unknown>) => {
      useFriendStore.setState((s: any) => ({
        activity: [
          {
            id: `act_e2e_${Date.now()}`,
            userId: 'u_alice',
            userDisplayName: 'Alice',
            userPetSpecies: 'cat',
            kind,
            payload,
            createdAt: Date.now(),
          },
          ...s.activity,
        ],
      }));
    },
    triggerFriendGift: (fromUserId: string, giftType: FriendGiftType) => {
      useFriendStore.setState((s) => ({
        gifts: [
          {
            id: `gift_e2e_${Date.now()}`,
            fromUserId,
            fromDisplayName: 'Test User',
            toUserId: 'me',
            toDisplayName: 'You',
            giftType,
            quantity: 1,
            message: 'e2e gift',
            sentAt: Date.now(),
            acknowledged: false,
          },
          ...s.gifts,
        ],
      }));
    },
  };
  if (typeof window !== 'undefined') {
    (window as any).__MOBILE_PET__ = (globalThis as any).__MOBILE_PET__;
  }
}

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
  const loadActivity = useFriendStore((s) => s.loadActivity);

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

  // Step 4 — friend activity events
  useSyncEvent('friend:activity', (payload) => {
    pushActivity({
      userId: payload.userId,
      userDisplayName: payload.userDisplayName,
      userPetSpecies: payload.userPetSpecies,
      kind: payload.kind,
      payload: payload.payload,
      createdAt: payload.createdAt ?? Date.now(),
    });
    useFriendStore.setState({
      activity: [
        {
          id: `act_${Date.now()}`,
          userId: payload.userId,
          userDisplayName: payload.userDisplayName,
          userPetSpecies: payload.userPetSpecies,
          kind: payload.kind,
          payload: payload.payload,
          createdAt: payload.createdAt ?? Date.now(),
        },
        ...useFriendStore.getState().activity,
      ],
    });
  });

  // Lazy initial load so the friend list always has fresh data on first
  // mount.
  if (useFriendStore.getState().status === 'idle') {
    loadAll();
  }
  // Auto-load activity on first subscribe
  if (useFriendStore.getState().activityStatus === 'idle') {
    loadActivity();
  }
}