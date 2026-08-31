/**
 * useBiometricAuth
 *
 * Hook that wraps the biometric service. Probes capability once on
 * mount, exposes a typed `authenticate()` action, and tracks the
 * last error.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getBiometricCapability,
  authenticateBiometric,
  invalidateBiometricCapability,
} from '../api/biometric';
import {
  BiometricCapability,
  BiometricAuthResult,
} from '../api/biometricTypes';
import { hapticSuccess, hapticError } from '../utils/haptics';

export interface UseBiometricAuthOptions {
  /** If true, automatically probe capability on mount. Default true. */
  probe?: boolean;
  /** Play haptics on success/failure. Default true. */
  haptics?: boolean;
}

export interface UseBiometricAuth {
  /** Capability probe result; null while loading */
  capability: BiometricCapability | null;
  /** Whether a prompt is currently shown */
  authenticating: boolean;
  /** The last authentication result; null until first call */
  lastResult: BiometricAuthResult | null;
  /** Re-probe capability (e.g. after a settings change) */
  refresh: () => Promise<void>;
  /** Show the system biometric prompt */
  authenticate: (reason?: string) => Promise<BiometricAuthResult>;
}

export function useBiometricAuth(
  options: UseBiometricAuthOptions = {}
): UseBiometricAuth {
  const { probe = true, haptics = true } = options;

  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [authenticating, setAuthenticating] = useState(false);
  const [lastResult, setLastResult] = useState<BiometricAuthResult | null>(null);

  // Keep a ref so the stable authenticate callback always sees the
  // current capability without re-creating itself.
  const capRef = useRef<BiometricCapability | null>(null);

  const refresh = useCallback(async () => {
    invalidateBiometricCapability();
    const cap = await getBiometricCapability();
    capRef.current = cap;
    setCapability(cap);
  }, []);

  useEffect(() => {
    if (probe) refresh();
  }, [probe, refresh]);

  const authenticate = useCallback(
    async (reason?: string): Promise<BiometricAuthResult> => {
      setAuthenticating(true);
      try {
        const cap = capRef.current ?? (await getBiometricCapability());
        if (!cap) {
          const res: BiometricAuthResult = {
            success: false,
            cancelled: false,
            error: 'Capability not yet known',
          };
          setLastResult(res);
          return res;
        }
        const res = await authenticateBiometric(reason);
        setLastResult(res);
        if (res.success && haptics) hapticSuccess();
        if (!res.success && !res.cancelled && haptics) hapticError();
        return res;
      } finally {
        setAuthenticating(false);
      }
    },
    [haptics]
  );

  return { capability, authenticating, lastResult, refresh, authenticate };
}