/**
 * Pairing Domain Types
 *
 * Cross-device pairing: one device shows a 6-digit code, the other
 * enters it. Once accepted, both devices appear in each other's
 * "Paired devices" list and can share pet state.
 */

export type DevicePlatform = 'ios' | 'android' | 'web';

export type PairingStatus = 'pending' | 'confirmed' | 'expired' | 'revoked';

/** A pairing code issued by one device for another to enter. */
export interface PairingCode {
  code: string;
  /** Server-side expiry (ms since epoch) */
  expiresAt: number;
  /** Status of this code (most often 'pending') */
  status: PairingStatus;
  /** Optional friendly name (e.g. "Mochi's iPad") */
  deviceName?: string;
}

/** A successfully paired device. */
export interface PairedDevice {
  id: string;
  deviceName: string;
  platform: DevicePlatform;
  /** When the pairing was confirmed */
  pairedAt: number;
  /** Last activity (heartbeat) from this device */
  lastSeen?: number;
  /** Is this the device we're currently running on? */
  isCurrent?: boolean;
}

export interface SubmitPairingCodeInput {
  code: string;
  deviceName: string;
  platform: DevicePlatform;
}

export interface SubmitPairingCodeResponse {
  device: PairedDevice;
}

// ============================================================================
// Helpers
// ============================================================================

/** Format a pairing code with a hyphen in the middle: 123-456. */
export function formatPairingCode(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length !== 6) return code;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

/** Strip non-digits and clamp to 6 chars. Used for input validation. */
export function normalizePairingCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

/** Seconds remaining until expiry (negative if expired). */
export function secondsUntilExpiry(expiresAt: number, now = Date.now()): number {
  return Math.max(0, Math.floor((expiresAt - now) / 1000));
}

/** Format remaining seconds as MM:SS. */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}