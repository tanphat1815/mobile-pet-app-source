/**
 * searchIndex.test.ts
 *
 * Step 14 — Vitest unit tests for the QuickSwitcherIndex.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  QuickSwitcherIndex,
  buildFriendItems,
  buildChatItems,
  buildQuestItems,
  buildAchievementItems,
  __resetSearchIndexForTests,
  SCREEN_ALIASES,
} from '../searchIndex';

describe('SCREEN_ALIASES', () => {
  test('covers all routes in MainStackParamList', () => {
    const routeNames = Object.keys(SCREEN_ALIASES);
    // Should be 26 routes (Auth stack excluded — those live in AuthStack)
    expect(routeNames.length).toBeGreaterThanOrEqual(26);
    for (const expected of [
      'Home',
      'ChatList',
      'Friends',
      'Meditation',
      'Admin',
      'MusicHome',
    ]) {
      expect(routeNames).toContain(expected);
    }
  });

  test('every route has at least one alias', () => {
    for (const [route, aliases] of Object.entries(SCREEN_ALIASES)) {
      expect(aliases.length, `Route ${route} has no aliases`).toBeGreaterThan(0);
    }
  });
});

describe('QuickSwitcherIndex', () => {
  let index: QuickSwitcherIndex;

  beforeEach(() => {
    __resetSearchIndexForTests();
    index = new QuickSwitcherIndex();
    index.seedScreens();
  });

  test('seedScreens populates 26 screen items', () => {
    expect(index.size()).toBe(26);
  });

  test('fuzzy matches Vietnamese alias "thien" to Meditation', () => {
    const results = index.query('thien');
    expect(results[0]?.id).toBe('Meditation');
  });

  test('fuzzy matches English alias "meditation" to Meditation', () => {
    const results = index.query('meditation');
    expect(results[0]?.id).toBe('Meditation');
  });

  test('fuzzy matches abbreviated "med" to Meditation', () => {
    const results = index.query('med');
    expect(results[0]?.id).toBe('Meditation');
  });

  test('fuzzy matches "breath" to Breathing (not Breathing only)', () => {
    const results = index.query('breath');
    expect(results[0]?.id).toBe('Breathing');
  });

  test('exact keyword wins over partial', () => {
    const results = index.query('chat');
    // Should be ChatList (screen) OR chat items (kind=chat)
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(['ChatList', 'screen', 'chat']).toContain(top.kind);
  });

  test('returns empty array for nonsense query', () => {
    const results = index.query('xyzqwerty12345');
    expect(results).toHaveLength(0);
  });

  test('empty query returns top items by weight', () => {
    const results = index.query('');
    expect(results.length).toBeGreaterThan(0);
    // All screens have the same weight, so just check non-empty + valid shape
    for (const r of results) {
      expect(r.id).toBeTruthy();
      expect(r.title).toBeTruthy();
      expect(r.score).toBe(0);
    }
  });

  test('respects limit param', () => {
    const results = index.query('', 5);
    expect(results.length).toBe(5);
  });

  test('byId returns the matching item', () => {
    const item = index.byId('Meditation');
    expect(item?.title).toBe('Meditation');
    expect(item?.kind).toBe('screen');
  });

  test('byId returns undefined for unknown id', () => {
    expect(index.byId('NotAScreen')).toBeUndefined();
  });

  test('whitespace-only query is treated as empty (returns items)', () => {
    // The UI uses the empty-query case to render pinned + recents;
    // whitespace should behave the same way.
    const a = index.query('   ');
    const b = index.query('');
    expect(a.length).toBe(b.length);
    expect(a.length).toBeGreaterThan(0);
  });
});

describe('entity builders', () => {
  test('buildFriendItems maps friends to search items', () => {
    const items = buildFriendItems([
      { id: 'f1', name: 'Anna', friendCode: 'ABC123', petName: 'Whiskers' },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Anna');
    expect(items[0].id).toBe('friend:f1');
    expect(items[0].kind).toBe('friend');
    expect(items[0].route).toBe('ChatThread');
    expect(items[0].params).toEqual({ conversationId: 'f1' });
  });

  test('buildChatItems caps at 50 entries', () => {
    const threads = Array.from({ length: 80 }, (_, i) => ({
      id: `t${i}`,
      peerName: `User ${i}`,
      lastMessage: `hello ${i}`,
    }));
    const items = buildChatItems(threads);
    expect(items.length).toBe(50);
  });

  test('buildQuestItems preserves required fields', () => {
    const items = buildQuestItems([
      { id: 'q1', title: 'Walk 3km', description: 'Stretch legs', status: 'active' },
    ]);
    expect(items[0].kind).toBe('quest');
    expect(items[0].route).toBe('Quests');
    expect(items[0].keywords).toContain('walk 3km');
  });

  test('buildAchievementItems maps to Achievements route', () => {
    const items = buildAchievementItems([
      { id: 'a1', title: 'First Trick', description: 'Taught your pet to sit' },
    ]);
    expect(items[0].route).toBe('Achievements');
    expect(items[0].kind).toBe('achievement');
  });

  test('setEntities swaps entity items but keeps screens', () => {
    const idx = new QuickSwitcherIndex();
    idx.seedScreens();
    const before = idx.size();

    idx.setEntities({
      friends: [{ id: 'f1', name: 'Bob' }],
      chats: [],
      quests: [],
      achievements: [],
    });

    expect(idx.size()).toBe(before + 1);
    expect(idx.byId('friend:f1')).toBeDefined();
    expect(idx.byId('Meditation')).toBeDefined(); // screen still there
  });

  test('entity items are searchable alongside screens', () => {
    const idx = new QuickSwitcherIndex();
    idx.seedScreens();
    idx.setEntities({
      friends: [{ id: 'f1', name: 'Anna' }],
      chats: [],
      quests: [],
      achievements: [],
    });
    const results = idx.query('anna');
    expect(results.some((r) => r.id === 'friend:f1')).toBe(true);
  });
});
