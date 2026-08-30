/**
 * SyncManager
 *
 * Manages a single WebSocket connection to the realtime backend.
 *
 * Features:
 *   - Auto-connect on auth
 *   - Exponential-backoff reconnect (initialDelay -> maxDelay)
 *   - Heartbeat (ping/pong with timeout)
 *   - Channel subscribe / unsubscribe
 *   - Event subscription API (typed by event type)
 *   - Connection status tracking (idle, connecting, open, reconnecting, closed)
 *   - Auto-hello with auth token on connect
 *
 * The manager is transport-agnostic in terms of *types* (syncTypes.ts) -
 * the actual WebSocket connection is abstracted behind the manager so
 * swapping to SSE / native push is a localized change.
 */

import {
  ClientMessage,
  SyncEnvelope,
  SyncEventPayloadMap,
  SyncEventType,
} from './syncTypes';
import { WS_URL, WS_RECONNECT, PLATFORM_TAG, IS_DEV } from './config';

// ============================================================================
// Types
// ============================================================================

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed';

export interface SyncManagerOptions {
  url?: string;
  clientId: string;
  getToken: () => string | null;
  onStatusChange?: (status: ConnectionStatus, attempt?: number) => void;
  onEvent?: (envelope: SyncEnvelope) => void;
  onLog?: (message: string, data?: unknown) => void;
}

type EventListener<K extends SyncEventType> = (
  payload: SyncEventPayloadMap[K],
  envelope: SyncEnvelope
) => void;

// ============================================================================
// Manager
// ============================================================================

export class SyncManager {
  private url: string;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'idle';
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;
  private channels: Set<string> = new Set();
  private listeners: Map<SyncEventType, Set<EventListener<SyncEventType>>> = new Map();
  private subscribedChannels: Set<string> = new Set();
  private isManuallyClosed = false;
  private clientId: string;
  private getToken: () => string | null;
  private onStatusChange?: (status: ConnectionStatus, attempt?: number) => void;
  private onEvent?: (envelope: SyncEnvelope) => void;
  private onLog?: (message: string, data?: unknown) => void;

  constructor(options: SyncManagerOptions) {
    this.url = options.url ?? WS_URL;
    this.clientId = options.clientId;
    this.getToken = options.getToken;
    this.onStatusChange = options.onStatusChange;
    this.onEvent = options.onEvent;
    this.onLog = options.onLog;
  }

  // ----------------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------------

  getStatus(): ConnectionStatus {
    return this.status;
  }

  /** Open the connection. Idempotent: safe to call multiple times. */
  connect(): void {
    if (this.status === 'connecting' || this.status === 'open') return;
    this.isManuallyClosed = false;
    this.openSocket();
  }

  /** Permanently close the connection. Stops reconnect attempts. */
  disconnect(): void {
    this.isManuallyClosed = true;
    this.clearTimers();
    if (this.ws) {
      try {
        this.ws.close(1000, 'client disconnect');
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
    this.setStatus('closed');
  }

  /** Re-establish after a transient network failure. */
  reconnect(): void {
    this.isManuallyClosed = false;
    this.attempt = 0;
    this.openSocket();
  }

  /** Send a typed client message. Returns true if dispatched. */
  send(msg: ClientMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    try {
      this.ws.send(JSON.stringify(msg));
      return true;
    } catch (err) {
      this.log('send failed', err);
      return false;
    }
  }

  /** Subscribe to a channel. Re-subscribes automatically after reconnect. */
  subscribe(channel: string): void {
    this.subscribedChannels.add(channel);
    this.send({ type: 'client:subscribe', channel });
  }

  /** Unsubscribe from a channel. */
  unsubscribe(channel: string): void {
    this.subscribedChannels.delete(channel);
    this.send({ type: 'client:unsubscribe', channel });
  }

  /** Listen to a typed event. Returns an unsubscribe function. */
  on<K extends SyncEventType>(type: K, listener: EventListener<K>): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener as EventListener<SyncEventType>);
    this.listeners.set(type, set);
    return () => {
      const s = this.listeners.get(type);
      if (s) s.delete(listener as EventListener<SyncEventType>);
    };
  }

  /** Acknowledge receipt of an event id (helps server-side QoS). */
  ack(id: string): void {
    this.send({ type: 'client:ack', id });
  }

  // ----------------------------------------------------------------------
  // Internal
  // ----------------------------------------------------------------------

  private openSocket(): void {
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');

    let socket: WebSocket;
    try {
      socket = new WebSocket(this.url);
    } catch (err) {
      this.log('socket construction failed', err);
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;

    socket.onopen = () => {
      this.attempt = 0;
      this.setStatus('open');
      this.sendHello();
      // Re-subscribe to all channels after a successful (re)connect.
      for (const channel of this.subscribedChannels) {
        this.send({ type: 'client:subscribe', channel });
      }
      this.startHeartbeat();
    };

    socket.onmessage = (event) => {
      let envelope: SyncEnvelope;
      try {
        const parsed = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data));
        envelope = parsed as SyncEnvelope;
      } catch (err) {
        this.log('malformed message', err);
        return;
      }
      this.handleEnvelope(envelope);
    };

    socket.onerror = (event) => {
      this.log('socket error', event);
      // onerror doesn't fire onclose automatically on all browsers,
      // but it usually does. Let onclose handle reconnect.
    };

    socket.onclose = (event) => {
      this.log('socket closed', { code: event.code, reason: event.reason });
      this.stopHeartbeat();
      this.ws = null;
      if (this.isManuallyClosed) {
        this.setStatus('closed');
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.isManuallyClosed) return;
    if (this.attempt >= WS_RECONNECT.maxAttempts) {
      this.log('max reconnect attempts reached, giving up');
      this.setStatus('closed');
      return;
    }
    this.attempt += 1;
    const delay = Math.min(
      WS_RECONNECT.initialDelayMs * Math.pow(2, this.attempt - 1),
      WS_RECONNECT.maxDelayMs
    );
    // Add a little jitter to avoid thundering herd
    const jitter = Math.random() * 250;
    this.log(`reconnect in ${delay + jitter}ms (attempt ${this.attempt})`);
    this.setStatus('reconnecting', this.attempt);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay + jitter);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      const sent = this.send({ type: 'client:ping', ts: Date.now() });
      if (!sent) return;
      this.clearPongTimeout();
      this.pongTimeout = setTimeout(() => {
        this.log('pong timeout - closing socket');
        try {
          this.ws?.close(4000, 'pong timeout');
        } catch {
          /* ignore */
        }
      }, WS_RECONNECT.pongTimeoutMs);
    }, WS_RECONNECT.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearPongTimeout();
  }

  private clearPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private sendHello(): void {
    const token = this.getToken();
    this.send({
      type: 'client:hello',
      token: token ?? '',
      clientId: this.clientId,
      appVersion: '0.0.1',
      platform: PLATFORM_TAG as 'ios' | 'android' | 'web',
    });
  }

  private handleEnvelope(envelope: SyncEnvelope): void {
    const type = envelope.type as SyncEventType;

    // Heartbeat responses
    if (type === 'sync:pong') {
      this.clearPongTimeout();
    }

    // Fire global event hook first
    this.onEvent?.(envelope);

    // Then type-specific listeners
    const listeners = this.listeners.get(type);
    if (listeners && envelope.payload !== undefined) {
      const payload = envelope.payload as SyncEventPayloadMap[typeof type];
      for (const listener of listeners) {
        try {
          listener(payload, envelope);
        } catch (err) {
          this.log(`listener for ${type} threw`, err);
        }
      }
    }
  }

  private setStatus(status: ConnectionStatus, attempt?: number): void {
    if (this.status === status) return;
    this.status = status;
    this.onStatusChange?.(status, attempt);
  }

  private log(message: string, data?: unknown): void {
    if (IS_DEV) {
      console.log(`[SyncManager] ${message}`, data ?? '');
    }
    this.onLog?.(message, data);
  }
}
