/**
 * QuickSwitcherProvider
 *
 * Step 14 — Context provider + portal that renders the QuickSwitcher
 * modal at the root of the app. Mounted once in AppNavigator ABOVE
 * the Auth/Main stack switch so it stays mounted through navigation
 * transitions and survives logout/login flows.
 *
 * Children inside the provider tree (e.g., the HomeScreen FAB) can
 * call `useQuickSwitcher()` to trigger open/close.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import { QuickSwitcher } from '../shared/components/QuickSwitcher';
import {
  getSearchIndex,
  type QuickSwitcherIndex,
  type FriendSnapshot,
  type ChatThreadSnapshot,
  type QuestSnapshot,
  type AchievementSnapshot,
} from '../api/searchIndex';
import { useFriendStore } from '../stores/FriendStore';
import { useChatStore } from '../stores/ChatStore';
import { useAchievementStore } from '../stores/AchievementStore';
import { useQuickSwitcherShortcut } from '../shared/hooks/useQuickSwitcherShortcut';

interface QuickSwitcherContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: boolean;
  index: QuickSwitcherIndex;
}

const QuickSwitcherContext = createContext<QuickSwitcherContextValue | null>(
  null,
);

export function useQuickSwitcher(): QuickSwitcherContextValue {
  const ctx = useContext(QuickSwitcherContext);
  if (!ctx) {
    throw new Error(
      'useQuickSwitcher must be used within a <QuickSwitcherProvider>',
    );
  }
  return ctx;
}

export interface QuickSwitcherProviderProps {
  children: React.ReactNode;
}

export function QuickSwitcherProvider({ children }: QuickSwitcherProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation<any>();

  // Hook up the keyboard shortcut (Cmd/Ctrl+K) at the app root.
  useQuickSwitcherShortcut({
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    enableEscape: true,
    enabled: true,
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Pull entity snapshots from Zustand stores and project them into the
  // loose-shape snapshots the search index expects.
  const rawFriends = useFriendStore((s) => s.friends);
  const conversations = useChatStore((s) => s.conversations);
  const rawQuests = useAchievementStore((s) => s.quests);
  const rawAchievements = useAchievementStore((s) => s.achievements);

  const friends: FriendSnapshot[] = useMemo(
    () =>
      rawFriends.map((f: any) => ({
        id: f.userId ?? f.id,
        name: f.displayName ?? f.name ?? 'Friend',
        friendCode: f.friendCode,
        petName: f.petName,
      })),
    [rawFriends],
  );

  const chats: ChatThreadSnapshot[] = useMemo(
    () =>
      conversations.map((c: any) => {
        // Pick first participant that is not the current user.
        const me = c.currentUserId;
        const peer =
          c.participants?.find((p: any) => p.userId !== me) ??
          c.participants?.[0];
        return {
          id: c.id,
          peerName: peer?.displayName ?? 'Unknown',
          lastMessage: c.lastMessage?.text ?? c.lastMessage?.preview,
        };
      }),
    [conversations],
  );

  const quests: QuestSnapshot[] = useMemo(
    () =>
      rawQuests.map((q: any) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        status: q.status,
      })),
    [rawQuests],
  );

  const achievements: AchievementSnapshot[] = useMemo(
    () =>
      rawAchievements.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
      })),
    [rawAchievements],
  );

  const index = useMemo(() => getSearchIndex(), []);

  useEffect(() => {
    index.setEntities({ friends, chats, quests, achievements });
  }, [index, friends, chats, quests, achievements]);

  const value = useMemo<QuickSwitcherContextValue>(
    () => ({ open, close, toggle, isOpen, index }),
    [open, close, toggle, isOpen, index],
  );

  return (
    <QuickSwitcherContext.Provider value={value}>
      {children}
      <QuickSwitcher
        visible={isOpen}
        onClose={close}
        navigation={navigation}
      />
    </QuickSwitcherContext.Provider>
  );
}
