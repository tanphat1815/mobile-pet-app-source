/**
 * Device ID
 *
 * Returns a stable device identifier per app install. Stored in
 * AsyncStorage on first call so it survives app restarts.
 */

import { storage, StorageKeys } from './storage';

function generateId(): string {
  // RFC4122-ish v4 using crypto where available, fallback to Math.random
  const g = (n: number) => {
    const bytes = new Uint8Array(n);
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  };
  return `${g(4)}-${g(2)}-${g(2)}-${g(2)}-${g(6)}`;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await storage.getString(StorageKeys.DeviceId);
  if (existing) return existing;
  const id = generateId();
  await storage.set(StorageKeys.DeviceId, id);
  return id;
}
