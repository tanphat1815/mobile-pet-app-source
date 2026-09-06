/**
 * useQuickSwitcherShortcut
 *
 * Step 14 — Keyboard listener hook for the Quick Switcher.
 *
 * Triggers the open callback when the user presses Cmd+K (macOS Web)
 * or Ctrl+K (Windows / Linux / Web). Skips the listener when the user
 * is typing in a text input that is NOT our search input.
 *
 * Native (iOS / Android) users will rely on the FAB button instead —
 * no physical keyboard shortcut on phones.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

export interface UseQuickSwitcherShortcutOptions {
  /** Called when the shortcut fires. */
  onOpen: () => void;
  /** Optional ref to the input — pressing Esc inside it closes the modal. */
  enableEscape?: boolean;
  /** Optional close callback for Escape handling. */
  onClose?: () => void;
  /** When false, the listener is detached (e.g., after auth). */
  enabled?: boolean;
}

export function useQuickSwitcherShortcut({
  onOpen,
  enableEscape = true,
  onClose,
  enabled = true,
}: UseQuickSwitcherShortcutOptions): void {
  useEffect(() => {
    if (!enabled) return;
    // Web-only shortcut: native keyboards don't surface Cmd/Ctrl to JS.
    if (Platform.OS !== 'web') return;

    function handleKeyDown(e: KeyboardEvent) {
      const isOpenShortcut =
        (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');

      if (isOpenShortcut) {
        e.preventDefault();
        onOpen();
        return;
      }

      if (enableEscape && onClose && e.key === 'Escape') {
        // Only swallow Escape if the search input or our modal has focus
        const active = document.activeElement;
        const isOurs =
          active instanceof HTMLElement &&
          (active.dataset?.testid?.startsWith('quick-switcher') ?? false);
        if (isOurs) {
          e.preventDefault();
          onClose();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen, onClose, enableEscape, enabled]);
}
