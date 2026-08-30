/**
 * NotificationStore (Zustand)
 *
 * Wraps NotificationService state for React. Tracks:
 *   - permission status
 *   - push token (with platform)
 *   - registered flag (whether backend knows the token)
 *   - last received notification
 *   - badge count
 *
 * Actions:
 *   - requestPermissionsAndRegister: requests permission, fetches the
 *     Expo push token, registers it with the backend. Idempotent.
 *   - subscribe: wire notification listeners (received/tapped).
 *   - dismissAll, setBadge
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

  // Actions
  start: () => Promise<void>;
  stop: () => void;
  requestPermissionsAndRegister: () => Promise<PushToken | null>;
  on: (type: NotificationEventType, listener: NotificationListener) => () => void;
  refreshBadge: () => Promise<void>;
  dismissAll: () => Promise<void>;
  scheduleTest: () => Promise<void>;
  clearLastTapped: () => void;
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
  },

  stop: () => {
    // Detach native listeners but keep the cached token
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
}));

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
 * the store's lastReceived / lastTapped + badge count.
 */
export function useNotificationStoreBridge(): void {
  const on = useNotificationStore((s) => s.on);
  useEffect(() => {
    const offR = on('received', (n) => {
      useNotificationStore.setState({ lastReceived: n });
      useNotificationStore.getState().refreshBadge();
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