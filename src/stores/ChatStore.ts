/**
 * ChatStore (Zustand)
 *
 * Manages conversations + per-conversation message lists. Supports:
 *   - listing conversations
 *   - loading messages for a conversation
 *   - sending messages (optimistic + server reconcile)
 *   - realtime chat:message / chat:read events
 */

import { create } from 'zustand';
import {
  listConversations,
  getConversation,
  getMessages,
  sendMessage,
  markRead,
  editMessage,
  deleteMessage,
  reactToMessage,
  uploadChatImage,
} from '../api/chat';
import {
  Conversation,
  ChatMessage,
  SendMessageInput,
  byTsAsc,
  toggleReaction as toggleReactionHelper,
} from '../api/chatTypes';
import { useAuthStore } from './AuthStore';
import { useSyncEvent } from './SyncStore';

// ============================================================================
// Types
// ============================================================================

export type ChatListStatus = 'idle' | 'loading' | 'ready' | 'error';
export type ChatThreadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ChatState {
  // Conversation list
  conversations: Conversation[];
  listStatus: ChatListStatus;
  listError: string | null;

  // Per-conversation message cache
  /** conversationId -> messages */
  threads: Record<string, ChatMessage[]>;
  /** conversationId -> loading status */
  threadStatus: Record<string, ChatThreadStatus>;

  // Pending sends (clientMsgId -> conversationId)
  pendingCount: number;

  // Actions
  loadConversations: () => Promise<void>;
  loadThread: (conversationId: string) => Promise<void>;
  send: (input: SendMessageInput) => Promise<void>;
  markThreadRead: (conversationId: string) => Promise<void>;
  // Step 5
  editMessage: (messageId: string, conversationId: string, newText: string) => Promise<void>;
  deleteMessage: (messageId: string, conversationId: string) => Promise<void>;
  toggleReaction: (messageId: string, conversationId: string, emoji: string) => Promise<void>;
  sendImage: (
    conversationId: string,
    uri: string,
    width: number,
    height: number,
    parentId?: string
  ) => Promise<void>;
  sendSticker: (
    conversationId: string,
    stickerId: string,
    packId: string,
    parentId?: string
  ) => Promise<void>;
  reset: () => void;
}

// ============================================================================
// Store
// ============================================================================

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  listStatus: 'idle',
  listError: null,
  threads: {},
  threadStatus: {},
  pendingCount: 0,

  loadConversations: async () => {
    set({ listStatus: 'loading', listError: null });
    try {
      const convs = await listConversations();
      set({ conversations: convs, listStatus: 'ready' });
    } catch (err) {
      set({
        listStatus: 'error',
        listError: err instanceof Error ? err.message : 'Failed to load conversations',
      });
    }
  },

  loadThread: async (conversationId: string) => {
    set({
      threadStatus: { ...get().threadStatus, [conversationId]: 'loading' },
    });
    try {
      const msgs = await getMessages(conversationId);
      const sorted = [...msgs].sort(byTsAsc);
      set({
        threads: { ...get().threads, [conversationId]: sorted },
        threadStatus: { ...get().threadStatus, [conversationId]: 'ready' },
      });
    } catch (err) {
      set({
        threadStatus: {
          ...get().threadStatus,
          [conversationId]: 'error',
        },
      });
    }
  },

  send: async ({ conversationId, text, clientMsgId }) => {
    const currentUserId = useAuthStore.getState().user?.id ?? 'dev_user';
    const localId = clientMsgId ?? `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: ChatMessage = {
      id: localId,
      conversationId,
      fromUserId: currentUserId,
      toUserId: 'pending',
      kind: 'text',
      text,
      ts: Date.now(),
      status: 'pending',
    };
    // Append optimistic
    const existing = get().threads[conversationId] ?? [];
    set({
      threads: { ...get().threads, [conversationId]: [...existing, optimistic] },
      pendingCount: get().pendingCount + 1,
    });

    try {
      const res = await sendMessage(conversationId, text, localId);
      // Replace optimistic with server message
      const after = (get().threads[conversationId] ?? []).map((m) =>
        m.id === localId ? res.message : m
      );
      set({
        threads: { ...get().threads, [conversationId]: after },
        pendingCount: Math.max(0, get().pendingCount - 1),
      });
      // Bump conversation in the list
      touchConversation(conversationId, res.message.ts);
    } catch (err) {
      const after = (get().threads[conversationId] ?? []).map((m) =>
        m.id === localId ? { ...m, status: 'failed' as const } : m
      );
      set({
        threads: { ...get().threads, [conversationId]: after },
        pendingCount: Math.max(0, get().pendingCount - 1),
      });
    }
  },

  markThreadRead: async (conversationId: string) => {
    const msgs = get().threads[conversationId] ?? [];
    const lastRead = [...msgs].reverse().find((m) => m.fromUserId !== (useAuthStore.getState().user?.id ?? 'dev_user'));
    if (!lastRead) return;
    try {
      await markRead(conversationId, lastRead.id);
      // Update local conversation unread count
      set({
        conversations: get().conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      });
    } catch {
      /* ignore */
    }
  },

  // ==========================================================================
  // Step 5 — edit / delete / react / sticker / image
  // ==========================================================================

  editMessage: async (messageId, conversationId, newText) => {
    // Optimistic
    const before = get().threads[conversationId] ?? [];
    const optimistic = before.map((m) =>
      m.id === messageId ? { ...m, text: newText, editedAt: Date.now() } : m
    );
    set({ threads: { ...get().threads, [conversationId]: optimistic } });
    try {
      const updated = await editMessage(conversationId, messageId, newText);
      const next = (get().threads[conversationId] ?? []).map((m) =>
        m.id === messageId ? updated : m
      );
      set({ threads: { ...get().threads, [conversationId]: next } });
    } catch {
      // Rollback
      set({ threads: { ...get().threads, [conversationId]: before } });
      throw new Error('Failed to edit message');
    }
  },

  deleteMessage: async (messageId, conversationId) => {
    const before = get().threads[conversationId] ?? [];
    const optimistic = before.map((m) =>
      m.id === messageId ? { ...m, deletedAt: Date.now(), text: '' } : m
    );
    set({ threads: { ...get().threads, [conversationId]: optimistic } });
    try {
      const updated = await deleteMessage(conversationId, messageId);
      const next = (get().threads[conversationId] ?? []).map((m) =>
        m.id === messageId ? updated : m
      );
      set({ threads: { ...get().threads, [conversationId]: next } });
    } catch {
      set({ threads: { ...get().threads, [conversationId]: before } });
      throw new Error('Failed to delete message');
    }
  },

  toggleReaction: async (messageId, conversationId, emoji) => {
    const userId = useAuthStore.getState().user?.id ?? 'dev_user';
    const before = get().threads[conversationId] ?? [];
    const target = before.find((m) => m.id === messageId);
    if (!target) return;
    const optimistic = before.map((m) =>
      m.id === messageId ? toggleReactionHelper(m, emoji, userId) : m
    );
    set({ threads: { ...get().threads, [conversationId]: optimistic } });
    try {
      const wasReacted = (target.reactions ?? []).some(
        (r) => r.emoji === emoji && r.userIds.includes(userId)
      );
      const updated = await reactToMessage(
        conversationId,
        messageId,
        emoji,
        userId,
        wasReacted ? 'remove' : 'add'
      );
      const next = (get().threads[conversationId] ?? []).map((m) =>
        m.id === messageId ? updated : m
      );
      set({ threads: { ...get().threads, [conversationId]: next } });
    } catch {
      set({ threads: { ...get().threads, [conversationId]: before } });
    }
  },

  sendImage: async (conversationId, uri, width, height, parentId) => {
    const currentUserId = useAuthStore.getState().user?.id ?? 'dev_user';
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // Upload first
    let url = uri;
    try {
      const up = await uploadChatImage({ uri, width, height });
      url = up.url;
    } catch {
      // Use local uri as fallback
    }
    const optimistic: ChatMessage = {
      id: localId,
      conversationId,
      fromUserId: currentUserId,
      toUserId: 'pending',
      kind: 'image',
      text: '',
      ts: Date.now(),
      status: 'pending',
      mediaUrl: url,
      mediaWidth: width,
      mediaHeight: height,
      parentId,
    };
    const existing = get().threads[conversationId] ?? [];
    set({
      threads: { ...get().threads, [conversationId]: [...existing, optimistic] },
      pendingCount: get().pendingCount + 1,
    });
    try {
      const res = await sendMessage(conversationId, '', {
        kind: 'image',
        mediaUrl: url,
        mediaWidth: width,
        mediaHeight: height,
        parentId,
        clientMsgId: localId,
      });
      const after = (get().threads[conversationId] ?? []).map((m) =>
        m.id === localId ? res.message : m
      );
      set({
        threads: { ...get().threads, [conversationId]: after },
        pendingCount: Math.max(0, get().pendingCount - 1),
      });
      touchConversation(conversationId, res.message.ts);
    } catch {
      const after = (get().threads[conversationId] ?? []).map((m) =>
        m.id === localId ? { ...m, status: 'failed' as const } : m
      );
      set({
        threads: { ...get().threads, [conversationId]: after },
        pendingCount: Math.max(0, get().pendingCount - 1),
      });
    }
  },

  sendSticker: async (conversationId, stickerId, packId, parentId) => {
    const currentUserId = useAuthStore.getState().user?.id ?? 'dev_user';
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: ChatMessage = {
      id: localId,
      conversationId,
      fromUserId: currentUserId,
      toUserId: 'pending',
      kind: 'sticker',
      text: stickerId,
      ts: Date.now(),
      status: 'pending',
      stickerId,
      stickerPackId: packId,
      parentId,
    };
    const existing = get().threads[conversationId] ?? [];
    set({
      threads: { ...get().threads, [conversationId]: [...existing, optimistic] },
      pendingCount: get().pendingCount + 1,
    });
    try {
      const res = await sendMessage(conversationId, stickerId, {
        kind: 'sticker',
        stickerId,
        stickerPackId: packId,
        parentId,
        clientMsgId: localId,
      });
      const after = (get().threads[conversationId] ?? []).map((m) =>
        m.id === localId ? res.message : m
      );
      set({
        threads: { ...get().threads, [conversationId]: after },
        pendingCount: Math.max(0, get().pendingCount - 1),
      });
      touchConversation(conversationId, res.message.ts);
    } catch {
      const after = (get().threads[conversationId] ?? []).map((m) =>
        m.id === localId ? { ...m, status: 'failed' as const } : m
      );
      set({
        threads: { ...get().threads, [conversationId]: after },
        pendingCount: Math.max(0, get().pendingCount - 1),
      });
    }
  },

  reset: () => {
    set({
      conversations: [],
      listStatus: 'idle',
      listError: null,
      threads: {},
      threadStatus: {},
      pendingCount: 0,
    });
  },
}));

// ============================================================================
// Helpers
// ============================================================================

function touchConversation(conversationId: string, ts: number) {
  const list = useChatStore.getState().conversations;
  const conv = list.find((c) => c.id === conversationId);
  if (!conv) return;
  useChatStore.setState({
    conversations: list.map((c) =>
      c.id === conversationId ? { ...c, updatedAt: ts } : c
    ),
  });
}

// ============================================================================
// Realtime bridge
// ============================================================================

/**
 * Subscribes to chat:message + chat:read from the SyncManager and pipes
 * them into ChatStore. Mount once at the app root.
 */
export function useChatRealtimeSync(): void {
  const loadConversations = useChatStore((s) => s.loadConversations);
  const loadThread = useChatStore((s) => s.loadThread);
  const userId = useAuthStore((s) => s.user?.id ?? 'dev_user');

  useSyncEvent('chat:message', (payload) => {
    const { conversationId, message } = payload;
    const current = useChatStore.getState().threads[conversationId] ?? [];
    if (current.find((m) => m.id === message.id)) return;
    const normalized: ChatMessage = {
      id: message.id,
      conversationId,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      kind: 'text',
      text: message.text,
      ts: message.ts,
      // fromUserId may already be the sender; ensure status
      status: message.fromUserId === userId ? 'sent' : 'delivered',
    };
    useChatStore.setState({
      threads: {
        ...useChatStore.getState().threads,
        [conversationId]: [...current, normalized].sort(byTsAsc),
      },
    });
    // Bump conversation updatedAt + unread
    const list = useChatStore.getState().conversations;
    useChatStore.setState({
      conversations: list.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              lastMessage: normalized,
              updatedAt: normalized.ts,
              unreadCount:
                normalized.fromUserId === userId ? c.unreadCount : c.unreadCount + 1,
            }
          : c
      ),
    });
  });

  useSyncEvent('chat:read', (payload) => {
    const { conversationId, readerId, lastReadMessageId } = payload;
    const list = useChatStore.getState().threads[conversationId] ?? [];
    useChatStore.setState({
      threads: {
        ...useChatStore.getState().threads,
        [conversationId]: list.map((m) =>
          m.fromUserId !== readerId && m.id <= lastReadMessageId
            ? { ...m, status: 'read' as const }
            : m
        ),
      },
    });
    if (readerId !== userId) {
      useChatStore.setState({
        conversations: useChatStore.getState().conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      });
    }
  });

  // Lazy initial load so the chat list always has fresh data on mount
  if (useChatStore.getState().listStatus === 'idle') {
    loadConversations();
  }
}