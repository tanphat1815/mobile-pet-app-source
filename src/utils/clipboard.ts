/**
 * Clipboard helper — defensive cross-platform polyfill.
 *
 * Step 7 — port FriendCodePill "Copy" button. Dùng navigator.clipboard
 * khi available (web), fallback qua Share API hoặc plain text input.
 */

import { Platform, Share, Alert } from 'react-native';

declare const navigator: any;

export async function copyToClipboard(text: string): Promise<boolean> {
  // Web (Playwright tests + browsers)
  if (Platform.OS === 'web' || typeof navigator !== 'undefined') {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback for older web environments
      if (typeof document !== 'undefined' && document.body) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      }
    } catch {
      return false;
    }
  }
  // Native fallback: Share the friend code as text
  try {
    await Share.share({ message: text, title: 'Friend code' });
    return true;
  } catch {
    Alert.alert('Could not copy', text);
    return false;
  }
}

// Dev expose cho e2e tests
if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__TEST_COPY_CLIPBOARD__ = copyToClipboard;
  if (typeof window !== 'undefined') {
    (window as any).__TEST_COPY_CLIPBOARD__ = copyToClipboard;
  }
}
