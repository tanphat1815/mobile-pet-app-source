/**
 * SyncManager Lifecycle
 *
 * Wraps any subtree and starts the SyncManager when the user becomes
 * authenticated, stops it on logout. Also keeps the cached token in sync
 * with the auth store so the SyncManager can read it synchronously on
 * (re)connect.
 *
 * Usage:
 *   <SyncLifecycle>
 *     <AppNavigator />
 *   </SyncLifecycle>
 */

import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/AuthStore';
import { useSyncStore, setSyncAuthToken } from '../stores/SyncStore';
import { getStoredToken } from '../api/storage';

export function SyncLifecycle({ children }: { children: React.ReactNode }) {
  const authStatus = useAuthStore((s) => s.status);
  const syncStart = useSyncStore((s) => s.start);
  const syncStop = useSyncStore((s) => s.stop);

  // Keep the cached token up to date with auth state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getStoredToken();
      if (!cancelled) setSyncAuthToken(token);
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // Start / stop the manager on auth transitions
  useEffect(() => {
    if (authStatus === 'authenticated') {
      syncStart();
    } else if (authStatus === 'logging_out' || authStatus === 'unauthenticated') {
      syncStop();
      setSyncAuthToken(null);
    }
  }, [authStatus, syncStart, syncStop]);

  return <>{children}</>;
}