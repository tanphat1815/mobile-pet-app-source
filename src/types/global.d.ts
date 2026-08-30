/* eslint-disable @typescript-eslint/no-explicit-any, no-var */

// Metro / Expo injects __DEV__ as a global boolean at build time.
// Re-declare it here so the TypeScript compiler accepts references.

declare const __DEV__: boolean;
declare var __DEV__: boolean;