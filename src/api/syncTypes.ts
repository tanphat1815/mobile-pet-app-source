/**
 * Sync Protocol Types
 *
 * Typed message shapes for the realtime sync channel.
 * The server pushes events; the client can send acknowledgements and
 * subscribe/unsubscribe to channels.
 *
 * All payloads are JSON. The transport is WebSocket (Step M-5) but the
 * message format is intentionally transport-agnostic so it could be
 * swapped to SSE / push in the future.
 */

// ============================================================================
// Wire format
// ============================================================================

export interface SyncEnvelope<T = unknown> {
  /** Discriminator: server event vs client message */
  direction: 'in' | 'out';
  /** Event type id, e.g. 'pet:update', 'chat:message', 'friend:status' */
  type: SyncEventType | ClientMessageType;
  /** Monotonic id from the server for ordering / dedup (optional on out) */
  id?: string;
  /** Event timestamp (ms since epoch) */
  ts?: number;
  /** Channel the message belongs to: 'pet', 'chat:<id>', 'friends', 'global' */
  channel?: string;
  /** Payload, typed per `type` */
  payload?: T;
}

export type SyncEventType =
  | 'sync:hello' // server greeting on connect
  | 'sync:ping' // heartbeat from server
  | 'sync:pong' // heartbeat ack from server (response to client ping)
  | 'pet:update' // pet stats changed (hunger, happiness, energy, xp)
  | 'pet:mood' // pet mood event (happy, sad, eating)
  | 'chat:message' // new chat message
  | 'chat:read' // chat read receipt
  | 'friend:status' // friend online/offline change
  | 'friend:request' // incoming friend request
  | 'achievement:unlocked' // achievement progress / unlock
  | 'quest:progress' // quest progress update
  | 'pairing:code' // cross-device pairing code issued
  | 'pairing:confirmed' // pairing confirmed
  | 'friend:activity' // Step 4 — friend activity event (level up, gift, ...)
  | 'error'; // generic error event

export type ClientMessageType =
  | 'client:hello' // initial handshake (auth)
  | 'client:ping' // heartbeat ping
  | 'client:subscribe' // subscribe to a channel
  | 'client:unsubscribe' // unsubscribe from a channel
  | 'client:ack'; // acknowledge an event id

// ============================================================================
// Outgoing messages
// ============================================================================

export interface ClientHelloMessage {
  type: 'client:hello';
  token: string;
  clientId: string;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
}

export interface ClientPingMessage {
  type: 'client:ping';
  ts: number;
}

export interface ClientSubscribeMessage {
  type: 'client:subscribe';
  channel: string;
}

export interface ClientUnsubscribeMessage {
  type: 'client:unsubscribe';
  channel: string;
}

export interface ClientAckMessage {
  type: 'client:ack';
  id: string;
}

export type ClientMessage =
  | ClientHelloMessage
  | ClientPingMessage
  | ClientSubscribeMessage
  | ClientUnsubscribeMessage
  | ClientAckMessage;

// ============================================================================
// Incoming events - payloads
// ============================================================================

export interface SyncHelloEvent {
  serverVersion: string;
  sessionId: string;
  heartbeatIntervalMs: number;
}

export interface PingEvent {
  ts: number;
}

export interface PongEvent {
  ts: number;
  echo: number;
}

export interface PetUpdateEvent {
  petId: string;
  stats: {
    hunger: number; // 0..100
    happiness: number; // 0..100
    energy: number; // 0..100
    xp: number;
    level: number;
  };
}

export interface PetMoodEvent {
  petId: string;
  mood: 'happy' | 'sad' | 'eating' | 'sleeping' | 'playing' | 'idle';
  reason?: string;
}

export interface ChatMessageEvent {
  conversationId: string;
  message: {
    id: string;
    fromUserId: string;
    toUserId: string;
    text: string;
    ts: number;
  };
}

export interface ChatReadEvent {
  conversationId: string;
  readerId: string;
  lastReadMessageId: string;
}

export interface FriendStatusEvent {
  userId: string;
  online: boolean;
  lastSeen?: number;
}

export interface FriendRequestEvent {
  fromUserId: string;
  fromDisplayName?: string;
}

export interface AchievementUnlockedEvent {
  achievementId: string;
  title: string;
  description?: string;
  xpReward: number;
}

export interface QuestProgressEvent {
  questId: string;
  title: string;
  progress: number; // 0..1
  completed: boolean;
}

export interface PairingCodeEvent {
  pairingCode: string;
  expiresAt: number;
}

export interface PairingConfirmedEvent {
  deviceId: string;
  pairedUserId: string;
}

export interface FriendActivityEvent {
  userId: string;
  userDisplayName?: string;
  userPetSpecies?: string;
  kind:
    | 'level_up'
    | 'achievement'
    | 'new_pet'
    | 'quest_complete'
    | 'gift_sent'
    | 'gift_received'
    | 'tag_added'
    | 'friend_joined';
  payload?: Record<string, unknown>;
  createdAt?: number;
}

export interface ErrorEvent {
  code: string;
  message: string;
  fatal?: boolean;
}

// ============================================================================
// Map type -> payload
// ============================================================================

export interface SyncEventPayloadMap {
  'sync:hello': SyncHelloEvent;
  'sync:ping': PingEvent;
  'sync:pong': PongEvent;
  'pet:update': PetUpdateEvent;
  'pet:mood': PetMoodEvent;
  'chat:message': ChatMessageEvent;
  'chat:read': ChatReadEvent;
  'friend:status': FriendStatusEvent;
  'friend:request': FriendRequestEvent;
  'achievement:unlocked': AchievementUnlockedEvent;
  'quest:progress': QuestProgressEvent;
  'pairing:code': PairingCodeEvent;
  'pairing:confirmed': PairingConfirmedEvent;
  'friend:activity': FriendActivityEvent;
  error: ErrorEvent;
}