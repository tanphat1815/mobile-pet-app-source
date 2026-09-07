/**
 * NotificationStore (Zustand) — Step 9 In-App Notification Center
 *
 * Wraps NotificationService state for React. Tracks:
 *   - permission status
 *   - push token (with platform)
 *   - registered flag (whether backend knows the token)
 *   - last received notification
 *   - badge count
 *
 * Step 9 — In-App Notification Center:
 *   - history: NotificationItem[] (persisted to AsyncStorage)
 *   - unreadCount derived from history
 *   - addNotification: insert new notification (cap 100, drop > 30 days)
 *   - markRead / markAllRead
 *   - bannerQueue: NotificationItem[] for slide-down banner
 *   - popBanner: shift first from bannerQueue
 *
 * Actions:
 *   - requestPermissionsAndRegister
 *   - subscribe (notification listeners)
 *   - dismissAll, setBadge
 *   - addNotification / markRead / markAllRead / clearHistory
 */

import { create } from 'zustand';
import {
  notificationService,
  type NotificationPermissionStatus,
  type NotificationEventType,
  type NotificationListener,
} from '../api/NotificationService';
import type { IncomingNotification, PushToken } from '../api/notificationTypes';
import { storage, StorageKeys } from '../api/storage';
import { IS_DEV } from '../api/config';
import {
  NotificationItem,
  NotificationKind,
  kindFromCategory,
  emojiForKind,
  sortNewestFirst,
  trimHistory,
  unreadCount,
  markRead as markReadItem,
  markAllRead as markAllReadItems,
} from '../api/notificationCenter';

// ============================================================================
// Types
// ============================================================================

export interface NotificationState {
  permissionStatus: NotificationPermissionStatus;
  pushToken: PushToken | null;
  registered: boolean;
  lastReceived: IncomingNotification | null;
  lastTapped: IncomingNotification | null;
  badgeCount: number;

  // Step 9 — In-App Notification Center
  history: NotificationItem[];
  bannerQueue: NotificationItem[];

  // Actions
  start: () => Promise<void>;
  stop: () => void;
  requestPermissionsAndRegister: () => Promise<PushToken | null>;
  on: (type: NotificationEventType, listener: NotificationListener) => () => void;
  refreshBadge: () => Promise<void>;
  dismissAll: () => Promise<void>;
  scheduleTest: () => Promise<void>;
  clearLastTapped: () => void;

  // Step 9 actions
  loadHistory: () => Promise<void>;
  addNotification: (input: {
    kind: NotificationKind;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
  }) => NotificationItem;
  pushBanner: (item: NotificationItem) => void;
  popBanner: () => NotificationItem | undefined;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearHistory: () => void;
}

// ============================================================================
// Persistence helpers
// ============================================================================

async function persistHistory(items: NotificationItem[]): Promise<void> {
  try {
    await storage.setJSON(StorageKeys.NotificationHistory, items);
  } catch (err) {
    if (IS_DEV) console.warn('[NotificationStore] persistHistory failed', err);
  }
}

// ============================================================================
// Store
// ============================================================================

export const useNotificationStore = create<NotificationState>((set, get) => ({
  permissionStatus: 'unknown',
  pushToken: null,
  registered: false,
  lastReceived: null,
  lastTapped: null,
  badgeCount: 0,
  history: [],
  bannerQueue: [],

  start: async () => {
    notificationService.configure();
    // Try to load cached token from storage
    const cached = await storage.getString(StorageKeys.PushToken);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PushToken;
        set({ pushToken: parsed });
      } catch {
        /* ignore */
      }
    }
    const badge = await notificationService.getBadgeCount();
    set({ badgeCount: badge });

    // Step 9 — load persisted history
    await get().loadHistory();
  },

  stop: () => {
    notificationService.cleanup();
    set({ lastReceived: null });
  },

  requestPermissionsAndRegister: async () => {
    notificationService.configure();

    const perm = await notificationService.requestPermissions();
    set({ permissionStatus: perm });

    if (perm !== 'granted') {
      if (IS_DEV) console.log('[NotificationStore] permission not granted:', perm);
      return null;
    }

    const token = await notificationService.getPushToken();
    if (!token) return null;
    set({ pushToken: token });

    const registered = await notificationService.registerWithBackend(token);
    set({ registered });

    return token;
  },

  on: (type, listener) => notificationService.on(type, listener),

  refreshBadge: async () => {
    const n = await notificationService.getBadgeCount();
    set({ badgeCount: n });
  },

  dismissAll: async () => {
    await notificationService.dismissAll();
    set({ badgeCount: 0 });
  },

  scheduleTest: async () => {
    await notificationService.scheduleLocal(
      '🐾 Mochi',
      'Your pet is getting hungry! Come feed them.',
      { category: 'pet', petId: 'pet_demo', reason: 'hungry' },
      2
    );
  },

  clearLastTapped: () => set({ lastTapped: null }),

  // ============================================================================
  // Step 9 — In-App Notification Center actions
  // ============================================================================

  loadHistory: async () => {
    const stored = await storage.getJSON<NotificationItem[]>(
      StorageKeys.NotificationHistory
    );
    if (!stored) return;
    // Trim stale items
    const trimmed = trimHistory(stored);
    set({ history: trimmed });
  },

  addNotification: ({ kind, title, body, payload }) => {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind,
      title,
      body,
      iconEmoji: emojiForKind(kind),
      receivedAt: new Date().toISOString(),
      readAt: null,
      payload,
    };
    const next = trimHistory(sortNewestFirst([item, ...get().history]));
    set({
      history: next,
      bannerQueue: [...get().bannerQueue, item],
    });
    persistHistory(next);
    return item;
  },

  pushBanner: (item) => {
    set({ bannerQueue: [...get().bannerQueue, item] });
  },

  popBanner: () => {
    const { bannerQueue } = get();
    if (bannerQueue.length === 0) return undefined;
    const [first, ...rest] = bannerQueue;
    set({ bannerQueue: rest });
    return first;
  },

  markRead: (id) => {
    const next = markReadItem(get().history, id);
    set({ history: next, badgeCount: unreadCount(next) });
    persistHistory(next);
  },

  markAllRead: () => {
    const next = markAllReadItems(get().history);
    set({ history: next, badgeCount: 0 });
    persistHistory(next);
  },

  clearHistory: () => {
    set({ history: [], bannerQueue: [], badgeCount: 0 });
    persistHistory([]);
  },
}));

// ============================================================================
// Dev expose (Step 9) — e2e tests
// ============================================================================
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__NOTIF_STORE__ = useNotificationStore;
  (globalThis as any).__NOTIF_STORE_ADD__ = (
    payload: { kind: NotificationKind; title: string; body: string; payload?: Record<string, unknown> }
  ) => useNotificationStore.getState().addNotification(payload);
  (globalThis as any).__NOTIF_STORE_MARK_READ__ = (id: string) =>
    useNotificationStore.getState().markRead(id);
  (globalThis as any).__NOTIF_STORE_MARK_ALL_READ__ = () =>
    useNotificationStore.getState().markAllRead();
  (globalThis as any).__NOTIF_STORE_GET_HISTORY__ = () =>
    useNotificationStore.getState().history;
  (globalThis as any).__NOTIF_STORE_GET_UNREAD__ = () =>
    useNotificationStore.getState().history.filter((n) => n.readAt === null).length;
  (globalThis as any).__NOTIF_STORE_CLEAR__ = () =>
    useNotificationStore.getState().clearHistory();
  if (typeof window !== 'undefined') {
    (window as any).__NOTIF_STORE__ = (globalThis as any).__NOTIF_STORE__;
    (window as any).__NOTIF_STORE_ADD__ = (globalThis as any).__NOTIF_STORE_ADD__;
    (window as any).__NOTIF_STORE_MARK_READ__ = (globalThis as any).__NOTIF_STORE_MARK_READ__;
    (window as any).__NOTIF_STORE_MARK_ALL_READ__ = (globalThis as any).__NOTIF_STORE_MARK_ALL_READ__;
    (window as any).__NOTIF_STORE_GET_HISTORY__ = (globalThis as any).__NOTIF_STORE_GET_HISTORY__;
    (window as any).__NOTIF_STORE_GET_UNREAD__ = (globalThis as any).__NOTIF_STORE_GET_UNREAD__;
    (window as any).__NOTIF_STORE_CLEAR__ = (globalThis as any).__NOTIF_STORE_CLEAR__;
  }
}

// ============================================================================
// Selectors (Step 9)
// ============================================================================

export const selectUnreadCount = (s: NotificationState): number =>
  unreadCount(s.history);

// ============================================================================
// Hooks
// ============================================================================

import { useEffect } from 'react';

/**
 * Subscribe to notification events from the service. Mount once at the
 * app root or in any component that should react to notifications.
 */
export function useNotificationListener(
  type: NotificationEventType,
  listener: NotificationListener
): void {
  const on = useNotificationStore((s) => s.on);
  useEffect(() => {
    const off = on(type, listener);
    return off;
  }, [type, listener, on]);
}

/**
 * Auto-bridge: listens for notifications received/tapped and updates
 * the store's lastReceived / lastTapped + badge count, and pushes to
 * in-app notification history.
 */
export function useNotificationStoreBridge(): void {
  const on = useNotificationStore((s) => s.on);
  useEffect(() => {
    const offR = on('received', (n) => {
      useNotificationStore.setState({ lastReceived: n });
      useNotificationStore.getState().refreshBadge();
      // Step 9 — push to in-app history if category is set
      if (n.category) {
        const kind = kindFromCategory(n.category, n.data);
        useNotificationStore.getState().addNotification({
          kind,
          title: n.title,
          body: n.body ?? '',
          payload: n.data as unknown as Record<string, unknown>,
        });
      }
      if (IS_DEV) console.log('[NotificationStore] received:', n.title);
    });
    const offT = on('tapped', (n) => {
      useNotificationStore.setState({ lastTapped: n });
      if (IS_DEV) console.log('[NotificationStore] tapped:', n.title);
    });
    return () => {
      offR();
      offT();
    };
  }, [on]);
}

/**
 * Step 9 — Subscribe to a SyncManager `notification:new` event from
 * the WebSocket. Mount once near the root.
 */
export function useRealtimeNotificationSync(): void {
  const handler = (payload: {
    kind?: string;
    title?: string;
    body?: string;
    payload?: Record<string, unknown>;
  }) => {
    const kind: NotificationKind =
      (payload?.kind as NotificationKind) ?? 'system_announcement';
    const title = payload?.title ?? 'Notification';
    const body = payload?.body ?? '';
    useNotificationStore.getState().addNotification({
      kind,
      title,
      body,
      payload: payload?.payload,
    });
  };
  // Lazy-load SyncStore hook (dynamic import avoids static circular dep
  // at module evaluation time).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useSyncEvent } = require('./SyncStore') as typeof import('./SyncStore');
  useSyncEvent('notification:new', handler);
}
