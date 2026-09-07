/**
 * Chat Domain Types
 *
 * Message + Conversation types. Mirrors the realtime event payloads in
 * src/api/syncTypes.ts but is API-focused (REST shape).
 *
 * Step 5 — mở rộng với stickers, images, reactions, replies, edit/delete.
 * Port từ desktop `src/renderer/chat/*`.
 */

export type MessageStatus =
  | 'pending' // optimistic send, in flight
  | 'sent' // server accepted
  | 'delivered' // recipient received
  | 'read' // recipient read
  | 'failed'; // send failed (will be retried)

/**
 * Step 5 — Message kind mở rộng:
 *  - text: plain text
 *  - pet_share: share pet (existing)
 *  - system: system-generated (existing)
 *  - sticker: gửi sticker từ sticker pack
 *  - image: gửi ảnh (có mediaUrl)
 */
export type MessageKind = 'text' | 'pet_share' | 'system' | 'sticker' | 'image';

/**
 * Reaction emoji + userIds đã react. Lưu dạng array of {emoji, userIds}
 * thay vì record → flexible cho việc count + sort.
 */
export interface MessageReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  kind: MessageKind;
  /** Text cho text messages; stickerId cho sticker; empty cho image */
  text: string;
  ts: number;
  status: MessageStatus;
  /** Optional payload for non-text kinds */
  meta?: Record<string, unknown>;
  // ====================== Step 5 additions ======================
  /** cho kind='image' — remote URL hoặc file:// URI */
  mediaUrl?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  /** Sticker id (cho kind='sticker') */
  stickerId?: string;
  /** Sticker pack id (cho kind='sticker') */
  stickerPackId?: string;
  /** Reply — id của message được trả lời */
  parentId?: string;
  /** Reactions trên message (tối đa ~6 distinct emoji) */
  reactions?: MessageReaction[];
  /** Set nếu message đã bị edit */
  editedAt?: number;
  /** Set nếu message đã bị xoá (soft delete) */
  deletedAt?: number;
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
  /** Step 5 — non-text send */
  kind?: MessageKind;
  mediaUrl?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  stickerId?: string;
  stickerPackId?: string;
  /** Reply target */
  parentId?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

/**
 * Step 5 — Sticker pack definitions. Đồng bộ với desktop
 * `src/renderer/chat/sticker-packs.js`.
 */
export type StickerCategory = 'emotions' | 'gestures' | 'celebrations' | 'custom';

export interface StickerItem {
  id: string;
  emoji: string;
  label: string;
}

export interface StickerPack {
  id: string;
  name: string;
  category: StickerCategory;
  /** Background tint cho pack header */
  tint: string;
  stickers: StickerItem[];
}

// ============================================================================
// Helpers
// ============================================================================

export function otherParticipant(
  conv: Conversation,
  currentUserId: string
): ConversationParticipant {
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  if (!other) {
    return conv.participants[0];
  }
  return other;
}

export function byUpdatedDesc(a: Conversation, b: Conversation): number {
  return b.updatedAt - a.updatedAt;
}

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

/**
 * Step 5 — toggle reaction của user. Pure helper.
 */
export function toggleReaction(
  message: ChatMessage,
  emoji: string,
  userId: string
): ChatMessage {
  const reactions = message.reactions ?? [];
  const existing = reactions.find((r) => r.emoji === emoji);
  if (existing) {
    const has = existing.userIds.includes(userId);
    const newReactions = reactions
      .map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              userIds: has ? r.userIds.filter((u) => u !== userId) : [...r.userIds, userId],
            }
          : r
      )
      .filter((r) => r.userIds.length > 0);
    return { ...message, reactions: newReactions };
  }
  return {
    ...message,
    reactions: [...reactions, { emoji, userIds: [userId] }],
  };
}

/** Step 5 — check if user reacted với emoji */
export function hasUserReacted(
  message: ChatMessage,
  emoji: string,
  userId: string
): boolean {
  return (message.reactions ?? []).some(
    (r) => r.emoji === emoji && r.userIds.includes(userId)
  );
}

/** Step 5 — total reaction count */
export function totalReactionCount(message: ChatMessage): number {
  return (message.reactions ?? []).reduce((sum, r) => sum + r.userIds.length, 0);
}
