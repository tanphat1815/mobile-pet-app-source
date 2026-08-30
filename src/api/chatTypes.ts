/**
 * Chat Domain Types
 *
 * Message + Conversation types. Mirrors the realtime event payloads in
 * src/api/syncTypes.ts but is API-focused (REST shape).
 */

export type MessageStatus =
  | 'pending' // optimistic send, in flight
  | 'sent' // server accepted
  | 'delivered' // recipient received
  | 'read' // recipient read
  | 'failed'; // send failed (will be retried)

export type MessageKind = 'text' | 'pet_share' | 'system';

export interface ChatMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  kind: MessageKind;
  text: string;
  ts: number;
  status: MessageStatus;
  /** Optional payload for non-text kinds (pet_share has petId, etc.) */
  meta?: Record<string, unknown>;
}

export interface ConversationParticipant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  online?: boolean;
  lastSeen?: number;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: ChatMessage;
  /** Total unread messages for the current user */
  unreadCount: number;
  updatedAt: number;
  /** Whether the conversation is muted */
  muted?: boolean;
}

export interface SendMessageInput {
  conversationId: string;
  text: string;
  /** Optional local id for dedup when server echoes the message */
  clientMsgId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Returns the other participant (not the current user) in a 1-1
 * conversation. Throws if there are not exactly 2 participants.
 */
export function otherParticipant(
  conv: Conversation,
  currentUserId: string
): ConversationParticipant {
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  if (!other) {
    // Fallback: return first participant (will be weird for groups)
    return conv.participants[0];
  }
  return other;
}

/** Sort helper: most recent first */
export function byUpdatedDesc(a: Conversation, b: Conversation): number {
  return b.updatedAt - a.updatedAt;
}

/** Sort helper: oldest first (for thread display) */
export function byTsAsc(a: ChatMessage, b: ChatMessage): number {
  return a.ts - b.ts;
}

export function formatRelativeTime(ts: number, now = Date.now()): string {
  const diff = now - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const date = new Date(ts);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}