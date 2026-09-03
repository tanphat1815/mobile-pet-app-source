/**
 * Chat API
 *
 * REST endpoints for conversations + messages. Includes a local mock
 * state so the chat UI is fully testable without a real backend.
 *
 * Endpoints (target):
 *   GET    /chat/conversations            -> Conversation[]
 *   GET    /chat/conversations/:id        -> Conversation
 *   GET    /chat/conversations/:id/messages?cursor=... -> ChatMessage[]
 *   POST   /chat/conversations/:id/messages -> SendMessageResponse
 *   POST   /chat/conversations/:id/read    -> { lastReadMessageId }
 */

import apiClient from './client';
import { getApiError } from './client';
import {
  Conversation,
  ChatMessage,
  SendMessageResponse,
  MessageKind,
} from './chatTypes';

// ============================================================================
// Mock state
// ============================================================================

function makeMockConversations(): Conversation[] {
  const now = Date.now();
  return [
    {
      id: 'conv_alice',
      participants: [
        {
          userId: 'u_alice',
          displayName: 'Alice',
          online: true,
        },
        { userId: 'dev_user', displayName: 'You' },
      ],
      unreadCount: 2,
      updatedAt: now - 2 * 60 * 1000,
      lastMessage: {
        id: 'msg_a1',
        conversationId: 'conv_alice',
        fromUserId: 'u_alice',
        toUserId: 'dev_user',
        kind: 'text',
        text: "Hey, want to come see Mochi's new trick?",
        ts: now - 2 * 60 * 1000,
        status: 'delivered',
      },
    },
    {
      id: 'conv_bob',
      participants: [
        { userId: 'u_bob', displayName: 'Bob', online: false, lastSeen: now - 30 * 60 * 1000 },
        { userId: 'dev_user', displayName: 'You' },
      ],
      unreadCount: 0,
      updatedAt: now - 60 * 60 * 1000,
      lastMessage: {
        id: 'msg_b1',
        conversationId: 'conv_bob',
        fromUserId: 'dev_user',
        toUserId: 'u_bob',
        kind: 'text',
        text: 'See you tomorrow!',
        ts: now - 60 * 60 * 1000,
        status: 'read',
      },
    },
    {
      id: 'conv_carol',
      participants: [
        { userId: 'u_carol', displayName: 'Carol', online: true },
        { userId: 'dev_user', displayName: 'You' },
      ],
      unreadCount: 0,
      updatedAt: now - 24 * 60 * 60 * 1000,
      lastMessage: {
        id: 'msg_c1',
        conversationId: 'conv_carol',
        fromUserId: 'u_carol',
        toUserId: 'dev_user',
        kind: 'text',
        text: 'Just leveled up my dragon to Lv 10!',
        ts: now - 24 * 60 * 60 * 1000,
        status: 'read',
      },
    },
  ];
}

function makeMockMessages(conversationId: string): ChatMessage[] {
  const now = Date.now();
  const minutes = (m: number) => now - m * 60 * 1000;

  const baseMessages: Record<string, ChatMessage[]> = {
    conv_alice: [
      {
        id: 'msg_a0',
        conversationId,
        fromUserId: 'u_alice',
        toUserId: 'dev_user',
        kind: 'text',
        text: "Hi! How's Mochi doing?",
        ts: minutes(15),
        status: 'read',
      },
      {
        id: 'msg_a1',
        conversationId,
        fromUserId: 'u_alice',
        toUserId: 'dev_user',
        kind: 'text',
        text: "Hey, want to come see Mochi's new trick?",
        ts: minutes(2),
        status: 'delivered',
      },
    ],
    conv_bob: [
      {
        id: 'msg_b0',
        conversationId,
        fromUserId: 'u_bob',
        toUserId: 'dev_user',
        kind: 'text',
        text: 'Coffee tomorrow?',
        ts: minutes(120),
        status: 'read',
      },
      {
        id: 'msg_b1',
        conversationId,
        fromUserId: 'dev_user',
        toUserId: 'u_bob',
        kind: 'text',
        text: 'See you tomorrow!',
        ts: minutes(60),
        status: 'read',
      },
    ],
    conv_carol: [
      {
        id: 'msg_c0',
        conversationId,
        fromUserId: 'u_carol',
        toUserId: 'dev_user',
        kind: 'text',
        text: 'Just leveled up my dragon to Lv 10!',
        ts: minutes(60 * 24),
        status: 'read',
      },
    ],
  };
  return baseMessages[conversationId] ?? [];
}

let mockConversations: Conversation[] = makeMockConversations();
const mockMessages: Map<string, ChatMessage[]> = new Map();
for (const c of mockConversations) {
  mockMessages.set(c.id, makeMockMessages(c.id));
}

let nextMsgId = 1000;
function genMsgId(): string {
  nextMsgId += 1;
  return `msg_${nextMsgId}`;
}

// ============================================================================
// API
// ============================================================================

export async function listConversations(): Promise<Conversation[]> {
  try {
    await apiClient.get('/get', { params: { action: 'list_conversations' } });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockConversations;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    await apiClient.get(`/get`, {
      params: { action: 'get_conversation', id: conversationId },
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return mockConversations.find((c) => c.id === conversationId) ?? null;
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    await apiClient.get('/get', {
      params: { action: 'get_messages', id: conversationId },
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  return [...(mockMessages.get(conversationId) ?? [])];
}

export async function sendMessage(
  conversationId: string,
  text: string,
  clientMsgId?: string
): Promise<SendMessageResponse>;
export async function sendMessage(
  conversationId: string,
  text: string,
  options: {
    kind?: MessageKind;
    mediaUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    stickerId?: string;
    stickerPackId?: string;
    parentId?: string;
    clientMsgId?: string;
  }
): Promise<SendMessageResponse>;
export async function sendMessage(
  conversationId: string,
  text: string,
  arg3?: string | {
    kind?: MessageKind;
    mediaUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    stickerId?: string;
    stickerPackId?: string;
    parentId?: string;
    clientMsgId?: string;
  }
): Promise<SendMessageResponse> {
  let kind: MessageKind = 'text';
  let clientMsgId: string | undefined;
  let options: any = undefined;
  if (typeof arg3 === 'string') {
    clientMsgId = arg3;
  } else if (arg3 && typeof arg3 === 'object') {
    options = arg3;
    kind = options.kind ?? 'text';
    clientMsgId = options.clientMsgId;
  }

  try {
    await apiClient.post('/post', {
      action: 'send_message',
      conversationId,
      text,
      kind,
      ...(options ?? {}),
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const conv = mockConversations.find((c) => c.id === conversationId);
  const toUserId =
    conv?.participants.find((p) => p.userId !== 'dev_user')?.userId ?? 'u_unknown';

  const message: ChatMessage = {
    id: genMsgId(),
    conversationId,
    fromUserId: 'dev_user',
    toUserId,
    text,
    ts: Date.now(),
    status: 'sent',
    meta: clientMsgId ? { clientMsgId } : undefined,
    ...(options ?? {}),
    // Spread may include clientMsgId/kind; strip those for ChatMessage
    kind: (options?.kind ?? kind) as any,
    clientMsgId: undefined as any, // discard (was only for HTTP body)
  };
  // strip unwanted fields
  delete (message as any).clientMsgId;
  appendMessage(conversationId, message);
  return { message };
}

// ============================================================================
// Step 5 — Edit / Delete / React
// ============================================================================

export async function editMessage(
  conversationId: string,
  messageId: string,
  newText: string
): Promise<ChatMessage> {
  try {
    await apiClient.post('/post', {
      action: 'edit_message',
      conversationId,
      messageId,
      text: newText,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const list = mockMessages.get(conversationId) ?? [];
  const next = list.map((m) =>
    m.id === messageId
      ? { ...m, text: newText, editedAt: Date.now() }
      : m
  );
  mockMessages.set(conversationId, next);
  return next.find((m) => m.id === messageId)!;
}

export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<ChatMessage> {
  try {
    await apiClient.post('/post', {
      action: 'delete_message',
      conversationId,
      messageId,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const list = mockMessages.get(conversationId) ?? [];
  const next = list.map((m) =>
    m.id === messageId
      ? { ...m, deletedAt: Date.now(), text: '' }
      : m
  );
  mockMessages.set(conversationId, next);
  return next.find((m) => m.id === messageId)!;
}

export async function reactToMessage(
  conversationId: string,
  messageId: string,
  emoji: string,
  userId: string,
  action: 'add' | 'remove' = 'add'
): Promise<ChatMessage> {
  try {
    await apiClient.post('/post', {
      action: 'react_message',
      conversationId,
      messageId,
      emoji,
      userId,
      reactAction: action,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const list = mockMessages.get(conversationId) ?? [];
  const next = list.map((m) => {
    if (m.id !== messageId) return m;
    const reactions = [...(m.reactions ?? [])];
    const idx = reactions.findIndex((r) => r.emoji === emoji);
    if (idx >= 0) {
      const userIds = new Set(reactions[idx].userIds);
      if (action === 'add') userIds.add(userId);
      else userIds.delete(userId);
      if (userIds.size === 0) {
        reactions.splice(idx, 1);
      } else {
        reactions[idx] = { emoji, userIds: Array.from(userIds) };
      }
    } else if (action === 'add') {
      reactions.push({ emoji, userIds: [userId] });
    }
    return { ...m, reactions };
  });
  mockMessages.set(conversationId, next);
  return next.find((m) => m.id === messageId)!;
}

// ============================================================================
// Step 5 — Image upload (mock returns file:// or data uri)
// ============================================================================

/**
 * Upload ảnh lên backend. Hiện tại mock: return URI luôn (file:// hoặc
 * https). Khi có backend thật sẽ POST và nhận URL.
 */
export async function uploadChatImage(input: {
  uri: string;
  width?: number;
  height?: number;
}): Promise<{ url: string; width: number; height: number }> {
  try {
    await apiClient.post('/post', {
      action: 'upload_chat_image',
      uri: input.uri,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  // Mock: trả về URI luôn (Expo có thể render file:// images)
  return {
    url: input.uri,
    width: input.width ?? 1024,
    height: input.height ?? 768,
  };
}

export async function markRead(
  conversationId: string,
  lastReadMessageId: string
): Promise<{ lastReadMessageId: string }> {
  try {
    await apiClient.post('/post', {
      action: 'mark_read',
      conversationId,
      lastReadMessageId,
    });
  } catch (err) {
    const e = getApiError(err);
    if (e.status !== 0) throw err;
  }
  const conv = mockConversations.find((c) => c.id === conversationId);
  if (conv) conv.unreadCount = 0;
  // Also mark messages in mock as read
  const list = mockMessages.get(conversationId) ?? [];
  for (const m of list) {
    if (m.toUserId === 'dev_user' && m.status !== 'read') {
      m.status = 'read';
    }
  }
  return { lastReadMessageId };
}

// ============================================================================
// Dev expose cho e2e tests
// ============================================================================

import { toggleReaction } from './chatTypes';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  (globalThis as any).__CHAT_ADV_API__ = {
    editMessage,
    deleteMessage,
    reactToMessage,
    uploadChatImage,
    sendMessage,
    resetMockChat,
  };
  (globalThis as any).__TEST_TOGGLE_REACTION__ = (emoji: string, userId: string) => {
    return toggleReaction(
      {
        id: 'test',
        conversationId: 'test',
        fromUserId: 'u',
        toUserId: 'me',
        kind: 'text',
        text: 't',
        ts: Date.now(),
        status: 'sent',
      },
      emoji,
      userId
    );
  };
  if (typeof window !== 'undefined') {
    (window as any).__CHAT_ADV_API__ = (globalThis as any).__CHAT_ADV_API__;
    (window as any).__TEST_TOGGLE_REACTION__ = (globalThis as any).__TEST_TOGGLE_REACTION__;
  }
}

// ============================================================================
// Local helpers (used by mock + ChatStore)
// ============================================================================

/**
 * Reset mock state to initial. Used by tests để ensure deterministic state.
 */
export function resetMockChat(): void {
  mockConversations = makeMockConversations();
  mockMessages.clear();
  for (const c of mockConversations) {
    mockMessages.set(c.id, makeMockMessages(c.id));
  }
  nextMsgId = 1000;
}

/**
 * Append a message to the mock state. Used by sendMessage (outgoing) and
 * by realtime handlers (incoming chat:message events from server).
 */
export function appendMessage(conversationId: string, message: ChatMessage): void {
  const list = mockMessages.get(conversationId) ?? [];
  if (!list.find((m) => m.id === message.id)) {
    list.push(message);
    mockMessages.set(conversationId, list);
  }

  // Touch conversation updatedAt + lastMessage
  const conv = mockConversations.find((c) => c.id === conversationId);
  if (conv) {
    conv.updatedAt = message.ts;
    conv.lastMessage = message;
    if (message.fromUserId !== 'dev_user' && message.status !== 'read') {
      conv.unreadCount += 1;
    }
  }
}

/**
 * Mark messages from the given user as read (used by realtime chat:read
 * events).
 */
export function markMessagesReadBy(conversationId: string, readerId: string, lastReadMessageId: string): void {
  const list = mockMessages.get(conversationId) ?? [];
  for (const m of list) {
    if (m.fromUserId !== readerId && m.id <= lastReadMessageId) {
      m.status = 'read';
    }
  }
  const conv = mockConversations.find((c) => c.id === conversationId);
  if (conv && readerId !== 'dev_user') {
    conv.unreadCount = 0;
  }
}

/**
 * Inject an incoming message into the mock state (used when the
 * SyncManager receives a chat:message event). This way the UI updates
 * with realtime messages without a roundtrip.
 */
export function injectIncomingMessage(
  conversationId: string,
  text: string,
  fromUserId: string
): ChatMessage {
  const conv = mockConversations.find((c) => c.id === conversationId);
  const toUserId =
    conv?.participants.find((p) => p.userId !== fromUserId)?.userId ?? 'dev_user';
  const message: ChatMessage = {
    id: genMsgId(),
    conversationId,
    fromUserId,
    toUserId,
    kind: 'text',
    text,
    ts: Date.now(),
    status: 'delivered',
  };
  appendMessage(conversationId, message);
  return message;
}