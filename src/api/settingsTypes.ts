/**
 * User Settings Domain Types
 *
 * Settings that can be toggled by the user from the SettingsScreen.
 * Each setting has a server-side authoritative value (returned by
 * /settings) and a local mirror stored in AsyncStorage so the UI
 * can render immediately on app launch.
 */

export type ThemePreference = 'system' | 'light' | 'dark';

export interface UserSettings {
  theme: ThemePreference;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  /** Reduced motion is detected automatically but users can also
   *  force-enable / force-disable it from the SettingsScreen. */
  reducedMotionOverride: 'system' | 'on' | 'off';
  /** Quiet hours - notifications are silenced in this window. */
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // "HH:mm" 24h
  quietHoursEnd?: string;   // "HH:mm" 24h
  /** Show online status to friends. */
  showOnlineStatus: boolean;
  /** Allow friend requests from anyone (vs only friends-of-friends). */
  allowFriendRequests: 'everyone' | 'friends_of_friends';
  /** Auto-pair with previously trusted devices. */
  autoPairKnownDevices: boolean;
  /** Marketing / product updates email. */
  marketingEmails: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  notificationsEnabled: true,
  biometricEnabled: false,
  reducedMotionOverride: 'system',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  showOnlineStatus: true,
  allowFriendRequests: 'everyone',
  autoPairKnownDevices: true,
  marketingEmails: false,
};

// ============================================================================
// Helpers
// ============================================================================

export function themeLabel(theme: ThemePreference): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
    default:
      return 'Automatic';
  }
}

export function friendRequestLabel(
  v: UserSettings['allowFriendRequests']
): string {
  return v === 'everyone' ? 'Everyone' : 'Friends of friends';
}