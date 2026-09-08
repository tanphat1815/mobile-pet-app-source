/**
 * searchHistory.test.ts
 *
 * Step 14 — Vitest unit tests for recents + pinned AsyncStorage helpers.
 * Mocks @react-native-async-storage/async-storage with an in-memory map.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// In-memory AsyncStorage mock installed BEFORE importing the module under test.
const store: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store[k] ?? null,
    setItem: async (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: async (k: string) => {
      delete store[k];
    },
  },
}));

import {
  getPinned,
  getRecents,
  pin,
  unpin,
  togglePin,
  isPinned,
  pushRecent,
  clearPinned,
  clearRecents,
  SEARCH_HISTORY_LIMITS,
} from '../searchHistory';

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
});

describe('recents', () => {
  test('starts empty', async () => {
    expect(await getRecents()).toEqual([]);
  });

  test('pushRecent adds to the head', async () => {
    await pushRecent('Meditation');
    await pushRecent('Friends');
    const recents = await getRecents();
    expect(recents[0]).toBe('Friends');
    expect(recents[1]).toBe('Meditation');
  });

  test('pushRecent dedupes existing entries', async () => {
    await pushRecent('Meditation');
    await pushRecent('Friends');
    await pushRecent('Meditation');
    const recents = await getRecents();
    expect(recents[0]).toBe('Meditation');
    expect(recents).toHaveLength(2);
  });

  test('pushRecent caps at MAX_RECENTS', async () => {
    for (let i = 0; i < SEARCH_HISTORY_LIMITS.MAX_RECENTS + 5; i++) {
      await pushRecent(`id-${i}`);
    }
    const recents = await getRecents();
    expect(recents.length).toBe(SEARCH_HISTORY_LIMITS.MAX_RECENTS);
    // Most recent push should be at index 0
    expect(recents[0]).toBe(`id-${SEARCH_HISTORY_LIMITS.MAX_RECENTS + 4}`);
  });

  test('clearRecents empties the list', async () => {
    await pushRecent('A');
    await clearRecents();
    expect(await getRecents()).toEqual([]);
  });

  test('survives a corrupt JSON value (returns empty array)', async () => {
    store['search:recents'] = '{not json';
    expect(await getRecents()).toEqual([]);
  });
});

describe('pinned', () => {
  test('starts empty', async () => {
    expect(await getPinned()).toEqual([]);
  });

  test('pin adds an id', async () => {
    await pin('A');
    expect(await isPinned('A')).toBe(true);
  });

  test('pin is idempotent', async () => {
    await pin('A');
    await pin('A');
    expect(await getPinned()).toEqual(['A']);
  });

  test('pin caps at MAX_PINNED', async () => {
    for (let i = 0; i < SEARCH_HISTORY_LIMITS.MAX_PINNED + 3; i++) {
      await pin(`id-${i}`);
    }
    const pinned = await getPinned();
    expect(pinned.length).toBe(SEARCH_HISTORY_LIMITS.MAX_PINNED);
  });

  test('unpin removes the id', async () => {
    await pin('A');
    await pin('B');
    await unpin('A');
    expect(await getPinned()).toEqual(['B']);
    expect(await isPinned('A')).toBe(false);
  });

  test('unpin is no-op for unknown id', async () => {
    await unpin('NeverAdded');
    expect(await getPinned()).toEqual([]);
  });

  test('togglePin flips state and returns new value', async () => {
    expect(await togglePin('A')).toBe(true);
    expect(await togglePin('A')).toBe(false);
    expect(await isPinned('A')).toBe(false);
  });

  test('clearPinned empties the list', async () => {
    await pin('A');
    await pin('B');
    await clearPinned();
    expect(await getPinned()).toEqual([]);
  });
});

describe('isolated buckets', () => {
  test('recents and pinned are stored separately', async () => {
    await pushRecent('A');
    await pin('B');
    expect(await getRecents()).toEqual(['A']);
    expect(await getPinned()).toEqual(['B']);
  });
});
