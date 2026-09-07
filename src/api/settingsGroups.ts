/**
 * SETTINGS_GROUPS — the structured tree used by the SettingsScreen to
 * render sections + rows + supporting search/filter logic.
 *
 * Step 11 — xem docs/steps/step-11-settings-restructure.md.
 */

import {
  filterRows,
  matchCount,
  totalRowCount,
  buildSearchIndex,
  type SettingGroupMeta,
} from './settingsCategories';

/**
 * The canonical settings tree. Mirror the structure used by desktop
 * `settings.js` but mobile-adapted (4 groups instead of 24 categories).
 */
export const SETTINGS_GROUPS: SettingGroupMeta[] = [
  {
    id: 'GENERAL',
    label: 'General',
    sections: [
      {
        id: 'account',
        title: 'Account',
        rows: [
          {
            id: 'account-profile',
            sectionId: 'account',
            icon: '👤',
            label: 'Profile',
            description: 'Display name, avatar',
            kind: 'navigation',
          },
          {
            id: 'account-signout',
            sectionId: 'account',
            icon: '🚪',
            label: 'Sign out',
            keywords: ['logout', 'exit'],
            kind: 'destructive',
          },
        ],
      },
      {
        id: 'appearance',
        title: 'Appearance',
        rows: [
          {
            id: 'appearance-theme',
            sectionId: 'appearance',
            icon: '🎨',
            label: 'Theme',
            description: 'Light / Dark / Auto',
            keywords: ['light', 'dark', 'auto'],
            kind: 'value',
          },
          {
            id: 'appearance-app-theme',
            sectionId: 'appearance',
            icon: '🎭',
            label: 'App theme',
            description: 'Seasonal & premium themes',
            keywords: ['seasonal', 'premium', 'cute', 'pastel'],
            kind: 'value',
          },
          {
            id: 'appearance-reduce-motion',
            sectionId: 'appearance',
            icon: '♿',
            label: 'Reduce motion',
            description: 'Limit animations across the app',
            kind: 'toggle',
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Notifications',
        rows: [
          {
            id: 'notifications-push',
            sectionId: 'notifications',
            icon: '🔔',
            label: 'Push notifications',
            keywords: ['alert', 'badge'],
            kind: 'toggle',
          },
          {
            id: 'notifications-quiet-hours',
            sectionId: 'notifications',
            icon: '🌙',
            label: 'Quiet hours',
            description: 'Silence notifications in a window',
            keywords: ['schedule', 'silent', 'do not disturb'],
            kind: 'toggle',
          },
          {
            id: 'notifications-marketing',
            sectionId: 'notifications',
            icon: '📧',
            label: 'Product updates',
            description: 'Occasional product announcements',
            keywords: ['email', 'marketing'],
            kind: 'toggle',
          },
        ],
      },
    ],
  },
  {
    id: 'PET',
    label: 'Pet',
    sections: [
      {
        id: 'pet-settings',
        title: 'Pet Settings',
        rows: [
          {
            id: 'pet-actions-info',
            sectionId: 'pet-settings',
            icon: '🩺',
            label: 'Care actions',
            description: 'Available interactions',
            keywords: ['feed', 'play', 'sleep', 'pet', 'care'],
            kind: 'value',
          },
          {
            id: 'pet-cooldowns',
            sectionId: 'pet-settings',
            icon: '⏱',
            label: 'Action cooldowns',
            description: 'Bath (8h), Vitamin (6h)',
            keywords: ['bath', 'medicine', 'vitamin', 'cooldown'],
            kind: 'value',
          },
        ],
      },
      {
        id: 'care-items',
        title: 'Care & Items',
        rows: [
          {
            id: 'care-cleanliness',
            sectionId: 'care-items',
            icon: '🛁',
            label: 'Cleanliness',
            description: 'Wash your pet regularly',
            kind: 'value',
          },
          {
            id: 'care-health',
            sectionId: 'care-items',
            icon: '💊',
            label: 'Health',
            description: 'Use medicine when sick',
            kind: 'value',
          },
        ],
      },
    ],
  },
  {
    id: 'SOCIAL',
    label: 'Social',
    sections: [
      {
        id: 'privacy',
        title: 'Privacy & Security',
        rows: [
          {
            id: 'privacy-biometric',
            sectionId: 'privacy',
            icon: '🔒',
            label: 'Biometric login',
            description: 'Use Face ID / Touch ID',
            kind: 'toggle',
          },
          {
            id: 'privacy-online-status',
            sectionId: 'privacy',
            icon: '🟢',
            label: 'Show online status',
            description: 'Friends can see when you are active',
            kind: 'toggle',
          },
          {
            id: 'privacy-friend-requests',
            sectionId: 'privacy',
            icon: '🤝',
            label: 'Friend requests from',
            kind: 'value',
          },
          {
            id: 'privacy-auto-pair',
            sectionId: 'privacy',
            icon: '🔗',
            label: 'Auto-pair known devices',
            description: 'Skip pairing on trusted devices',
            kind: 'toggle',
          },
        ],
      },
      {
        id: 'pairing',
        title: 'Pairing',
        rows: [
          {
            id: 'social-pairing',
            sectionId: 'pairing',
            icon: '🔗',
            label: 'Manage devices',
            description: 'Pair mobile and desktop',
            keywords: ['pair', 'qr', 'code'],
            kind: 'navigation',
          },
        ],
      },
      {
        id: 'friends',
        title: 'Friends',
        rows: [
          {
            id: 'social-friends',
            sectionId: 'friends',
            icon: '👥',
            label: 'Friends list',
            description: 'Add, invite, manage friends',
            keywords: ['add friend', 'invite', 'unfriend'],
            kind: 'navigation',
          },
        ],
      },
    ],
  },
  {
    id: 'ADVANCED',
    label: 'Advanced',
    sections: [
      {
        id: 'accessibility',
        title: 'Accessibility',
        rows: [
          {
            id: 'accessibility-reduced-motion',
            sectionId: 'accessibility',
            icon: '♿',
            label: 'Reduce motion',
            keywords: ['motion', 'animation'],
            kind: 'toggle',
          },
          {
            id: 'accessibility-haptics',
            sectionId: 'accessibility',
            icon: '📳',
            label: 'Haptics',
            description: 'Vibration feedback intensity',
            kind: 'value',
          },
        ],
      },
      {
        id: 'about',
        title: 'About',
        rows: [
          {
            id: 'about-version',
            sectionId: 'about',
            icon: '📦',
            label: 'Version',
            kind: 'value',
          },
          {
            id: 'about-platform',
            sectionId: 'about',
            icon: '📱',
            label: 'Platform',
            kind: 'value',
          },
          {
            id: 'about-licenses',
            sectionId: 'about',
            icon: '🌐',
            label: 'Open source licenses',
            kind: 'action',
          },
        ],
      },
    ],
  },
];

// ============================================================================
// Dev expose (Step 11) — e2e tests
// ============================================================================
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__SETTINGS_GROUPS__ = SETTINGS_GROUPS;
  (globalThis as any).__SETTINGS_GROUP_COUNT__ = SETTINGS_GROUPS.length;
  (globalThis as any).__SETTINGS_GROUP_IDS__ = SETTINGS_GROUPS.map((g) => g.id);
  // Bind SETTINGS_GROUPS so the e2e test can call
  // __SETTINGS_FILTER__('theme') without re-passing the groups.
  (globalThis as any).__SETTINGS_FILTER__ = (q: string) =>
    filterRows(SETTINGS_GROUPS, q);
  (globalThis as any).__SETTINGS_MATCH_COUNT__ = (q: string) =>
    matchCount(SETTINGS_GROUPS, q);
  (globalThis as any).__SETTINGS_TOTAL_ROW_COUNT__ = totalRowCount(SETTINGS_GROUPS);
  (globalThis as any).__SETTINGS_SEARCH_INDEX_SIZE__ =
    buildSearchIndex(SETTINGS_GROUPS).size;
  if (typeof window !== 'undefined') {
    (window as any).__SETTINGS_GROUPS__ = (globalThis as any).__SETTINGS_GROUPS__;
    (window as any).__SETTINGS_GROUP_COUNT__ = (globalThis as any).__SETTINGS_GROUP_COUNT__;
    (window as any).__SETTINGS_GROUP_IDS__ = (globalThis as any).__SETTINGS_GROUP_IDS__;
    (window as any).__SETTINGS_FILTER__ = (globalThis as any).__SETTINGS_FILTER__;
    (window as any).__SETTINGS_MATCH_COUNT__ = (globalThis as any).__SETTINGS_MATCH_COUNT__;
    (window as any).__SETTINGS_TOTAL_ROW_COUNT__ = (globalThis as any).__SETTINGS_TOTAL_ROW_COUNT__;
    (window as any).__SETTINGS_SEARCH_INDEX_SIZE__ = (globalThis as any).__SETTINGS_SEARCH_INDEX_SIZE__;
  }
}
