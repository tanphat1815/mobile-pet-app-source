/**
 * Step 12b — Music domain unit tests.
 *
 * Cover:
 *  - formatMusicTime formats 0/seconds/minutes correctly
 *  - getCurrentLyric: returns null for empty/no-match
 *  - getCurrentLyric: returns the most recent line ≤ currentTime
 *  - getTrackById: found / not found
 *  - getMoodPlaylist: found / not found
 *  - getEQPresetByKey: found / falls back to flat
 *  - BUILTIN_TRACKS has 6 entries with required fields
 *  - EQ_PRESETS has 8 entries with bass/mid/treble
 *  - MOOD_PLAYLISTS has 6 moods
 *  - SLEEP_TIMER_PRESETS has 15/30/45/60
 *  - MusicStore: play, pause, next, previous, toggle
 *  - MusicStore: setEQ, applyEQPreset
 *  - PetRadio: determineMood (5 branches)
 *  - PetRadio: getTimeOfDay branches
 *  - PetRadio: curateForPet returns ranked list
 *  - PetRadio: curateForPet filters out played tracks
 *  - PetRadio: moodForPersonality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatMusicTime,
  getCurrentLyric,
  getTrackById,
  getMoodPlaylist,
  getEQPresetByKey,
  BUILTIN_TRACKS,
  EQ_PRESETS,
  MOOD_PLAYLISTS,
  SLEEP_TIMER_PRESETS,
  type Track,
} from '@/api/music';
import {
  determineMood,
  getTimeOfDay,
  curateForPet,
  moodForPersonality,
} from '@/api/petRadio';
import { useMusicStore } from '@/stores/MusicStore';

describe('formatMusicTime', () => {
  it('formats 0', () => expect(formatMusicTime(0)).toBe('0:00'));
  it('formats seconds < 60', () => expect(formatMusicTime(45)).toBe('0:45'));
  it('formats minutes', () => expect(formatMusicTime(125)).toBe('2:05'));
  it('handles negative', () => expect(formatMusicTime(-10)).toBe('0:00'));
});

describe('getCurrentLyric', () => {
  const t: Track = {
    id: 't',
    title: 'T',
    artist: 'A',
    album: 'Al',
    genre: 'g',
    cover: '🎵',
    coverBg: 'g',
    duration: 60,
    source: 'procedural',
    mood: [],
    energy: 0.5,
    tempo: 100,
    notes: [],
    chords: [],
    lyrics: [
      { time: 0, text: 'A' },
      { time: 5, text: 'B' },
      { time: 15, text: 'C' },
    ],
  };
  it('returns null for null track', () => expect(getCurrentLyric(null, 0)).toBeNull());
  it('returns null for no lyrics', () => expect(getCurrentLyric({ ...t, lyrics: [] }, 5)).toBeNull());
  it('returns line at exact time', () => expect(getCurrentLyric(t, 5)?.text).toBe('B'));
  it('returns last line ≤ current time', () => expect(getCurrentLyric(t, 8)?.text).toBe('B'));
  it('returns first line if before any lyric', () => expect(getCurrentLyric(t, -1)?.text).toBe('A'));
});

describe('getTrackById', () => {
  it('finds existing', () => expect(getTrackById('track_happy_chiptune')?.title).toBeTruthy());
  it('returns null for unknown', () => expect(getTrackById('nope')).toBeNull());
});

describe('getMoodPlaylist', () => {
  it('finds happy', () => expect(getMoodPlaylist('happy')?.icon).toBe('😊'));
  it('returns null for unknown', () => expect(getMoodPlaylist('xyz')).toBeNull());
});

describe('getEQPresetByKey', () => {
  it('finds bass_boost', () => expect(getEQPresetByKey('bass_boost').bass).toBe(6));
  it('falls back to flat', () => expect(getEQPresetByKey('unknown').bass).toBe(0));
});

describe('BUILTIN_TRACKS catalog', () => {
  it('has 6 tracks', () => expect(BUILTIN_TRACKS).toHaveLength(6));
  it('all tracks have required fields', () => {
    for (const t of BUILTIN_TRACKS) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.duration).toBeGreaterThan(0);
      expect(t.notes.length).toBeGreaterThan(0);
      expect(t.chords.length).toBeGreaterThan(0);
      expect(t.source).toBe('procedural');
    }
  });
});

describe('EQ_PRESETS', () => {
  it('has 8 presets', () => expect(Object.keys(EQ_PRESETS)).toHaveLength(8));
  it('all presets have bass/mid/treble', () => {
    for (const p of Object.values(EQ_PRESETS)) {
      expect(typeof p.bass).toBe('number');
      expect(typeof p.mid).toBe('number');
      expect(typeof p.treble).toBe('number');
    }
  });
});

describe('MOOD_PLAYLISTS', () => {
  it('has 6 moods', () => expect(Object.keys(MOOD_PLAYLISTS)).toHaveLength(6));
  it('has happy/sad/focused/sleep/workout/romantic', () => {
    for (const id of ['happy', 'sad', 'focused', 'sleep', 'workout', 'romantic']) {
      expect(MOOD_PLAYLISTS[id]).toBeTruthy();
    }
  });
});

describe('SLEEP_TIMER_PRESETS', () => {
  it('has 15/30/45/60', () => {
    expect(SLEEP_TIMER_PRESETS).toContain(15);
    expect(SLEEP_TIMER_PRESETS).toContain(30);
    expect(SLEEP_TIMER_PRESETS).toContain(45);
    expect(SLEEP_TIMER_PRESETS).toContain(60);
  });
});

describe('MusicStore', () => {
  beforeEach(() => {
    useMusicStore.getState().reset();
  });

  it('starts with default state', () => {
    const s = useMusicStore.getState();
    expect(s.queue).toHaveLength(6);
    expect(s.isPlaying).toBe(false);
    expect(s.volume).toBe(0.7);
    expect(s.repeat).toBe('all');
  });

  it('play() sets track + isPlaying', () => {
    const track = BUILTIN_TRACKS[0];
    useMusicStore.getState().play(track);
    const s = useMusicStore.getState();
    expect(s.currentTrack?.id).toBe(track.id);
    expect(s.isPlaying).toBe(true);
    expect(s.currentTime).toBe(0);
  });

  it('pause() sets isPlaying false', () => {
    useMusicStore.getState().play();
    useMusicStore.getState().pause();
    expect(useMusicStore.getState().isPlaying).toBe(false);
  });

  it('togglePlay() flips state', () => {
    useMusicStore.getState().togglePlay();
    expect(useMusicStore.getState().isPlaying).toBe(true);
    useMusicStore.getState().togglePlay();
    expect(useMusicStore.getState().isPlaying).toBe(false);
  });

  it('next() advances queue index', () => {
    const first = BUILTIN_TRACKS[0].id;
    useMusicStore.getState().play(BUILTIN_TRACKS[0]);
    expect(useMusicStore.getState().currentTrack?.id).toBe(first);
    useMusicStore.getState().next();
    // After next, current track should change
    expect(useMusicStore.getState().currentTrack?.id).not.toBe(first);
  });

  it('seek() clamps to duration', () => {
    useMusicStore.getState().play(BUILTIN_TRACKS[0]);
    useMusicStore.getState().seek(99999);
    expect(useMusicStore.getState().currentTime).toBeLessThanOrEqual(BUILTIN_TRACKS[0].duration);
  });

  it('setVolume() clamps 0..1', () => {
    useMusicStore.getState().setVolume(2);
    expect(useMusicStore.getState().volume).toBe(1);
    useMusicStore.getState().setVolume(-1);
    expect(useMusicStore.getState().volume).toBe(0);
  });

  it('setEQ() clamps -12..+12', () => {
    useMusicStore.getState().setEQ('bass', 100);
    expect(useMusicStore.getState().eq.bass).toBe(12);
    useMusicStore.getState().setEQ('bass', -100);
    expect(useMusicStore.getState().eq.bass).toBe(-12);
  });

  it('applyEQPreset() updates all bands', () => {
    useMusicStore.getState().applyEQPreset('bass_boost');
    expect(useMusicStore.getState().eq.bass).toBe(6);
  });

  it('setSleepTimer() sets endAt', () => {
    useMusicStore.getState().setSleepTimer(30);
    expect(useMusicStore.getState().sleepTimerEndAt).toBeGreaterThan(Date.now());
    useMusicStore.getState().setSleepTimer(null);
    expect(useMusicStore.getState().sleepTimerEndAt).toBeNull();
  });

  it('tickProgress() increments currentTime when playing', () => {
    useMusicStore.getState().play(BUILTIN_TRACKS[0]);
    const before = useMusicStore.getState().currentTime;
    useMusicStore.getState().tickProgress(2);
    expect(useMusicStore.getState().currentTime).toBe(before + 2);
  });
});

describe('PetRadio: determineMood', () => {
  it('returns sleep when energy < 30', () => {
    expect(determineMood({ happiness: 80, energy: 10 }).id).toBe('sleep');
  });
  it('returns happy when happiness > 80 + energy > 60', () => {
    expect(determineMood({ happiness: 90, energy: 80 }).id).toBe('happy');
  });
  it('returns sad when happiness < 40', () => {
    expect(determineMood({ happiness: 20, energy: 50 }).id).toBe('sad');
  });
  it('returns workout when energy > 80', () => {
    expect(determineMood({ happiness: 60, energy: 90 }).id).toBe('workout');
  });
  it('returns focused by default', () => {
    expect(determineMood({ happiness: 60, energy: 50 }).id).toBe('focused');
  });
});

describe('PetRadio: getTimeOfDay', () => {
  it('morning 7am', () => {
    expect(getTimeOfDay(new Date('2026-09-04T07:00:00'))).toBe('Sáng sớm');
  });
  it('noon 12pm', () => {
    expect(getTimeOfDay(new Date('2026-09-04T12:00:00'))).toBe('Buổi trưa');
  });
  it('afternoon 4pm', () => {
    expect(getTimeOfDay(new Date('2026-09-04T16:00:00'))).toBe('Buổi chiều');
  });
  it('evening 8pm', () => {
    expect(getTimeOfDay(new Date('2026-09-04T20:00:00'))).toBe('Buổi tối');
  });
  it('night 2am', () => {
    expect(getTimeOfDay(new Date('2026-09-04T02:00:00'))).toBe('Đêm khuya');
  });
});

describe('PetRadio: curateForPet', () => {
  it('returns ranked playlist', () => {
    const playlist = curateForPet({ happiness: 90, energy: 80 }, {}, 'Buổi trưa');
    expect(playlist.tracks.length).toBeGreaterThan(0);
    expect(playlist.recommendedTrack).toBeTruthy();
    expect(playlist.moodId).toBe('happy');
    expect(playlist.tracks[0].relevanceScore).toBeGreaterThanOrEqual(
      playlist.tracks[playlist.tracks.length - 1].relevanceScore
    );
  });

  it('filters out played tracks', () => {
    const playedIds = BUILTIN_TRACKS.slice(0, 5).map((t) => t.id);
    const playlist = curateForPet({ happiness: 90, energy: 80 }, {}, null, playedIds);
    const remainingIds = playlist.tracks.map((t) => t.id);
    for (const id of playedIds) {
      expect(remainingIds).not.toContain(id);
    }
  });

  it('falls back when all tracks played', () => {
    const allIds = BUILTIN_TRACKS.map((t) => t.id);
    const playlist = curateForPet({ happiness: 90, energy: 80 }, {}, null, allIds);
    // Falls back to full catalog
    expect(playlist.tracks.length).toBe(BUILTIN_TRACKS.length);
  });
});

describe('PetRadio: moodForPersonality', () => {
  it('happy for high extraversion, low neuroticism', () => {
    expect(moodForPersonality({ extraversion: 0.9, neuroticism: 0.2 }).id).toBe('happy');
  });
  it('sad for high neuroticism', () => {
    expect(moodForPersonality({ extraversion: 0.5, neuroticism: 0.9 }).id).toBe('sad');
  });
  it('focused for low extraversion', () => {
    expect(moodForPersonality({ extraversion: 0.1, neuroticism: 0.4 }).id).toBe('focused');
  });
});
