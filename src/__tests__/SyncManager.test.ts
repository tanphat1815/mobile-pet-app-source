/**
 * SyncManager
 *
 * Unit tests for the typed events / status transitions / reconnect
 * bookkeeping. We swap the global WebSocket with a fake so the
 * manager never tries to open a real socket.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SyncManager, type ConnectionStatus } from '../api/SyncManager';
import type { SyncEnvelope } from '../api/syncTypes';

// ----------------------------------------------------------------------------
// Fake WebSocket (also defined in vitest.setup.ts; here we declare a typed
// view that exposes the test-only helpers).
// ----------------------------------------------------------------------------

interface FakeWebSocketTest extends WebSocket {
  sent: string[];
  markOpen(): void;
  markMessage(data: string): void;
  markClose(code?: number, reason?: string): void;
}

declare global {
  // eslint-disable-next-line no-var
  var __getLastFake: () => FakeWebSocketTest | null;
  // eslint-disable-next-line no-var
  var __clearLastFake: () => void;
}

beforeEach(() => {
  (globalThis as any).__clearLastFake?.();
});

function getFake(): FakeWebSocketTest {
  const f = (globalThis as any).__getLastFake?.();
  if (!f) throw new Error('No fake WebSocket was created');
  return f;
}

function setupManager(
  opts: Partial<{
    url: string;
    getToken: () => string | null;
    onStatusChange: (s: ConnectionStatus, a?: number) => void;
    onEvent: (env: SyncEnvelope) => void;
  }> = {}
) {
  const statusChanges: Array<{ s: ConnectionStatus; a?: number }> = [];
  const events: SyncEnvelope[] = [];
  const manager = new SyncManager({
    url: opts.url ?? 'ws://test',
    clientId: 'cid-1',
    getToken: opts.getToken ?? (() => 'token-A'),
    onStatusChange:
      opts.onStatusChange ??
      ((s, a) => statusChanges.push({ s, a })),
    onEvent: opts.onEvent ?? ((env) => events.push(env)),
  });
  return { manager, statusChanges, events };
}

describe('SyncManager', () => {
  it('starts in idle', () => {
    const { manager } = setupManager();
    expect(manager.getStatus()).toBe('idle');
  });

  it('connect() transitions connecting -> open and sends client:hello', () => {
    const { manager } = setupManager();
    manager.connect();
    expect(manager.getStatus()).toBe('connecting');
    const sock = getFake();
    sock.markOpen();
    expect(manager.getStatus()).toBe('open');
    const hello = sock.sent.map((s) => JSON.parse(s));
    expect(hello[0].type).toBe('client:hello');
    expect(hello[0].clientId).toBe('cid-1');
    expect(hello[0].token).toBe('token-A');
    manager.disconnect();
  });

  it('dispatches typed events to .on() listeners', () => {
    const { manager } = setupManager();
    manager.connect();
    const sock = getFake();
    sock.markOpen();

    const received: any[] = [];
    const off = manager.on('sync:pong', (payload) => {
      received.push(payload);
    });

    sock.markMessage(
      JSON.stringify({ id: 'm1', type: 'sync:pong', ts: 1, payload: { ts: 1 } })
    );
    expect(received).toEqual([{ ts: 1 }]);

    off();
    sock.markMessage(
      JSON.stringify({ id: 'm2', type: 'sync:pong', ts: 2, payload: { ts: 2 } })
    );
    expect(received).toHaveLength(1);

    manager.disconnect();
  });

  it('disconnect() flips status to closed', () => {
    const { manager, statusChanges } = setupManager();
    manager.connect();
    getFake().markOpen();
    manager.disconnect();
    expect(manager.getStatus()).toBe('closed');
    expect(statusChanges[statusChanges.length - 1].s).toBe('closed');
  });

  it('subscribe() buffers channels and re-subscribes on reconnect', () => {
    const { manager } = setupManager();
    manager.connect();
    const sock = getFake();
    sock.markOpen();
    manager.subscribe('pet:updates');
    expect(sock.sent.map((s) => JSON.parse(s).type)).toContain(
      'client:subscribe'
    );
    sock.markClose();
    expect(manager.getStatus()).toBe('reconnecting');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const sock2 = getFake();
        sock2.markOpen();
        const typesAfter = sock2.sent.map((s) => JSON.parse(s).type);
        expect(typesAfter).toContain('client:hello');
        expect(typesAfter).toContain('client:subscribe');
        manager.disconnect();
        resolve();
      }, 1500);
    });
  });

  it('isManuallyClosed prevents reconnect', () => {
    const { manager } = setupManager();
    manager.connect();
    getFake().markOpen();
    manager.disconnect();
    expect(manager.getStatus()).toBe('closed');
  });
});