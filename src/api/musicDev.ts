/**
 * Music dev exposes — Step 12b e2e
 *
 * Side-effect module installed when running in __DEV__ mode. Adds
 * window hooks that allow the Playwright e2e tests to drive the
 * MusicStore + PetRadio without rendering screens.
 */

import {
  BUILTIN_TRACKS,
  EQ_PRESETS,
  MOOD_PLAYLISTS,
  formatMusicTime,
  getTrackById,
} from './music';
import {
  determineMood,
  curateForPet,
  type PetStats,
  type PersonalityTraits,
} from './petRadio';
import { useMusicStore } from '../stores/MusicStore';

if (typeof globalThis !== 'undefined' && (globalThis as any).__DEV__) {
  // Catalog reads
  (globalThis as any).__MUSIC_TRACK_COUNT__ = BUILTIN_TRACKS.length;
  (globalThis as any).__MUSIC_TRACK_IDS__ = BUILTIN_TRACKS.map((t) => t.id);
  (globalThis as any).__MUSIC_EQ_PRESET_KEYS__ = Object.keys(EQ_PRESETS);
  (globalThis as any).__MUSIC_EQ_PRESET_COUNT__ = Object.keys(EQ_PRESETS).length;
  (globalThis as any).__MUSIC_MOOD_COUNT__ = Object.keys(MOOD_PLAYLISTS).length;
  (globalThis as any).__MUSIC_FORMAT_TIME__ = formatMusicTime;

  // Store actions
  (globalThis as any).__MUSIC_PLAY_TRACK__ = (id: string) => {
    const track = getTrackById(id);
    if (!track) return { error: 'not_found', trackId: id };
    useMusicStore.getState().play(track);
    const s = useMusicStore.getState();
    return { trackId: s.currentTrack?.id, isPlaying: s.isPlaying };
  };
  (globalThis as any).__MUSIC_TOGGLE_PLAY__ = () => {
    useMusicStore.getState().togglePlay();
    return useMusicStore.getState().isPlaying;
  };
  (globalThis as any).__MUSIC_SET_EQ__ = (band: 'bass' | 'mid' | 'treble', value: number) => {
    useMusicStore.getState().setEQ(band, value);
    return useMusicStore.getState().eq;
  };
  (globalThis as any).__MUSIC_APPLY_PRESET__ = (key: string) => {
    useMusicStore.getState().applyEQPreset(key);
    return useMusicStore.getState().eq;
  };

  // PetRadio
  (globalThis as any).__PET_RADIO_MOOD__ = (stats: PetStats) => determineMood(stats);
  (globalThis as any).__PET_RADIO_CURATE__ = (
    stats: PetStats,
    personality: PersonalityTraits,
    tod: string | null
  ) => {
    const playlist = curateForPet(stats, personality, tod as any);
    return {
      id: playlist.id,
      moodId: playlist.moodId,
      timeOfDay: playlist.timeOfDay,
      tracks: playlist.tracks.map((t: any) => ({
        id: t.id,
        title: t.title,
        relevanceScore: t.relevanceScore ?? 0,
      })),
    };
  };

  // Mirror to window for Playwright
  if (typeof window !== 'undefined') {
    const w = window as any;
    w.__MUSIC_TRACK_COUNT__ = (globalThis as any).__MUSIC_TRACK_COUNT__;
    w.__MUSIC_TRACK_IDS__ = (globalThis as any).__MUSIC_TRACK_IDS__;
    w.__MUSIC_EQ_PRESET_KEYS__ = (globalThis as any).__MUSIC_EQ_PRESET_KEYS__;
    w.__MUSIC_EQ_PRESET_COUNT__ = (globalThis as any).__MUSIC_EQ_PRESET_COUNT__;
    w.__MUSIC_MOOD_COUNT__ = (globalThis as any).__MUSIC_MOOD_COUNT__;
    w.__MUSIC_FORMAT_TIME__ = (globalThis as any).__MUSIC_FORMAT_TIME__;
    w.__MUSIC_PLAY_TRACK__ = (globalThis as any).__MUSIC_PLAY_TRACK__;
    w.__MUSIC_TOGGLE_PLAY__ = (globalThis as any).__MUSIC_TOGGLE_PLAY__;
    w.__MUSIC_SET_EQ__ = (globalThis as any).__MUSIC_SET_EQ__;
    w.__MUSIC_APPLY_PRESET__ = (globalThis as any).__MUSIC_APPLY_PRESET__;
    w.__PET_RADIO_MOOD__ = (globalThis as any).__PET_RADIO_MOOD__;
    w.__PET_RADIO_CURATE__ = (globalThis as any).__PET_RADIO_CURATE__;
    // Tab ids (hard-coded from MusicHomeScreen)
    w.__MUSIC_TAB_IDS__ = ['player', 'tracks', 'mood', 'radio', 'eq'];
  }
}
