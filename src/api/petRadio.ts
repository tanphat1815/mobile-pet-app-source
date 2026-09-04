/**
 * Pet Radio — AI-Curated playlists (Step 12b)
 *
 * Ported from desktop src/core/music/pet-radio.js.
 *
 * Pure functions that take pet stats + personality + time-of-day and
 * return a ranked list of tracks. No side-effects, no audio engine.
 */

import {
  BUILTIN_TRACKS,
  MOOD_PLAYLISTS,
  type MoodPlaylist,
  type Track,
} from './music';

export interface PetStats {
  happiness?: number; // 0..100
  energy?: number;    // 0..100
  hunger?: number;    // 0..100
  health?: number;   // 0..100
}

export interface PersonalityTraits {
  // Big Five - simplified for taste computation
  openness?: number;     // 0..1
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
}

export interface RadioMood {
  id: string;
  label: string;
}

export type TimeOfDay = 'Sáng sớm' | 'Buổi trưa' | 'Buổi chiều' | 'Buổi tối' | 'Đêm khuya';

export interface RadioPlaylist {
  id: string;
  name: string;
  description: string;
  icon: string;
  moodId: string;
  timeOfDay: TimeOfDay;
  tracks: Track[];
  recommendedTrack: Track | null;
}

interface MusicTaste {
  preferredGenres: Set<string>;
  preferredTempo: number;
  energyRange: [number, number];
}

// ============================================================================
// Mood detection
// ============================================================================

export function determineMood(stats: PetStats): RadioMood {
  const happiness = Number(stats.happiness ?? 70);
  const energy = Number(stats.energy ?? 80);

  if (energy < 30) {
    return { id: 'sleep', label: 'Buồn ngủ & Cần nghỉ ngơi' };
  }
  if (happiness > 80 && energy > 60) {
    return { id: 'happy', label: 'Vui vẻ & Hứng khởi' };
  }
  if (happiness < 40) {
    return { id: 'sad', label: 'Buồn bã & Cần xoa dịu' };
  }
  if (energy > 80) {
    return { id: 'workout', label: 'Tràn đầy năng lượng' };
  }
  return { id: 'focused', label: 'Bình tĩnh & Tập trung' };
}

// ============================================================================
// Time of day
// ============================================================================

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'Sáng sớm';
  if (hour >= 11 && hour < 14) return 'Buổi trưa';
  if (hour >= 14 && hour < 18) return 'Buổi chiều';
  if (hour >= 18 && hour < 22) return 'Buổi tối';
  return 'Đêm khuya';
}

// ============================================================================
// Music taste computation
// ============================================================================

function computeMusicTaste(
  personality: PersonalityTraits,
  mood: RadioMood,
  timeOfDay: TimeOfDay
): MusicTaste {
  const moodMeta = MOOD_PLAYLISTS[mood.id] ?? MOOD_PLAYLISTS.happy;

  // Base taste comes from the mood's preferred genres.
  const genres = new Set<string>(moodMeta.genres);

  // Personality nudges:
  //  - high openness → adds exotic genres (electronic, jazz)
  //  - low openness   → keeps simple pop/chiptune
  const openness = personality.openness ?? 0.5;
  if (openness > 0.7) {
    genres.add('electronic');
    genres.add('jazz');
  } else if (openness < 0.3) {
    genres.add('pop');
    genres.add('chiptune');
  }

  // Time-of-day tempo modifiers
  let tempo = moodMeta.preferredTempo;
  if (timeOfDay === 'Đêm khuya') tempo -= 10;
  if (timeOfDay === 'Sáng sớm') tempo += 10;

  return {
    preferredGenres: genres,
    preferredTempo: tempo,
    energyRange: moodMeta.id === 'sleep'
      ? [0, 0.4]
      : moodMeta.id === 'workout'
        ? [0.7, 1]
        : [0.3, 0.9],
  };
}

// ============================================================================
// Track scoring
// ============================================================================

function scoreTrack(track: Track, taste: MusicTaste): number {
  let score = 0;

  // Genre match (+3 per match, capped at 6)
  if (taste.preferredGenres.has(track.genre)) {
    score += 3;
  }

  // Tempo proximity (within 20bpm = bonus)
  const tempoDelta = Math.abs(track.tempo - taste.preferredTempo);
  if (tempoDelta < 20) {
    score += 2 - tempoDelta / 20;
  }

  // Energy range match
  const [lo, hi] = taste.energyRange;
  if (track.energy >= lo && track.energy <= hi) {
    score += 2;
  }

  // Mood-tag match
  if (track.mood.includes(taste.preferredGenres.has('ambient') ? 'sleep' : 'happy')) {
    score += 0.5;
  }

  return score;
}

// ============================================================================
// Curator entry point
// ============================================================================

export function curateForPet(
  petStats: PetStats = {},
  personality: PersonalityTraits = {},
  timeOfDayOverride: TimeOfDay | null = null,
  playedTrackIds: string[] = []
): RadioPlaylist {
  const mood = determineMood(petStats);
  const timeOfDay = timeOfDayOverride ?? getTimeOfDay();
  const taste = computeMusicTaste(personality, mood, timeOfDay);

  const candidates = BUILTIN_TRACKS
    .filter((t) => !playedTrackIds.includes(t.id))
    .map((track) => ({ track, score: scoreTrack(track, taste) }))
    .sort((a, b) => b.score - a.score);

  // Fallback: if all tracks were filtered out, fall back to all
  const tracks = (candidates.length ? candidates : BUILTIN_TRACKS.map((track) => ({ track, score: scoreTrack(track, taste) })))
    .map(({ track, score }) => ({ ...track, relevanceScore: score }));

  const moodMeta: MoodPlaylist = MOOD_PLAYLISTS[mood.id] ?? MOOD_PLAYLISTS.happy;

  return {
    id: `pet_radio_${Date.now()}`,
    name: `📻 Pet Radio — ${moodMeta.name}`,
    description: `Tuyển tập nhạc được AI chọn riêng theo tâm trạng "${moodMeta.name}" (${timeOfDay})`,
    icon: moodMeta.icon || '📻',
    moodId: mood.id,
    timeOfDay,
    tracks,
    recommendedTrack: tracks[0] ?? null,
  };
}

// ============================================================================
// Personality → mood hint (used by mood-aware plays)
// ============================================================================

export function moodForPersonality(personality: PersonalityTraits): RadioMood {
  const extra = personality.extraversion ?? 0.5;
  const neuro = personality.neuroticism ?? 0.5;

  if (extra > 0.7 && neuro < 0.4) return { id: 'happy', label: 'Vui vẻ' };
  if (neuro > 0.7) return { id: 'sad', label: 'Cần xoa dịu' };
  if (extra < 0.3) return { id: 'focused', label: 'Tập trung' };
  return { id: 'happy', label: 'Vui vẻ' };
}
