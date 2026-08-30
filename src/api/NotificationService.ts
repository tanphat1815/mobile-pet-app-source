/**
 * NotificationService
 *
 * Wraps `expo-notifications` to provide a clean API for:
 *   - Permission requests
 *   - Fetching the Expo push token (or device token on native)
 *   - Listening for notifications received in the foreground
 *   - Listening for notifications tapped (background/killed states)
 *   - Configuring Android notification channels
 *
 * The service is a singleton. Consumers use `notificationService` directly
 * or via the `useNotifications` hook for subscription-style events.
 *
 * On web, expo-notifications is a no-op - we fall back to localStorage
 * tokens so the UI flow remains testable.
 */

import { Alert, Platform } from 'react-native';
import {
  storage,
  StorageKeys,
  getStoredToken,
} from './storage';
import type {
  PushToken,
  IncomingNotification,
  NotificationData,
} from './notificationTypes';
import { IS_DEV, APP_VERSION } from './config';

// Lazy-require expo-notifications so the web bundle doesn't crash if it
// isn't supported in the current runtime.
type NotificationsModule = typeof import('expo-notifications');
let Notifications: NotificationsModule | null = null;
let Device: typeof import('expo-device') | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch (e) {
  if (IS_DEV) console.warn('[Notifications] expo-notifications not available:', e);
}

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Device = require('expo-device');
} catch (e) {
  if (IS_DEV) console.warn('[Notifications] expo-device not available:', e);
}

// ============================================================================
// Types
// ============================================================================

export type NotificationPermissionStatus =
  | 'unknown'
  | 'granted'
  | 'denied'
  | 'undetermined';

export type NotificationEventType = 'received' | 'tapped';

export type NotificationListener = (n: IncomingNotification) => void;

// ============================================================================
// Service
// ============================================================================

class NotificationServiceImpl {
  private receivedSubscription: { remove: () => void } | null = null;
  private responseSubscription: { remove: () => void } | null = null;
  private listeners: Map<NotificationEventType, Set<NotificationListener>> = new Map();
  private lastToken: PushToken | null = null;
  private configured = false;

  /**
   * Configure the platform's notification behavior:
   *   - iOS / Android foreground behavior
   *   - Android default channel
   *   - Notification handler (show alert + sound + badge in foreground)
   */
  configure(): void {
    if (this.configured) return;
    this.configured = true;
    if (!Notifications) return;

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: true,
          shouldShowAlert: true,
        }),
      });

      // Android default channel
      if (Platform.OS === 'android') {
        try {
          Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
          });
        } catch (e) {
          if (IS_DEV) console.warn('[Notifications] channel setup failed', e);
        }
      }
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] configure failed', e);
    }
  }

  /**
   * Request permission to display notifications. Returns the resulting
   * permission status. Idempotent.
   */
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    if (!Notifications) return 'denied';
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) return 'granted';
      if (settings.ios?.status === Notifications.IosAuthorizationStatus?.DENIED) {
        return 'denied';
      }
      const req = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
        },
      });
      if (req.granted) return 'granted';
      return 'denied';
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] requestPermissions failed', e);
      return 'denied';
    }
  }

  /**
   * Get the Expo push token for this device. Persists to storage and
   * returns the cached token if available. Returns null if the device is
   * a simulator/emulator or permission is denied.
   */
  async getPushToken(): Promise<PushToken | null> {
    if (!Notifications || !Device) {
      // Web fallback: synthesize a fake token so the dev flow can be exercised
      const webToken: PushToken = {
        token: `web-${Date.now()}`,
        platform: 'web',
        appVersion: APP_VERSION,
      };
      this.lastToken = webToken;
      await storage.set(StorageKeys.PushToken, JSON.stringify(webToken));
      return webToken;
    }

    // Already cached in memory
    if (this.lastToken) return this.lastToken;

    // Already persisted
    const cached = await storage.getString(StorageKeys.PushToken);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PushToken;
        this.lastToken = parsed;
        return parsed;
      } catch {
        /* ignore */
      }
    }

    if (!Device.isDevice) {
      if (IS_DEV) {
        console.warn('[Notifications] running on simulator/emulator; no real token');
      }
      return null;
    }

    try {
      const projectId =
        // @ts-expect-error - extra may not exist on older SDKs
        Notifications.easProjectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? undefined;
      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      const push: PushToken = {
        token: tokenData.data,
        platform: (Platform.OS as 'ios' | 'android' | 'web') ?? 'ios',
        appVersion: APP_VERSION,
      };
      this.lastToken = push;
      await storage.set(StorageKeys.PushToken, JSON.stringify(push));
      return push;
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] getExpoPushTokenAsync failed', e);
      return null;
    }
  }

  /**
   * Register the push token with the backend. No-op on web (no real
   * token).
   */
  async registerWithBackend(token: PushToken): Promise<boolean> {
    if (!token) return false;
    if (token.platform === 'web') {
      // skip real registration on web
      return false;
    }
    try {
      // Use the API client so the auth token is attached automatically.
      const apiClient = (await import('./client')).default;
      const authToken = await getStoredToken();
      await apiClient.post(
        '/notifications/register',
        { push: token },
        { headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined }
      );
      return true;
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] backend register failed', e);
      return false;
    }
  }

  /**
   * Subscribe to a notification event ('received' for foreground,
   * 'tapped' for user interaction).
   */
  on(type: NotificationEventType, listener: NotificationListener): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);

    // Lazy attach native listeners
    this.attachNativeListeners();

    return () => {
      const s = this.listeners.get(type);
      if (s) s.delete(listener);
    };
  }

  /**
   * Schedule a local notification. Useful for testing on Android emulator
   * or iOS simulator.
   */
  async scheduleLocal(
    title: string,
    body: string,
    data?: NotificationData,
    secondsFromNow = 1
  ): Promise<string | null> {
    if (!Notifications) {
      if (IS_DEV) {
        Alert.alert('Local notification', `${title}\n${body}`);
      }
      return null;
    }
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: (data ?? {}) as unknown as Record<string, unknown>,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, secondsFromNow),
          repeats: false,
        },
      });
      return id;
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] scheduleLocal failed', e);
      return null;
    }
  }

  /**
   * Dismiss all currently displayed notifications.
   */
  async dismissAll(): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] dismissAll failed', e);
    }
  }

  /** Get the badge count (iOS / Android). */
  async getBadgeCount(): Promise<number> {
    if (!Notifications) return 0;
    try {
      return await Notifications.getBadgeCountAsync();
    } catch {
      return 0;
    }
  }

  /** Set the badge count (iOS / Android). */
  async setBadgeCount(count: number): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] setBadgeCount failed', e);
    }
  }

  // ----------------------------------------------------------------------
  // Internals
  // ----------------------------------------------------------------------

  private attachNativeListeners(): void {
    if (!Notifications) return;
    if (this.receivedSubscription || this.responseSubscription) return;

    try {
      this.receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        const normalized = this.normalize(notification);
        this.emit('received', normalized);
      });
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] addNotificationReceivedListener failed', e);
    }

    try {
      this.responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const normalized = this.normalize(response.notification);
        this.emit('tapped', normalized);
      });
    } catch (e) {
      if (IS_DEV) console.warn('[Notifications] addNotificationResponseReceivedListener failed', e);
    }
  }

  private normalize(notification: any): IncomingNotification {
    const req = notification?.request ?? notification;
    const content = req?.content ?? {};
    const data = (content.data ?? {}) as NotificationData;
    return {
      title: content.title ?? '',
      body: content.body ?? undefined,
      data,
      category: data?.category,
    };
  }

  private emit(type: NotificationEventType, n: IncomingNotification): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of set) {
      try {
        listener(n);
      } catch (e) {
        if (IS_DEV) console.warn(`[Notifications] listener for ${type} threw`, e);
      }
    }
  }

  /** Clear all listeners (e.g. on logout). */
  cleanup(): void {
    try {
      this.receivedSubscription?.remove();
      this.responseSubscription?.remove();
    } catch {
      /* ignore */
    }
    this.receivedSubscription = null;
    this.responseSubscription = null;
    this.listeners.clear();
    this.lastToken = null;
  }
}

export const notificationService = new NotificationServiceImpl();