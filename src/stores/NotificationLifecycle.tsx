/**
 * NotificationLifecycle
 *
 * Mount inside <SyncLifecycle>. Configures the notification service on
 * mount, requests permissions + registers the push token with the
 * backend when the user becomes authenticated, and cleans up on logout.
 */

import { useEffect } from 'react';
import { useAuthStore } from './AuthStore';
import {
  useNotificationStore,
  useNotificationStoreBridge,
} from './NotificationStore';

export function NotificationLifecycle({ children }: { children: React.ReactNode }) {
  const authStatus = useAuthStore((s) => s.status);
  const start = useNotificationStore((s) => s.start);
  const stop = useNotificationStore((s) => s.stop);
  const register = useNotificationStore((s) => s.requestPermissionsAndRegister);

  useNotificationStoreBridge();

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      // Best-effort: try to get permission + register. Failures are
      // non-fatal; the user can grant permission later via Settings.
      register().catch(() => undefined);
    } else if (authStatus === 'logging_out' || authStatus === 'unauthenticated') {
      stop();
    }
  }, [authStatus, register, stop]);

  return <>{children}</>;
}