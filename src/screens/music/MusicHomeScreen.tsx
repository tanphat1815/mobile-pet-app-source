/**
 * MusicHomeScreen — Step 12b entry screen
 *
 * Tab layout:
 *  - Player (now-playing card + lyrics)
 *  - Tracks (browse 6 built-in tracks)
 *  - Mood (6 mood playlists)
 *  - Radio (AI-curated Pet Radio)
 *  - EQ (3-band equalizer + presets + sleep timer)
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../utils/useTheme';
import { hapticLight } from '../../utils/haptics';
import { useMusicStore } from '../../stores/MusicStore';
import { MusicPlayer } from '../../shared/components/MusicPlayer';
import { LyricsView } from '../../shared/components/LyricsView';
import { EqualizerPanel } from '../../shared/components/EqualizerPanel';
import { SleepTimerControl } from '../../shared/components/SleepTimerControl';
import { MusicSynthEngine } from '../../api/musicSynthEngine';
import { BUILTIN_TRACKS, MOOD_PLAYLISTS, type Track } from '../../api/music';
import {
  curateForPet,
  determineMood,
  getTimeOfDay,
  type PetStats,
  type PersonalityTraits,
} from '../../api/petRadio';

type Tab = 'player' | 'tracks' | 'mood' | 'radio' | 'eq';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'player', label: 'Player', icon: '🎵' },
  { id: 'tracks', label: 'Bài hát', icon: '📀' },
  { id: 'mood', label: 'Tâm trạng', icon: '😊' },
  { id: 'radio', label: 'Pet Radio', icon: '📻' },
  { id: 'eq', label: 'EQ', icon: '🎚️' },
];

export function MusicHomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('player');

  const play = useMusicStore((s) => s.play);
  const tickProgress = useMusicStore((s) => s.tickProgress);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const setEngine = useMusicStore((s) => s.setEngine);

  // ── Mount synth engine + progress ticker ──
  useEffect(() => {
    const engine = new MusicSynthEngine();
    setEngine(engine);
    return () => {
      engine.stop();
      setEngine(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => tickProgress(1), 1000);
    return () => clearInterval(id);
  }, [isPlaying, tickProgress]);

  // ── Hydrate persisted state ──
  useEffect(() => {
    void useMusicStore.getState().hydrate();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>🎵 Music Player</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Nghe nhạc cùng bé pet — 6 bản nhạc độc quyền
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        style={[styles.tabsScroll, { borderBottomColor: theme.colors.border }]}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => { hapticLight(); setTab(t.id); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`music-tab-${t.id}`}
              style={[
                styles.tab,
                {
                  borderBottomColor: active ? theme.colors.accent : 'transparent',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: active ? '700' : '500',
                  color: active ? theme.colors.accent : theme.colors.textSecondary,
                }}
              >
                {t.icon} {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Body */}
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 24 },
        ]}
      >
        {tab === 'player' && (
          <View>
            <MusicPlayer testID="music-player" />
            {currentTrack && (
              <View style={{ marginTop: 12 }}>
                <LyricsView testID="music-lyrics" />
              </View>
            )}
            <View style={{ marginTop: 12 }}>
              <SleepTimerControl testID="music-sleep-timer" />
            </View>
          </View>
        )}
        {tab === 'tracks' && <TracksList onPlay={(t) => play(t)} />}
        {tab === 'mood' && <MoodGrid onPlay={(t) => play(t)} />}
        {tab === 'radio' && <RadioPanel onPlay={(t) => play(t)} />}
        {tab === 'eq' && (
          <View>
            <EqualizerPanel testID="music-eq" />
            <View style={{ marginTop: 12 }}>
              <SleepTimerControl testID="music-sleep-timer-eq" />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-views ────────────────────────────────────────────────

function TracksList({ onPlay }: { onPlay: (t: Track) => void }) {
  const theme = useTheme();
  const currentTrack = useMusicStore((s) => s.currentTrack);

  return (
    <View testID="music-tracks-list">
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Bài hát gợi ý</Text>
      {BUILTIN_TRACKS.map((track) => {
        const isCurrent = currentTrack?.id === track.id;
        return (
          <Pressable
            key={track.id}
            onPress={() => { hapticLight(); onPlay(track); }}
            testID={`track-${track.id}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isCurrent }}
            style={[
              styles.row,
              {
                backgroundColor: isCurrent ? theme.colors.surfaceAlt : theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <View
              style={[
                styles.trackCover,
                {
                  backgroundColor: theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 24 }}>{track.cover}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={[styles.trackTitle, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {track.title}
              </Text>
              <Text
                style={[styles.trackArtist, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {track.artist}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
                  ♪ {track.genre} • {track.tempo} BPM
                </Text>
              </View>
            </View>
            <Text
              style={[
                styles.trackDuration,
                { color: isCurrent ? theme.colors.accent : theme.colors.textSecondary },
              ]}
            >
              {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, '0')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MoodGrid({ onPlay }: { onPlay: (t: Track) => void }) {
  const theme = useTheme();
  const [activeMood, setActiveMood] = useState<string | null>(null);

  return (
    <View testID="music-mood-grid">
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Chọn tâm trạng</Text>
      <View style={styles.moodGrid}>
        {Object.values(MOOD_PLAYLISTS).map((m) => {
          const isActive = activeMood === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => { hapticLight(); setActiveMood(m.id === activeMood ? null : m.id); }}
              testID={`mood-${m.id}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.moodCard,
                {
                  backgroundColor: isActive ? m.color + '33' : theme.colors.surface,
                  borderColor: isActive ? m.color : theme.colors.border,
                  borderRadius: theme.radius.lg,
                },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{m.icon}</Text>
              <Text
                style={[styles.moodName, { color: theme.colors.text }]}
                numberOfLines={2}
              >
                {m.name}
              </Text>
              <Text
                style={[styles.moodDesc, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
              >
                {m.description}
              </Text>
              <Text style={[styles.moodMeta, { color: m.color }]}>
                ♪ {m.preferredTempo} BPM
              </Text>
            </Pressable>
          );
        })}
      </View>

      {activeMood && (
        <View style={{ marginTop: 16 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Danh sách phát: {MOOD_PLAYLISTS[activeMood].name}
          </Text>
          {BUILTIN_TRACKS.filter((t) =>
            MOOD_PLAYLISTS[activeMood].genres.includes(t.genre) ||
            t.mood.some((m) => m === activeMood)
          ).map((track) => (
            <Pressable
              key={`mood-${activeMood}-${track.id}`}
              onPress={() => { hapticLight(); onPlay(track); }}
              testID={`mood-track-${track.id}`}
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>{track.cover}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {track.title}
                </Text>
                <Text style={[styles.trackArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {track.artist}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function RadioPanel({ onPlay }: { onPlay: (t: Track) => void }) {
  const theme = useTheme();
  const [petStats] = useState<PetStats>({ happiness: 75, energy: 60, hunger: 50, health: 80 });
  const [personality] = useState<PersonalityTraits>({
    openness: 0.6,
    conscientiousness: 0.5,
    extraversion: 0.6,
    agreeableness: 0.7,
    neuroticism: 0.4,
  });

  const mood = determineMood(petStats);
  const tod = getTimeOfDay();
  const playlist = curateForPet(petStats, personality, tod);
  const moodMeta = MOOD_PLAYLISTS[mood.id] ?? MOOD_PLAYLISTS.happy;

  return (
    <View testID="music-radio-panel">
      <View
        style={[
          styles.radioBanner,
          {
            backgroundColor: moodMeta.color + '22',
            borderColor: moodMeta.color,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Text style={{ fontSize: 36 }}>{moodMeta.icon}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.radioTitle, { color: theme.colors.text }]}>
            Pet Radio · {moodMeta.name}
          </Text>
          <Text style={[styles.radioSub, { color: theme.colors.textSecondary }]}>
            {tod} • Tâm trạng pet: {mood.label}
          </Text>
          <Text style={[styles.radioDesc, { color: theme.colors.textSecondary }]}>
            {playlist.description}
          </Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 16 }]}>
        📻 Được AI tuyển chọn
      </Text>
      {playlist.tracks.map((track, idx) => (
        <Pressable
          key={`radio-${track.id}-${idx}`}
          onPress={() => { hapticLight(); onPlay(track); }}
          testID={`radio-track-${track.id}`}
          style={[
            styles.row,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Text style={[styles.radioIdx, { color: theme.colors.textSecondary }]}>
            {(idx + 1).toString().padStart(2, '0')}
          </Text>
          <Text style={{ fontSize: 22, marginHorizontal: 8 }}>{track.cover}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.trackTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={[styles.trackArtist, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
          {(track as any).relevanceScore !== undefined && (
            <Text style={[styles.scoreChip, { color: theme.colors.accent }]}>
              ★ {(((track as any).relevanceScore as number) || 0).toFixed(1)}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 12, borderBottomWidth: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },

  tabsScroll: { borderBottomWidth: 1 },
  tabsRow: { paddingHorizontal: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },

  body: { padding: 16 },

  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  trackCover: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackTitle: { fontSize: 14, fontWeight: '700' },
  trackArtist: { fontSize: 12, marginTop: 1 },
  metaRow: { flexDirection: 'row', marginTop: 2 },
  meta: { fontSize: 11 },
  trackDuration: { fontSize: 12, fontVariant: ['tabular-nums'] },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodCard: {
    width: '48%',
    borderWidth: 1,
    padding: 12,
  },
  moodName: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  moodDesc: { fontSize: 11, marginTop: 2 },
  moodMeta: { fontSize: 11, marginTop: 4, fontWeight: '700' },

  radioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
  },
  radioTitle: { fontSize: 14, fontWeight: '700' },
  radioSub: { fontSize: 12, marginTop: 2 },
  radioDesc: { fontSize: 11, marginTop: 4 },

  radioIdx: { fontSize: 18, fontWeight: '800', width: 28, textAlign: 'center' },
  scoreChip: { fontSize: 12, fontWeight: '700' },
});
