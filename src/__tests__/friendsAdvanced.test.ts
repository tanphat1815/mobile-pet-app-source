/**
 * Step 4 — Friends Advanced (Tags + Gifts + Activity) tests.
 *
 * Verify:
 *  - FRIEND_TAGS catalog đầy đủ 6 tags
 *  - getFriendTagMeta lookup
 *  - FRIEND_GIFT_TYPES catalog 6 gifts với price > 0
 *  - getGiftTypeMeta lookup
 *  - updateFriendTags / addFriendTag / removeFriendTag
 *  - sendFriendGift (counter bump)
 *  - acknowledgeGift
 *  - listGiftHistory filter by userId
 *  - listActivityFeed returns sorted
 *  - pushActivity prepends
 */

import { describe, it, expect } from 'vitest';
import {
  FRIEND_TAGS,
  FRIEND_GIFT_TYPES,
  FriendTag,
  FriendGiftType,
  getFriendTagMeta,
  getGiftTypeMeta,
} from '@/api/friendTypes';
import {
  addFriendTag,
  removeFriendTag,
  updateFriendTags,
  listGiftHistory,
  sendFriendGift,
  acknowledgeGift,
  listActivityFeed,
  pushActivity,
  findFriend,
} from '@/api/friends';

describe('FRIEND_TAGS catalog', () => {
  it('declares 6 tags', () => {
    expect(FRIEND_TAGS).toHaveLength(6);
  });

  it('each tag has id, label, icon, tint, textColor', () => {
    for (const tag of FRIEND_TAGS) {
      expect(tag.id).toBeTruthy();
      expect(tag.label).toBeTruthy();
      expect(tag.icon).toBeTruthy();
      expect(tag.tint).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(tag.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('getFriendTagMeta returns matching meta', () => {
    const meta = getFriendTagMeta('best_friend');
    expect(meta?.label).toBe('Best Friend');
    expect(meta?.icon).toBe('⭐');
  });

  it('getFriendTagMeta returns undefined for unknown', () => {
    expect(getFriendTagMeta('unknown' as FriendTag)).toBeUndefined();
  });
});

describe('FRIEND_GIFT_TYPES catalog', () => {
  it('declares 6 gift types', () => {
    expect(FRIEND_GIFT_TYPES).toHaveLength(6);
  });

  it('each gift has price > 0', () => {
    for (const g of FRIEND_GIFT_TYPES) {
      expect(g.price).toBeGreaterThan(0);
    }
  });

  it('cheap to expensive ordering roughly asc', () => {
    const prices = FRIEND_GIFT_TYPES.map((g) => g.price);
    expect(Math.min(...prices)).toBe(20); // cookie
    expect(Math.max(...prices)).toBe(500); // gem
  });

  it('getGiftTypeMeta returns matching meta', () => {
    const meta = getGiftTypeMeta('rose');
    expect(meta?.label).toBe('Hoa Hồng');
    expect(meta?.icon).toBe('🌹');
    expect(meta?.price).toBe(50);
  });
});

describe('tags API (mock)', () => {
  it('addFriendTag appends tag', async () => {
    const friend = findFriend('u_bob'); // u_bob có 'rival'
    expect(friend?.tags).toContain('rival');
    expect(friend?.tags).not.toContain('best_friend');
    const updated = await addFriendTag('u_bob', 'best_friend');
    expect(updated.tags).toContain('best_friend');
  });

  it('addFriendTag is idempotent', async () => {
    const before = findFriend('u_bob')!;
    const tagsBefore = [...(before.tags ?? [])];
    await addFriendTag('u_bob', tagsBefore[0] as FriendTag); // đã có sẵn
    const after = findFriend('u_bob')!;
    expect(after.tags).toEqual(tagsBefore);
  });

  it('removeFriendTag filters out', async () => {
    await addFriendTag('u_alice', 'study_buddy'); // ensure có
    const updated = await removeFriendTag('u_alice', 'best_friend');
    expect(updated.tags).not.toContain('best_friend');
    expect(updated.tags).toContain('study_buddy');
  });

  it('updateFriendTags replaces', async () => {
    const updated = await updateFriendTags('u_carol', ['gaming']);
    expect(updated.tags).toEqual(['gaming']);
  });
});

describe('gifts API (mock)', () => {
  it('sendFriendGift prepends to history', async () => {
    const before = await listGiftHistory();
    const gift = await sendFriendGift({
      toUserId: 'u_dave',
      giftType: 'cookie',
      message: 'for you',
    });
    const after = await listGiftHistory();
    expect(after.length).toBe(before.length + 1);
    expect(after[0].id).toBe(gift.id);
    expect(gift.giftType).toBe('cookie');
    expect(gift.acknowledged).toBe(false);
  });

  it('sendFriendGift bumps giftsReceived counter', async () => {
    const before = findFriend('u_emma');
    const beforeCount = before?.giftsReceived ?? 0;
    await sendFriendGift({ toUserId: 'u_emma', giftType: 'rose' });
    const after = findFriend('u_emma');
    expect(after?.giftsReceived).toBe(beforeCount + 1);
  });

  it('listGiftHistory filter by userId', async () => {
    const all = await listGiftHistory();
    const forAlice = await listGiftHistory('u_alice');
    expect(forAlice.length).toBeGreaterThan(0);
    expect(forAlice.length).toBeLessThanOrEqual(all.length);
    for (const g of forAlice) {
      expect(g.fromUserId === 'u_alice' || g.toUserId === 'u_alice').toBe(true);
    }
  });

  it('acknowledgeGift sets acknowledged=true', async () => {
    // Find 1 unacknowledged gift
    const gifts = await listGiftHistory();
    const target = gifts.find((g) => !g.acknowledged);
    if (target) {
      const updated = await acknowledgeGift(target.id);
      expect(updated.acknowledged).toBe(true);
    }
  });
});

describe('activity API (mock)', () => {
  it('listActivityFeed returns sorted desc by createdAt', async () => {
    const acts = await listActivityFeed();
    if (acts.length >= 2) {
      expect(acts[0].createdAt).toBeGreaterThanOrEqual(acts[1].createdAt);
    }
  });

  it('pushActivity prepends new entry', async () => {
    const before = await listActivityFeed();
    const pushed = pushActivity({
      userId: 'u_test',
      userDisplayName: 'TestUser',
      kind: 'level_up',
      payload: { level: 1 },
      createdAt: Date.now(),
    });
    const after = await listActivityFeed();
    expect(after[0].id).toBe(pushed.id);
    expect(after.length).toBe(before.length + 1);
  });
});
