/**
 * Biometric Service
 *
 * Thin wrapper over `expo-local-authentication`. Falls back to
 * "not available" on platforms where the module isn't supported
 * (web, simulator without biometrics).
 *
 * The hook (useBiometricAuth) and any direct callers should use
 * this rather than importing expo-local-authentication directly.
 */

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  BiometricCapability,
  BiometricAuthResult,
  BiometryType,
  BiometricLevel,
} from './biometricTypes';

let cachedCapability: BiometricCapability | null = null;

/** Map the SDK's SecurityLevel enum into our simpler levels. */
function mapLevel(level: LocalAuthentication.SecurityLevel | undefined): BiometricLevel {
  if (level === undefined) return 'none';
  // SDK may export SecurityLevel.BIOMETRIC_STRONG / WEAK / NONE
  if (level === LocalAuthentication.SecurityLevel?.BIOMETRIC_STRONG) return 'strong';
  if (level === LocalAuthentication.SecurityLevel?.BIOMETRIC_WEAK) return 'weak';
  if (level === LocalAuthentication.SecurityLevel?.NONE) return 'none';
  return 'none';
}

/** Map the SDK's AuthenticationType enum into our BiometryType. */
function mapType(type: number | undefined): BiometryType {
  if (type === undefined) return 'None';
  switch (type) {
    case LocalAuthentication.AuthenticationType?.FINGERPRINT:
      return 'Fingerprint';
    case LocalAuthentication.AuthenticationType?.FACIAL_RECOGNITION:
      return 'FaceID';
    case LocalAuthentication.AuthenticationType?.IRIS:
      return 'Iris';
    default:
      return 'None';
  }
}

/**
 * Probe the device for biometric capability. The result is cached
 * for the lifetime of the JS context; callers should rely on the
 * `invalidateBiometricCapability` helper if state may have changed
 * (e.g. user enrolled in Settings).
 */
export async function getBiometricCapability(): Promise<BiometricCapability> {
  if (cachedCapability) return cachedCapability;
  if (Platform.OS === 'web') {
    cachedCapability = {
      isAvailable: false,
      biometryType: 'None',
      level: 'none',
      isEnrolled: false,
    };
    return cachedCapability;
  }
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = compatible
      ? await LocalAuthentication.supportedAuthenticationTypesAsync()
      : [];
    const type = types[0] as number | undefined;
    const biometryType = mapType(type);
    let level: BiometricLevel = 'none';
    if (compatible && enrolled) {
      const secLevel = await LocalAuthentication.getEnrolledLevelAsync();
      level = mapLevel(secLevel);
    }
    cachedCapability = {
      isAvailable: compatible && enrolled,
      biometryType,
      level,
      isEnrolled: enrolled,
    };
  } catch {
    cachedCapability = {
      isAvailable: false,
      biometryType: 'None',
      level: 'none',
      isEnrolled: false,
    };
  }
  return cachedCapability;
}

export function invalidateBiometricCapability(): void {
  cachedCapability = null;
}

/**
 * Show the system biometric prompt. Falls back gracefully:
 *   - if not available: returns { success: false, cancelled: false, error: ... }
 *   - if user cancels: returns { success: false, cancelled: true }
 *   - on auth error: returns { success: false, cancelled: false, error: ... }
 */
export async function authenticateBiometric(
  reason = 'Sign in to your pet app'
): Promise<BiometricAuthResult> {
  const cap = await getBiometricCapability();
  if (!cap.isAvailable) {
    return {
      success: false,
      cancelled: false,
      error: 'Biometric authentication is not available on this device.',
    };
  }
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Use password',
      disableDeviceFallback: false,
    });
    if (result.success) return { success: true, cancelled: false };
    const err = (result as { error?: string }).error;
    if (err === 'user_cancel' || err === 'app_cancel' || err === 'system_cancel') {
      return { success: false, cancelled: true };
    }
    return { success: false, cancelled: false, error: err ?? 'Unknown error' };
  } catch (e) {
    return {
      success: false,
      cancelled: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

/** A friendly label for the biometric type, e.g. "Face ID" / "Touch ID". */
export function biometryLabel(biometryType: BiometryType): string {
  switch (biometryType) {
    case 'FaceID':
      return 'Face ID';
    case 'TouchID':
      return 'Touch ID';
    case 'Fingerprint':
      return 'Fingerprint';
    case 'Iris':
      return 'Iris';
    case 'OpticID':
      return 'Optic ID';
    case 'None':
    default:
      return 'Biometric';
  }
}

/** Icon glyph for the biometric type. */
export function biometryIcon(biometryType: BiometryType): string {
  switch (biometryType) {
    case 'FaceID':
    case 'Iris':
    case 'OpticID':
      return '🙂';
    case 'TouchID':
    case 'Fingerprint':
      return '☝️';
    case 'None':
    default:
      return '🔒';
  }
}