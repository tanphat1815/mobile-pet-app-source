/**
 * Biometric types
 *
 * Cross-platform biometric capability flags. Mirrors what
 * `expo-local-authentication` returns but kept here so the rest of
 * the app doesn't have to import the native module.
 */

export type BiometryType =
  | 'FaceID'
  | 'TouchID'
  | 'Fingerprint'
  | 'Iris'
  | 'OpticID'
  | 'None';

export type BiometricLevel = 'none' | 'weak' | 'strong';

export interface BiometricCapability {
  /** Is any biometric hardware present on this device? */
  isAvailable: boolean;
  /** What kind of biometric is available? `None` when isAvailable is false. */
  biometryType: BiometryType;
  /** Authentication strength. `none` when not available. */
  level: BiometricLevel;
  /** Was the user enrolled (e.g. Face ID set up in Settings)? */
  isEnrolled: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  /** A user-cancelled prompt is also a `success: false`, but `cancelled: true` */
  cancelled: boolean;
  /** Error message (only when success is false and cancelled is false) */
  error?: string;
}