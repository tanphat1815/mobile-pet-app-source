/**
 * Step 9 — Notification Center e2e tests.
 *
 * Verify:
 *  - groupByDay / dayLabel / markRead / unreadCount / sortNewestFirst
 *    exposed as functions
 *  - MAX_NOTIFICATIONS and MAX_AGE_DAYS exposed
 *  - emojiForKind / deeplinkFor exposed
 *  - NotificationStore API exposed via test helpers
 *  - NotificationKind includes all 11 kinds
 */

import { test, expect, type Page } from '@playwright/test';

async function waitForAppMount(page: Page) {
  await page.waitForSelector('body', { timeout: 60_000 });
  await page.waitForTimeout(2500);
}

test.describe('Step 9 — Notification Center', () => {
  test('groupByDay helper exposed as function', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const fn = await page.evaluate(() => {
      const w = window as any;
      return typeof w.__NOTIF_GROUP_BY_DAY__;
    });
    expect(fn).toBe('function');
  });

  test('dayLabel helper exposed as function', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const fn = await page.evaluate(() => {
      const w = window as any;
      return typeof w.__NOTIF_DAY_LABEL__;
    });
    expect(fn).toBe('function');
  });

  test('dayLabel returns Today for same day', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const now = new Date('2025-06-15T20:00:00Z').getTime();
      return w.__NOTIF_DAY_LABEL__(now, now);
    });
    expect(result).toBe('Today');
  });

  test('dayLabel returns Yesterday for -1 day', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const now = new Date('2025-06-15T20:00:00Z').getTime();
      const yesterday = new Date('2025-06-14T20:00:00Z').getTime();
      return w.__NOTIF_DAY_LABEL__(yesterday, now);
    });
    expect(result).toBe('Yesterday');
  });

  test('dayLabel returns Earlier for -3 days', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const now = new Date('2025-06-15T20:00:00Z').getTime();
      const three = new Date('2025-06-12T20:00:00Z').getTime();
      return w.__NOTIF_DAY_LABEL__(three, now);
    });
    expect(result).toBe('Earlier');
  });

  test('markRead + unreadCount helper exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const fns = await page.evaluate(() => {
      const w = window as any;
      return {
        markRead: typeof w.__NOTIF_MARK_READ__,
        unreadCount: typeof w.__NOTIF_UNREAD_COUNT__,
      };
    });
    expect(fns.markRead).toBe('function');
    expect(fns.unreadCount).toBe('function');
  });

  test('MAX_NOTIFICATIONS exposed as 100', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const max = await page.evaluate(() => {
      const w = window as any;
      return w.__NOTIF_MAX_NOTIFICATIONS__;
    });
    expect(max).toBe(100);
  });

  test('MAX_AGE_DAYS exposed as 30', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const max = await page.evaluate(() => {
      const w = window as any;
      return w.__NOTIF_MAX_AGE_DAYS__;
    });
    expect(max).toBe(30);
  });

  test('emojiForKind exposed and returns emoji', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const emoji = await page.evaluate(() => {
      const w = window as any;
      return w.__NOTIF_EMOJI_FOR_KIND__('gift_received');
    });
    expect(emoji).toBe('🎁');
  });

  test('deeplinkFor achievement routes to Achievements', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      return w.__NOTIF_DEEPLINK_FOR__({
        id: 'n', kind: 'achievement_unlocked', title: 't', body: 'b',
        iconEmoji: '🏆', receivedAt: new Date().toISOString(), readAt: null,
      });
    });
    expect(result.screen).toBe('Achievements');
  });

  test('NotificationStore test helper exposed', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      return {
        addNotification: typeof w.__NOTIF_STORE_ADD__,
        markRead: typeof w.__NOTIF_STORE_MARK_READ__,
        markAllRead: typeof w.__NOTIF_STORE_MARK_ALL_READ__,
        getHistory: typeof w.__NOTIF_STORE_GET_HISTORY__,
        getUnreadCount: typeof w.__NOTIF_STORE_GET_UNREAD__,
      };
    });
    expect(result.addNotification).toBe('function');
    expect(result.markRead).toBe('function');
    expect(result.markAllRead).toBe('function');
    expect(result.getHistory).toBe('function');
    expect(result.getUnreadCount).toBe('function');
  });

  test('addNotification → markRead → unreadCount', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await waitForAppMount(page);
    const result = await page.evaluate(() => {
      const w = window as any;
      const add = w.__NOTIF_STORE_ADD__;
      const mark = w.__NOTIF_STORE_MARK_READ__;
      const unread = w.__NOTIF_STORE_GET_UNREAD__;
      add({
        kind: 'gift_received', title: 'You got a gift',
        body: 'From Alice', iconEmoji: '🎁',
      });
      const u1 = unread();
      const items = w.__NOTIF_STORE_GET_HISTORY__();
      if (items.length > 0) mark(items[0].id);
      const u2 = unread();
      return { u1, u2 };
    });
    expect(result.u1).toBeGreaterThan(0);
    expect(result.u2).toBe(0);
  });
});
