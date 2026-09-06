/**
 * searchHistory.ts
 *
 * Step 14 — Persist recent + pinned SearchableItem ids in AsyncStorage.
 *
 * Schema:
 *   - `search:recents` → JSON array of item ids, max 10, LRU (most recent first)
 *   - `search:pinned`  → JSON array of item ids, max 5, manual user control
 *
 * Both buckets are simple id lists; resolution back to full SearchableItem
 * happens at render time via `searchIndex.byId(id)`. This keeps the
 * serialized payload tiny and resilient to schema changes in the index.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_RECENTS = 'search:recents';
const KEY_PINNED = 'search:pinned';
const MAX_RECENTS = 10;
const MAX_PINNED = 5;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function readArray(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

async function writeArray(key: string, value: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / serialization errors are non-fatal for UX; skip silently.
  }
}

// ---------------------------------------------------------------------------
// Recent items (LRU)
// ---------------------------------------------------------------------------

export async function getRecents(): Promise<string[]> {
  return readArray(KEY_RECENTS);
}

/**
 * Push an id to the top of the recents list.
 * - Dedupes by removing any existing occurrence first.
 * - Caps length at MAX_RECENTS.
 */
export async function pushRecent(id: string): Promise<string[]> {
  const current = await readArray(KEY_RECENTS);
  const filtered = current.filter((x) => x !== id);
  const next = [id, ...filtered].slice(0, MAX_RECENTS);
  await writeArray(KEY_RECENTS, next);
  return next;
}

export async function clearRecents(): Promise<void> {
  await writeArray(KEY_RECENTS, []);
}

// ---------------------------------------------------------------------------
// Pinned items (user-controlled)
// ---------------------------------------------------------------------------

export async function getPinned(): Promise<string[]> {
  return readArray(KEY_PINNED);
}

export async function isPinned(id: string): Promise<boolean> {
  const pinned = await readArray(KEY_PINNED);
  return pinned.includes(id);
}

/** Pin an id (no-op if already pinned or at cap). */
export async function pin(id: string): Promise<string[]> {
  const current = await readArray(KEY_PINNED);
  if (current.includes(id)) return current;
  if (current.length >= MAX_PINNED) return current; // cap reached, silent no-op
  const next = [...current, id];
  await writeArray(KEY_PINNED, next);
  return next;
}

/** Unpin an id. No-op if not currently pinned. */
export async function unpin(id: string): Promise<string[]> {
  const current = await readArray(KEY_PINNED);
  const next = current.filter((x) => x !== id);
  await writeArray(KEY_PINNED, next);
  return next;
}

/** Toggle convenience (returns the new pinned state). */
export async function togglePin(id: string): Promise<boolean> {
  const wasPinned = await isPinned(id);
  if (wasPinned) {
    await unpin(id);
    return false;
  }
  await pin(id);
  return true;
}

export async function clearPinned(): Promise<void> {
  await writeArray(KEY_PINNED, []);
}

// ---------------------------------------------------------------------------
// Constants exported for UI/tests
// ---------------------------------------------------------------------------

export const SEARCH_HISTORY_LIMITS = {
  MAX_RECENTS,
  MAX_PINNED,
} as const;
