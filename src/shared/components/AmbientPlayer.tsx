/**
 * AmbientPlayer
 *
 * Audio mixer for ambient sounds. On web, falls back to a synthesized
 * noise/tone generator (WebAudio) so the player works without bundled
 * MP3 assets. On native, attempts to play the asset URL via `expo-av`
 * (lazy-loaded) and silently degrades if unavailable.
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { CustomSlider } from './CustomSlider';
import { useTheme } from '../../utils/useTheme';
import { AMBIENT_SOUNDS, AmbientSound } from '../../api/ambientSounds';
import { hapticLight } from '../../utils/haptics';

// ============================================================================
// WebAudio synth helper — only used on web when asset URL fails
// ============================================================================

type WebAudioSource = {
  start: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  isRunning: () => boolean;
};

function makeNoiseSource(ctx: AudioContext, cutoffHz: number): WebAudioSource {
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoffHz;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  return {
    start: () => {
      noise.start();
    },
    stop: () => {
      try {
        noise.stop();
      } catch {
        /* already stopped */
      }
    },
    setVolume: (v) => {
      gain.gain.value = Math.max(0, Math.min(1, v));
    },
    isRunning: () => Math.abs(gain.gain.value) > 0.001,
  };
}

function makeToneSource(ctx: AudioContext, frequency: number): WebAudioSource {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(ctx.destination);
  return {
    start: () => {
      try {
        osc.start();
      } catch {
        /* already started */
      }
    },
    stop: () => {
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
    },
    setVolume: (v) => {
      gain.gain.value = Math.max(0, Math.min(1, v));
    },
    isRunning: () => Math.abs(gain.gain.value) > 0.001,
  };
}

// ============================================================================
// Component
// ============================================================================

interface PlayingSound {
  sound: AmbientSound;
  volume: number;
  source?: WebAudioSource;
  audioEl?: HTMLAudioElement;
}

export interface AmbientPlayerProps {
  testID?: string;
}

export function AmbientPlayer({ testID }: AmbientPlayerProps) {
  const theme = useTheme();
  const [playing, setPlaying] = useState<Record<string, PlayingSound>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(playing).forEach((p) => {
        p.source?.stop();
        if (p.audioEl) p.audioEl.pause();
      });
      try {
        audioCtxRef.current?.close();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (audioCtxRef.current) return audioCtxRef.current;
    const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioCtxRef.current = new Ctor();
    return audioCtxRef.current;
  }, []);

  const handleToggle = useCallback(
    async (sound: AmbientSound) => {
      hapticLight();
      setPlaying((prev) => {
        const existing = prev[sound.id];
        if (existing) {
          // Toggle off
          existing.source?.stop();
          if (existing.audioEl) existing.audioEl.pause();
          const next = { ...prev };
          delete next[sound.id];
          return next;
        }
        // Toggle on
        const newEntry: PlayingSound = { sound, volume: sound.synth?.defaultVolume ?? 0.5 };
        const ctx = ensureAudioCtx();
        if (ctx && sound.synth) {
          if (sound.synth.type === 'noise') {
            const src = makeNoiseSource(ctx, sound.synth.cutoffHz ?? 2000);
            src.start();
            src.setVolume(newEntry.volume);
            newEntry.source = src;
          } else if (sound.synth.type === 'sine' || sound.synth.type === 'triangle') {
            const src = makeToneSource(ctx, sound.synth.frequency ?? 200);
            src.start();
            src.setVolume(newEntry.volume);
            newEntry.source = src;
          }
        }
        // Also try the asset URL if available
        if (sound.assetUrl && typeof document !== 'undefined') {
          try {
            const audioEl = new Audio(sound.assetUrl);
            audioEl.loop = true;
            audioEl.volume = newEntry.volume;
            audioEl.play().catch(() => {
              // autoplay may be blocked; user can tap again
            });
            newEntry.audioEl = audioEl;
          } catch {
            /* ignore */
          }
        }
        return { ...prev, [sound.id]: newEntry };
      });
    },
    [ensureAudioCtx]
  );

  const handleVolumeChange = useCallback((id: string, value: number) => {
    setPlaying((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      existing.source?.setVolume(value);
      if (existing.audioEl) existing.audioEl.volume = value;
      return {
        ...prev,
        [id]: { ...existing, volume: value },
      };
    });
  }, []);

  const isPlaying = (id: string) => !!playing[id];
  const volume = (id: string) => playing[id]?.volume ?? 0;

  return (
    <ScrollView
      testID={testID ?? 'ambient-player'}
      contentContainerStyle={styles.content}
    >
      <Text
        style={[styles.heading, { color: theme.colors.text }]}
      >
        Ambient soundscape
      </Text>
      <Text
        style={[styles.subtitle, { color: theme.colors.textSecondary }]}
      >
        Mix sounds to create your calm space
      </Text>

      <View style={{ height: 12 }} />

      {AMBIENT_SOUNDS.map((sound) => {
        const on = isPlaying(sound.id);
        return (
          <View
            key={sound.id}
            testID={`ambient-row-${sound.id}`}
            style={[
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.separator,
              },
            ]}
          >
            <View style={styles.rowHeader}>
              <Pressable
                onPress={() => handleToggle(sound)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: on
                      ? theme.colors.accent
                      : theme.colors.surfaceMuted,
                  },
                ]}
                testID={`ambient-toggle-${sound.id}`}
              >
                <Text style={{ fontSize: 24 }}>{sound.emoji}</Text>
              </Pressable>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.colors.text },
                  ]}
                >
                  {sound.label}
                </Text>
                <Text
                  style={[
                    styles.description,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {sound.description}
                </Text>
              </View>
              <Text
                style={[
                  styles.status,
                  {
                    color: on ? theme.colors.success : theme.colors.textSecondary,
                  },
                ]}
              >
                {on ? 'On' : 'Off'}
              </Text>
            </View>
            {on && (
              <View style={{ marginTop: 8 }}>
                <CustomSlider
                  value={volume(sound.id)}
                  onChange={(v) => handleVolumeChange(sound.id, v)}
                  fillColor={theme.colors.accent}
                  testID={`ambient-slider-${sound.id}`}
                  height={30}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  row: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    marginBottom: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: '700',
  },
});
