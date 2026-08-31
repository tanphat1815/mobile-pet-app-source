/**
 * Pairing API
 *
 * REST endpoints for cross-device pairing. Local mock state so the
 * PairingScreen works without a real backend.
 *
 * Endpoints (target):
 *   POST  /pairing/code                    -> PairingCode
 *   POST  /pairing/code/submit             -> SubmitPairingCodeResponse
 *   GET   /pairing/devices                 -> PairedDevice[]
 *   DELETE /pairing/devices/:id            -> { ok: true }
 */

import apiClient from './client';
import { getApiError } from './client';
import {
  PairingCode,
  PairedDevice,
  SubmitPairingCodeInput,
  SubmitPairingCodeResponse,
} from './pairingTypes';

// ============================================================================
// Mock state
// ============================================================================

const PAIRING_TTL_MS = 5 * 60 * 1000; // 5 minutes

let mockCurrentCode: PairingCode | null = null;

function makeMockDevices(): PairedDevice[] {
  const now = Date.now();
  return [
    {
      id: 'dev_current',
      deviceName: 'This phone',
      platform: 'ios',
      pairedAt: now - 30 * 24 * 60 * 60 * 1000,
      lastSeen: now - 2 * 60 * 1000,
      isCurrent: true,
    },
    {
      id: 'dev_ipad',
      deviceName: 'Mochi\'s iPad',
      platform: 'ios',
      pairedAt: now - 12 * 24 * 60 * 60 * 1000,
      lastSeen: now - 4 * 60 * 60 * 1000,
    },
    {
      id: 'dev_web',
      deviceName: 'Chrome (laptop)',
      platform: 'web',
      pairedAt: now - 5 * 24 * 60 * 60 * 1000,
      lastSeen: now - 30 * 60 * 1000,
    },
  ];
}

let mockDevices: PairedDevice[] = makeMockDevices();
let nextDeviceId = 1000;

function generateRandomCode(): string {
  // 6 digits
  let s = '';
  for (let i = 0; i < 6; i += 1) {
    s += String(Math.floor(Math.random() * 10));
  }
  return s;
}

// ============================================================================
// API
// ============================================================================

export async function generatePairingCode(
  deviceName?: string
): Promise<PairingCode> {
  try {
    await apiClient.post('/post', { action: 'generate_pairing_code' });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  // If there's an unexpired code already, reuse it.
  if (
    mockCurrentCode &&
    mockCurrentCode.status === 'pending' &&
    mockCurrentCode.expiresAt > Date.now()
  ) {
    return mockCurrentCode;
  }
  mockCurrentCode = {
    code: generateRandomCode(),
    expiresAt: Date.now() + PAIRING_TTL_MS,
    status: 'pending',
    deviceName,
  };
  return mockCurrentCode;
}

export async function cancelPairingCode(): Promise<{ ok: true }> {
  try {
    await apiClient.post('/post', { action: 'cancel_pairing_code' });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  if (mockCurrentCode) {
    mockCurrentCode = { ...mockCurrentCode, status: 'revoked' };
  }
  return { ok: true };
}

export async function submitPairingCode(
  input: SubmitPairingCodeInput
): Promise<SubmitPairingCodeResponse> {
  try {
    await apiClient.post('/post', { action: 'submit_pairing_code', ...input });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const code = input.code.replace(/\D/g, '');
  if (code.length !== 6) {
    throw new Error('Code must be 6 digits');
  }
  if (!mockCurrentCode) {
    throw new Error('No active pairing code. The other device needs to generate one first.');
  }
  if (mockCurrentCode.expiresAt < Date.now()) {
    mockCurrentCode = { ...mockCurrentCode, status: 'expired' };
    throw new Error('Pairing code has expired. Please generate a new one.');
  }
  if (mockCurrentCode.code !== code) {
    throw new Error('Pairing code is incorrect');
  }
  // Mark confirmed and create the device
  mockCurrentCode = { ...mockCurrentCode, status: 'confirmed' };
  nextDeviceId += 1;
  const device: PairedDevice = {
    id: `dev_${nextDeviceId}`,
    deviceName: input.deviceName,
    platform: input.platform,
    pairedAt: Date.now(),
    lastSeen: Date.now(),
  };
  mockDevices = [device, ...mockDevices];
  return { device };
}

export async function listPairedDevices(): Promise<PairedDevice[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_paired_devices' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockDevices;
}

export async function unpairDevice(deviceId: string): Promise<{ ok: true }> {
  try {
    await apiClient.delete('/delete', {
      params: { action: 'unpair_device', deviceId },
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  mockDevices = mockDevices.filter((d) => d.id !== deviceId);
  return { ok: true };
}

// ============================================================================
// Local helpers (used by realtime events from SyncManager)
// ============================================================================

/** Apply a server-pushed pairing code (from `pairing:code` realtime event). */
export function setCurrentCodeFromRealtime(code: PairingCode): void {
  mockCurrentCode = code;
}

/** Apply a server-pushed confirmation (from `pairing:confirmed` event). */
export function addPairedDeviceFromRealtime(device: PairedDevice): void {
  if (mockDevices.find((d) => d.id === device.id)) return;
  mockDevices = [device, ...mockDevices];
}