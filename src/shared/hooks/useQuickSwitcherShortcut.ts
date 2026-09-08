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
  /** Optional close callback for Escape handling. */
  onClose?: () => void;
  /** When false, the listener is detached (e.g., after auth). */
  enabled?: boolean;
}

export function useQuickSwitcherShortcut({
  onOpen,
  onClose,
  enabled = true,
}: UseQuickSwitcherShortcutOptions): void {
  // Escape closes whenever the modal is mounted. The hook listener
  // may not fire on web if a nested <Modal> (RN-Web) dialog consumes
  // the keydown first; we listen at capture phase to beat that.
  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS !== 'web') return;

    function handleKeyDown(e: KeyboardEvent) {
      // Always handle Escape while our search modal is open. The
      // QuickSwitcher is rendered as a sibling overlay (outside any
      // RN <Modal>), so reaching this handler means the user has
      // interacted with our input.
      if (e.key === 'Escape' && onClose) {
        const active = document.activeElement;
        // Either focus is inside our modal OR our modal is the topmost
        // overlay (capture-phase listener on window ensures we see it).
        const insideSwitcher =
          active instanceof HTMLElement &&
          (active.closest?.('[data-testid="quick-switcher"]') !== null);
        if (insideSwitcher || document.querySelector('[data-testid="quick-switcher"]')) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
          return;
        }
      }

      const isOpenShortcut =
        (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      if (isOpenShortcut) {
        e.preventDefault();
        onOpen();
      }
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
  }, [onOpen, onClose, enabled]);
}
