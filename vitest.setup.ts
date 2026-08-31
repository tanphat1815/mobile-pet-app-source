/**
 * Vitest Setup
 *
 * Mocks for third-party modules that touch native code (Reanimated,
 * gesture-handler, AsyncStorage) so we can run our unit tests under
 * jsdom without an actual device.
 */

import { vi } from 'vitest';

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------

// React Native injects __DEV__ as a build-time global; jsdom does not.
(globalThis as any).__DEV__ = (globalThis as any).__DEV__ ?? true;

// ----------------------------------------------------------------------------
// Reanimated
// ----------------------------------------------------------------------------

vi.mock('react-native-reanimated', () => {
  return {
    __esModule: true,
    default: {
      View: () => null,
      Text: () => null,
    },
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (_cb) => ({}),
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    withSequence: (...values) => values[values.length - 1],
    withRepeat: (v) => v,
    Easing: {
      inOut: (e) => e,
      ease: 'ease',
      linear: 'linear',
    },
    interpolate: (v) => v,
    interpolateColor: (v) => v,
  };
});

// ----------------------------------------------------------------------------
// AsyncStorage
// ----------------------------------------------------------------------------

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
      clear: async () => {
        store.clear();
      },
      getAllKeys: async () => Array.from(store.keys()),
      multiGet: async (keys: string[]) =>
        keys.map((k) => [k, store.has(k) ? store.get(k)! : null] as const),
      multiSet: async (pairs: [string, string][]) => {
        for (const [k, v] of pairs) store.set(k, v);
      },
      multiRemove: async (keys: string[]) => {
        for (const k of keys) store.delete(k);
      },
    },
  };
});

// ----------------------------------------------------------------------------
// Platform defaults (Platform.OS -> 'ios' / 'web' are picked up from
// the @react-native/jsdom package that Expo pulls in transitively).
// ----------------------------------------------------------------------------

if (typeof (globalThis as any).requestAnimationFrame !== 'function') {
  (globalThis as any).requestAnimationFrame = (cb: () => void) => {
    setTimeout(cb, 0);
    return 0;
  };
}

// ----------------------------------------------------------------------------
// WebSocket (used by SyncManager)
// ----------------------------------------------------------------------------

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  readyState = 0;
  onopen: ((ev?: any) => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev?: any) => void) | null = null;
  onclose: ((ev: { code: number; reason: string }) => void) | null = null;
  sent: string[] = [];
  constructor(_url: string) {
    registerFake(this);
  }
  send(data: string) {
    if (this.readyState !== FakeWebSocket.OPEN) return false;
    this.sent.push(data);
    return true;
  }
  close(code = 1000, reason = '') {
    this.readyState = 3;
    if (this.onclose) this.onclose({ code, reason });
  }
  // Test helpers
  markOpen() {
    this.readyState = 1;
    if (this.onopen) this.onopen();
  }
  markMessage(data: string) {
    if (this.onmessage) this.onmessage({ data });
  }
  markClose(code = 1006, reason = 'abnormal') {
    this.readyState = 3;
    if (this.onclose) this.onclose({ code, reason });
  }
}

let lastFake: FakeWebSocket | null = null;
function registerFake(f: FakeWebSocket) {
  lastFake = f;
}
(globalThis as any).__getLastFake = () => lastFake;
(globalThis as any).__clearLastFake = () => {
  lastFake = null;
};

(globalThis as any).WebSocket = FakeWebSocket;

// ----------------------------------------------------------------------------
// react-native (avoids parsing the upstream Flow entry point)
// ----------------------------------------------------------------------------

vi.mock('react-native', () => {
  function select(s) {
    if (s && s.ios) return s.ios;
    if (s && s.web) return s.web;
    return s ? s.default : undefined;
  }
  return {
    Platform: { OS: 'ios', select },
    View: (props) => props,
    Text: (props) => props,
    Image: (props) => props,
    ScrollView: (props) => props,
    Pressable: (props) => props,
    Animated: {
      View: (props) => props,
      Text: (props) => props,
      Image: (props) => props,
      ScrollView: (props) => props,
    },
    StyleSheet: {
      create: (s) => s,
      absoluteFill: {},
      hairlineWidth: 1,
    },
    Dimensions: { get: () => ({ width: 320, height: 640 }) },
    AccessibilityInfo: {
      isReduceMotionEnabled: async () => false,
      addEventListener: () => ({ remove: () => {} }),
    },
  };
});