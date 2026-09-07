/**
 * Notification Center API
 *
 * Helpers for grouping notifications by day and computing deeplinks.
 *
 * Step 9 — xem docs/steps/step-09-notification-center.md.
 */

import {
  NotificationCategory,
  NotificationData,
} from './notificationTypes';

// ============================================================================
// NotificationKind — Step 9 specific kinds (UI grouping)
// ============================================================================

/**
 * UI-facing notification kind. More granular than NotificationCategory
 * (which is server-facing) but similar conceptually.
 */
export type NotificationKind =
  | 'friend_request'
  | 'friend_accept'
  | 'gift_received'
  | 'achievement_unlocked'
  | 'quest_complete'
  | 'pet_levelup'
  | 'pet_hungry'
  | 'pet_sad'
  | 'chat_message'
  | 'pairing_request'
  | 'system_announcement';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  iconEmoji: string;
  /** ISO timestamp string */
  receivedAt: string;
  /** ISO timestamp string or null if unread */
  readAt: string | null;
  /** Deep-link payload (server-provided data + a few extras) */
  payload?: Record<string, unknown>;
}

// ============================================================================
// Day grouping
// ============================================================================

export interface NotificationGroup {
  label: string;
  /** YYYY-MM-DD bucket key (for sort stability) */
  key: string;
  items: NotificationItem[];
}

export type DayGroupLabel = 'Today' | 'Yesterday' | 'Earlier';

export function dayBucket(input: Date | string | number): string {
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  // Use UTC date components so day buckets are timezone-agnostic.
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayLabel(input: Date | string | number, now: Date | string | number = new Date()): DayGroupLabel {
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  const nowDate = typeof now === 'string' || typeof now === 'number' ? new Date(now) : now;
  // Use UTC day boundaries so the result is timezone-agnostic.
  const todayUtc = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate()
  );
  const targetUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate()
  );
  const diffMs = todayUtc - targetUtc;
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return 'Earlier';
}

/**
 * Group notifications into Today / Yesterday / Earlier buckets. Sort
 * newest-first within each bucket.
 */
export function groupByDay(
  items: NotificationItem[],
  now = new Date()
): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>();
  for (const item of items) {
    const date = new Date(item.receivedAt);
    const key = dayBucket(date);
    const label = dayLabel(date, now);
    if (!groups.has(key)) {
      groups.set(key, { key, label, items: [] });
    }
    groups.get(key)!.items.push(item);
  }
  // Sort items within each group newest-first
  for (const g of groups.values()) {
    g.items.sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }
  // Sort groups newest-first by key
  return Array.from(groups.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

// ============================================================================
// Unread count + mark read
// ============================================================================

export function unreadCount(items: NotificationItem[]): number {
  return items.filter((n) => n.readAt === null).length;
}

export function markRead(
  items: NotificationItem[],
  id: string,
  when: string = new Date().toISOString()
): NotificationItem[] {
  return items.map((n) => (n.id === id ? { ...n, readAt: when } : n));
}

export function markAllRead(
  items: NotificationItem[],
  when: string = new Date().toISOString()
): NotificationItem[] {
  return items.map((n) => (n.readAt === null ? { ...n, readAt: when } : n));
}

/**
 * Sort items newest-first. Convenience used after insertion.
 */
export function sortNewestFirst(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
}

// ============================================================================
// Cap retention (debug §3 — limit 100, auto-clean >30 days)
// ============================================================================

export const MAX_NOTIFICATIONS = 100;
export const MAX_AGE_DAYS = 30;

export function trimHistory(items: NotificationItem[], now = new Date()): NotificationItem[] {
  const cutoff = now.getTime() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const filtered = items.filter((n) => new Date(n.receivedAt).getTime() >= cutoff);
  // Keep newest MAX_NOTIFICATIONS
  return sortNewestFirst(filtered).slice(0, MAX_NOTIFICATIONS);
}

// ============================================================================
// Deeplink from notification
// ============================================================================

/**
 * Convert a NotificationKind (and payload) into a navigation target.
 * Returns the target screen name + optional params.
 */
export function deeplinkFor(item: NotificationItem): {
  screen: string;
  params?: Record<string, unknown>;
} {
  const payload = (item.payload ?? {}) as { deeplink?: string };
  if (payload.deeplink) {
    return { screen: payload.deeplink };
  }
  switch (item.kind) {
    case 'friend_request':
    case 'friend_accept':
      return { screen: 'Friends' };
    case 'gift_received':
      return { screen: 'Friends' };
    case 'achievement_unlocked':
      return { screen: 'Achievements' };
    case 'quest_complete':
      return { screen: 'Quests' };
    case 'pet_levelup':
    case 'pet_hungry':
    case 'pet_sad':
      return { screen: 'Home' };
    case 'chat_message':
      return { screen: 'Chat' };
    case 'pairing_request':
      return { screen: 'Pairing' };
    case 'system_announcement':
    default:
      return { screen: 'Home' };
  }
}

// ============================================================================
// Conversion from server NotificationCategory → UI NotificationKind
// ============================================================================

/**
 * Best-effort mapping when bridging a server push notification into
 * the in-app notification center. The server payload's `reason`
 * field picks a more specific kind for `pet` category.
 */
export function kindFromCategory(
  category: NotificationCategory,
  payload?: NotificationData
): NotificationKind {
  if (category === 'pet' && payload && 'reason' in payload) {
    if (payload.reason === 'levelup') return 'pet_levelup';
    if (payload.reason === 'hungry') return 'pet_hungry';
    if (payload.reason === 'sad') return 'pet_sad';
  }
  switch (category) {
    case 'pet':
      return 'pet_levelup';
    case 'chat':
      return 'chat_message';
    case 'friend':
      return 'friend_request';
    case 'achievement':
      return 'achievement_unlocked';
    case 'quest':
      return 'quest_complete';
    case 'pairing':
      return 'pairing_request';
    case 'system':
    default:
      return 'system_announcement';
  }
}

export function emojiForKind(kind: NotificationKind): string {
  switch (kind) {
    case 'friend_request':       return '👋';
    case 'friend_accept':        return '🤝';
    case 'gift_received':        return '🎁';
    case 'achievement_unlocked': return '🏆';
    case 'quest_complete':       return '⭐';
    case 'pet_levelup':          return '🐾';
    case 'pet_hungry':           return '🍖';
    case 'pet_sad':              return '😢';
    case 'chat_message':         return '💬';
    case 'pairing_request':      return '🔗';
    case 'system_announcement':
    default:                     return '📣';
  }
}

// ============================================================================
// Dev expose (Step 9) — e2e tests
// ============================================================================
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__NOTIF_GROUP_BY_DAY__ = groupByDay;
  (globalThis as any).__NOTIF_DAY_LABEL__ = dayLabel;
  (globalThis as any).__NOTIF_MARK_READ__ = markRead;
  (globalThis as any).__NOTIF_MARK_ALL_READ__ = markAllRead;
  (globalThis as any).__NOTIF_UNREAD_COUNT__ = unreadCount;
  (globalThis as any).__NOTIF_SORT_NEWEST__ = sortNewestFirst;
  (globalThis as any).__NOTIF_TRIM__ = trimHistory;
  (globalThis as any).__NOTIF_DEEPLINK_FOR__ = deeplinkFor;
  (globalThis as any).__NOTIF_EMOJI_FOR_KIND__ = emojiForKind;
  (globalThis as any).__NOTIF_KIND_FROM_CATEGORY__ = kindFromCategory;
  (globalThis as any).__NOTIF_MAX_NOTIFICATIONS__ = MAX_NOTIFICATIONS;
  (globalThis as any).__NOTIF_MAX_AGE_DAYS__ = MAX_AGE_DAYS;
  if (typeof window !== 'undefined') {
    (window as any).__NOTIF_GROUP_BY_DAY__ = groupByDay;
    (window as any).__NOTIF_DAY_LABEL__ = dayLabel;
    (window as any).__NOTIF_MARK_READ__ = markRead;
    (window as any).__NOTIF_MARK_ALL_READ__ = markAllRead;
    (window as any).__NOTIF_UNREAD_COUNT__ = unreadCount;
    (window as any).__NOTIF_SORT_NEWEST__ = sortNewestFirst;
    (window as any).__NOTIF_TRIM__ = trimHistory;
    (window as any).__NOTIF_DEEPLINK_FOR__ = deeplinkFor;
    (window as any).__NOTIF_EMOJI_FOR_KIND__ = emojiForKind;
    (window as any).__NOTIF_KIND_FROM_CATEGORY__ = kindFromCategory;
    (window as any).__NOTIF_MAX_NOTIFICATIONS__ = MAX_NOTIFICATIONS;
    (window as any).__NOTIF_MAX_AGE_DAYS__ = MAX_AGE_DAYS;
  }
}
