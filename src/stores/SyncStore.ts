/**
 * SyncStore (Zustand)
 *
 * Wraps SyncManager and exposes connection status + last received event
 * timestamps to React. Owns the manager lifecycle (construct once, connect
 * on auth, disconnect on logout).
 *
 * The store does NOT own individual event subscriptions - callers should
 * use `useSyncEvent(type, handler)` to listen for typed events. This keeps
 * state minimal and prevents re-render storms.
 */

import { useEffect } from 'react';
import { create } from 'zustand';
import { SyncManager, type ConnectionStatus } from '../api/SyncManager';
import { getOrCreateDeviceId } from '../api/deviceId';
import type { SyncEnvelope, SyncEventType, SyncEventPayloadMap } from '../api/syncTypes';
import { IS_DEV } from '../api/config';

// ============================================================================
// Types
// ============================================================================

export interface SyncState {
  status: ConnectionStatus;
  reconnectAttempt: number;
  lastEventTs: number | null;
  eventsReceived: number;
  manager: SyncManager | null;

  // Actions
  start: () => Promise<void>;
  stop: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useSyncStore = create<SyncState>((set, get) => ({
  status: 'idle',
  reconnectAttempt: 0,
  lastEventTs: null,
  eventsReceived: 0,
  manager: null,

  start: async () => {
    if (get().manager) {
      get().manager!.connect();
      return;
    }

    const clientId = await getOrCreateDeviceId();

    const manager = new SyncManager({
      clientId,
      getToken: () => {
        // SyncManager expects a synchronous token getter; we read the
        // token from a cached value that's refreshed when auth state changes.
        return tokenCache;
      },
      onStatusChange: (status, attempt) => {
        if (IS_DEV) console.log(`[SyncStore] status → ${status} (attempt ${attempt ?? 0})`);
        set({ status, reconnectAttempt: attempt ?? 0 });
      },
      onEvent: (_envelope: SyncEnvelope) => {
        set((s) => ({
          lastEventTs: Date.now(),
          eventsReceived: s.eventsReceived + 1,
        }));
      },
    });

    set({ manager });
    manager.connect();
  },

  stop: () => {
    const m = get().manager;
    if (m) {
      m.disconnect();
      set({ manager: null, status: 'closed', reconnectAttempt: 0 });
    }
  },
}));

// ============================================================================
// Token cache (synced with AuthStore)
// ============================================================================

let tokenCache: string | null = null;

export function setSyncAuthToken(token: string | null): void {
  tokenCache = token;
}

// ============================================================================
// Event subscription hook
// ============================================================================

/**
 * Subscribe to a typed event from the SyncManager. Re-subscribes when the
 * manager changes (e.g. on re-auth). Returns nothing - the listener is
 * cleaned up automatically when the component unmounts or the manager
 * reference changes.
 */
export function useSyncEvent<K extends SyncEventType>(
  type: K,
  handler: (payload: SyncEventPayloadMap[K], envelope: SyncEnvelope) => void
): void {
  const manager = useSyncStore((s) => s.manager);

  useEffect(() => {
    if (!manager) return;
    const off = manager.on(type, handler);
    return off;
  }, [manager, type, handler]);
}
