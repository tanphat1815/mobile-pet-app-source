/**
 * PairingStore (Zustand)
 *
 * Manages:
 *   - The current pairing code (issued by the current device)
 *   - Countdown until expiry
 *   - Paired device list
 *   - Submit state (entering another device's code)
 *
 * Real-time bridge: subscribes to `pairing:code` and `pairing:confirmed`
 * events from the SyncManager.
 */

import { create } from 'zustand';
import {
  generatePairingCode,
  cancelPairingCode,
  submitPairingCode,
  listPairedDevices,
  unpairDevice,
} from '../api/pairing';
import {
  PairingCode,
  PairedDevice,
  DevicePlatform,
} from '../api/pairingTypes';
import { useSyncEvent } from './SyncStore';

// ============================================================================
// Types
// ============================================================================

export type PairingListStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PairingState {
  /** The active pairing code (or null if none) */
  currentCode: PairingCode | null;
  /** Generating / cancelling code */
  codeBusy: boolean;
  /** Paired devices */
  devices: PairedDevice[];
  devicesStatus: PairingListStatus;
  devicesError: string | null;
  /** Submitting another device's code */
  submitting: boolean;
  submitError: string | null;
  /** Last successful submit (so the UI can show "Paired!" confirmation) */
  lastPairedDevice: PairedDevice | null;

  // Actions
  loadDevices: () => Promise<void>;
  generateCode: (deviceName?: string) => Promise<PairingCode>;
  cancelCode: () => Promise<void>;
  submitCode: (code: string, deviceName: string, platform: DevicePlatform) => Promise<PairedDevice>;
  unpair: (deviceId: string) => Promise<void>;
  clearSubmitError: () => void;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const usePairingStore = create<PairingState>((set, get) => ({
  currentCode: null,
  codeBusy: false,
  devices: [],
  devicesStatus: 'idle',
  devicesError: null,
  submitting: false,
  submitError: null,
  lastPairedDevice: null,

  loadDevices: async () => {
    set({ devicesStatus: 'loading', devicesError: null });
    try {
      const devices = await listPairedDevices();
      set({ devices, devicesStatus: 'ready' });
    } catch (err) {
      set({
        devicesStatus: 'error',
        devicesError:
          err instanceof Error ? err.message : 'Failed to load devices',
      });
    }
  },

  generateCode: async (deviceName) => {
    set({ codeBusy: true });
    try {
      const code = await generatePairingCode(deviceName);
      set({ currentCode: code });
      return code;
    } finally {
      set({ codeBusy: false });
    }
  },

  cancelCode: async () => {
    set({ codeBusy: true });
    try {
      await cancelPairingCode();
      set({ currentCode: null });
    } finally {
      set({ codeBusy: false });
    }
  },

  submitCode: async (code, deviceName, platform) => {
    set({ submitting: true, submitError: null });
    try {
      const res = await submitPairingCode({ code, deviceName, platform });
      set((s) => ({
        devices: [res.device, ...s.devices],
        lastPairedDevice: res.device,
      }));
      return res.device;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pairing failed';
      set({ submitError: msg });
      throw err;
    } finally {
      set({ submitting: false });
    }
  },

  unpair: async (deviceId: string) => {
    await unpairDevice(deviceId);
    set({ devices: get().devices.filter((d) => d.id !== deviceId) });
  },

  clearSubmitError: () => set({ submitError: null }),

  reset: () => {
    set({
      currentCode: null,
      codeBusy: false,
      devices: [],
      devicesStatus: 'idle',
      devicesError: null,
      submitting: false,
      submitError: null,
      lastPairedDevice: null,
    });
  },
}));

// ============================================================================
// Realtime bridge
// ============================================================================

/**
 * Subscribes to pairing:code and pairing:confirmed events from the
 * SyncManager and pipes them into the store. Lazy-loads devices on
 * first mount.
 */
export function usePairingRealtimeSync(): void {
  const loadDevices = usePairingStore((s) => s.loadDevices);

  useSyncEvent('pairing:code', (payload) => {
    usePairingStore.setState({
      currentCode: {
        code: payload.pairingCode,
        expiresAt: payload.expiresAt,
        status: 'pending',
      },
    });
  });

  useSyncEvent('pairing:confirmed', (payload) => {
    usePairingStore.setState((s) => ({
      devices: s.devices.find((d) => d.id === payload.deviceId)
        ? s.devices
        : [
            {
              id: payload.deviceId,
              deviceName: 'New device',
              platform: 'ios',
              pairedAt: Date.now(),
              lastSeen: Date.now(),
            },
            ...s.devices,
          ],
    }));
  });

  if (usePairingStore.getState().devicesStatus === 'idle') {
    loadDevices();
  }
}