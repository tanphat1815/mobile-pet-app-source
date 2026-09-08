/**
 * Music Player Config — Step 12b
 *
 * - 6 procedural built-in tracks (Web Audio synth)
 * - 8 EQ presets (flat/bass_boost/vocal/rock/pop/jazz/electronic/acoustic)
 * - 6 mood playlists (happy/sad/focused/sleep/workout/romantic)
 * - 3 sleep timer presets
 *
 * Ported from desktop src/core/music/music-config.js (Step 74).
 */

export type MusicSource = 'procedural' | 'local' | 'pet_radio' | 'ambient';
export type RepeatMode = 'none' | 'one' | 'all';

export interface LyricLine {
  time: number; // seconds into track
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  cover: string;
  coverBg: string; // gradient string for cover
  duration: number; // seconds
  source: MusicSource;
  mood: string[];
  energy: number; // 0..1
  tempo: number; // bpm
  notes: number[]; // Hz
  chords: number[][]; // Hz arrays
  lyrics: LyricLine[];
}

export interface EQPreset {
  name: string;
  bass: number;
  mid: number;
  treble: number;
}

export interface MoodPlaylist {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  genres: string[];
  preferredTempo: number;
}

export const MUSIC_SOURCES: Record<string, MusicSource> = {
  PROCEDURAL: 'procedural',
  LOCAL: 'local',
  PET_RADIO: 'pet_radio',
  AMBIENT: 'ambient',
};

// ============================================================================
// EQ Presets − bass/mid/treble in dB (−12 .. +12)
// ============================================================================

export const EQ_PRESETS: Record<string, EQPreset> = {
  flat: { name: 'Mặc định (Flat)', bass: 0, mid: 0, treble: 0 },
  bass_boost: { name: 'Tăng Bass (Bass Boost)', bass: 6, mid: 0, treble: 0 },
  vocal: { name: 'Làm rõ Giọng hát (Vocal)', bass: -2, mid: 4, treble: 2 },
  rock: { name: 'Sôi động (Rock)', bass: 4, mid: 1, treble: 4 },
  pop: { name: 'Nhạc Pop (Pop)', bass: 1, mid: 2, treble: 2 },
  jazz: { name: 'Thư giãn (Jazz)', bass: 2, mid: -1, treble: 3 },
  electronic: { name: 'Điện tử (Electronic)', bass: 5, mid: 0, treble: 4 },
  acoustic: { name: 'Mộc (Acoustic)', bass: -1, mid: 2, treble: 3 },
};

// ============================================================================
// Mood Playlists
// ============================================================================

export const MOOD_PLAYLISTS: Record<string, MoodPlaylist> = {
  happy: {
    id: 'happy',
    name: 'Vui vẻ & Rộn ràng',
    icon: '😊',
    color: '#FFD700',
    description: 'Giai điệu vui tươi giúp bé pet luôn hứng khởi',
    genres: ['pop', 'chiptune', 'dance'],
    preferredTempo: 120,
  },
  sad: {
    id: 'sad',
    name: 'Thư giãn & Xoa dịu',
    icon: '😢',
    color: '#4A6FA5',
    description: 'Nhhẹ nhàng xoa dịu những lúc mệt mỏi, ủ rũ',
    genres: ['lofi', 'ambient', 'acoustic'],
    preferredTempo: 75,
  },
  focused: {
    id: 'focused',
    name: 'Tập trung làm việc',
    icon: '🎯',
    color: '#4ECDC4',
    description: 'Giai điệu êm dịu nâng cao hiệu suất công việc',
    genres: ['lofi', 'ambient', 'meditation'],
    preferredTempo: 80,
  },
  sleep: {
    id: 'sleep',
    name: 'Ru ngủ êm đềm',
    icon: '😴',
    color: '#6B5B95',
    description: 'Âm thanh êm ái đưa pet và bạn vào giấc ngủ ngon',
    genres: ['ambient', 'night', 'rain'],
    preferredTempo: 60,
  },
  workout: {
    id: 'workout',
    name: 'Năng lượng bùng nổ',
    icon: '⚡',
    color: '#FF6B6B',
    description: 'Nhịp điệu dồn dập kích thích vận động',
    genres: ['synthwave', 'electronic', 'rock'],
    preferredTempo: 130,
  },
  romantic: {
    id: 'romantic',
    name: 'Ngọt ngào tình cảm',
    icon: '💕',
    color: '#FF1493',
    description: 'Giai điệu ngọt ngào tăng gắn kết thân mật',
    genres: ['acoustic', 'pop', 'jazz'],
    preferredTempo: 95,
  },
};

// ============================================================================
// 6 Procedural Built-in Tracks
// ============================================================================

export const BUILTIN_TRACKS: Track[] = [
  {
    id: 'track_happy_chiptune',
    title: 'Nốt Nhạc Vui Tươi 🌟',
    artist: 'CyberPet Studio',
    album: 'Retro 8-Bit Adventures',
    genre: 'chiptune',
    cover: '🌟',
    coverBg: 'linear-gradient(135deg, #FF9500, #FF2D55)',
    duration: 180,
    source: MUSIC_SOURCES.PROCEDURAL,
    mood: ['happy', 'energetic'],
    energy: 0.85,
    tempo: 128,
    notes: [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25],
    chords: [
      [261.63, 329.63, 392.0],
      [349.23, 440.0, 523.25],
      [392.0, 493.88, 587.33],
      [220.0, 261.63, 329.63],
    ],
    lyrics: [
      { time: 0, text: '🎵 Nắng sớm mai bừng lên rực rỡ...' },
      { time: 6, text: '✨ Bé pet nhảy múa theo từng nốt nhạc vui' },
      { time: 14, text: '🐾 Cùng nhau dạo chơi khắp muôn nơi' },
      { time: 22, text: '🌟 Một ngày mới tràn đầy năng lượng!' },
    ],
  },
  {
    id: 'track_lofi_cafe',
    title: 'Góc Phố Chiều Mưa ☕',
    artist: 'CyberPet Chill Beats',
    album: 'Cozy Workspace Beats',
    genre: 'lofi',
    cover: '☕',
    coverBg: 'linear-gradient(135deg, #8E54E9, #4776E6)',
    duration: 210,
    source: MUSIC_SOURCES.PROCEDURAL,
    mood: ['calm', 'focused'],
    energy: 0.45,
    tempo: 80,
    notes: [220.0, 246.94, 261.63, 293.66, 329.63, 349.23, 392.0],
    chords: [
      [220.0, 261.63, 329.63, 392.0],
      [293.66, 349.23, 440.0, 523.25],
      [196.0, 246.94, 293.66, 349.23],
      [261.63, 329.63, 392.0, 493.88],
    ],
    lyrics: [
      { time: 0, text: '☕ Tách cà phê ấm trên bàn làm việc...' },
      { time: 8, text: '🌧️ Hạt mưa rơi nhẹ ngoài khung cửa kính' },
      { time: 18, text: '📖 Thư thái tập trung vào từng dòng chữ' },
      { time: 28, text: '🐱 Bé cưng nằm cuộn tròn ngủ ngoan' },
    ],
  },
  {
    id: 'track_night_rain',
    title: 'Khúc Hát Đêm Mưa 🌧️',
    artist: 'CyberPet Ambient Soundscape',
    album: 'Deep Sleep & Healing',
    genre: 'ambient',
    cover: '🌧️',
    coverBg: 'linear-gradient(135deg, #141E30, #243B55)',
    duration: 300,
    source: MUSIC_SOURCES.PROCEDURAL,
    mood: ['sleep', 'calm'],
    energy: 0.2,
    tempo: 60,
    notes: [174.61, 196.0, 220.0, 261.63, 293.66],
    chords: [
      [174.61, 220.0, 261.63],
      [220.0, 261.63, 329.63],
      [146.83, 174.61, 220.0],
    ],
    lyrics: [
      { time: 0, text: '🌙 Màn đêm buông xuống tĩnh lặng...' },
      { time: 10, text: '💤 Tiếng mưa rơi êm dịu vỗ về giấc ngủ' },
      { time: 25, text: '✨ Chúc bạn và bé pet ngủ ngon giấc mơ đẹp' },
    ],
  },
  {
    id: 'track_synthwave_neon',
    title: 'Cyber City Lights ⚡',
    artist: 'CyberPet Wave',
    album: 'Neon Cyberpunk 2077',
    genre: 'synthwave',
    cover: '⚡',
    coverBg: 'linear-gradient(135deg, #F953C6, #B91D73)',
    duration: 195,
    source: MUSIC_SOURCES.PROCEDURAL,
    mood: ['energetic', 'workout'],
    energy: 0.9,
    tempo: 122,
    notes: [130.81, 146.83, 164.81, 196.0, 220.0, 261.63],
    chords: [
      [130.81, 196.0, 261.63],
      [146.83, 220.0, 293.66],
      [110.0, 164.81, 220.0],
    ],
    lyrics: [
      { time: 0, text: '⚡ Ánh đèn Neon rực sáng bầu trời đêm' },
      { time: 7, text: '🏎️ Lướt qua đại lộ công nghệ tương lai' },
      { time: 15, text: '🔥 Đam mê cháy bỏng trong từng nhịp đập' },
    ],
  },
  {
    id: 'track_cute_walk',
    title: 'Dạo Chơi Cùng Pet 🐾',
    artist: 'CyberPet Friends',
    album: 'Happy Moments',
    genre: 'pop',
    cover: '🐾',
    coverBg: 'linear-gradient(135deg, #11998E, #38EF7D)',
    duration: 160,
    source: MUSIC_SOURCES.PROCEDURAL,
    mood: ['happy', 'romantic'],
    energy: 0.7,
    tempo: 112,
    notes: [261.63, 293.66, 329.63, 392.0, 440.0],
    chords: [
      [261.63, 329.63, 392.0],
      [349.23, 440.0, 523.25],
    ],
    lyrics: [
      { time: 0, text: '🐾 Tung tăng bước chân dạo phố xuân' },
      { time: 8, text: '🌸 Hoa khoe sắc thắm đón nắng mai' },
    ],
  },
  {
    id: 'track_deep_focus',
    title: 'Tập Trung Cao Độ 🧘',
    artist: 'Zen Mind & Focus',
    album: 'Alpha Waves Meditation',
    genre: 'ambient',
    cover: '🧘',
    coverBg: 'linear-gradient(135deg, #4CA1AF, #2C3E50)',
    duration: 240,
    source: MUSIC_SOURCES.PROCEDURAL,
    mood: ['focused', 'calm'],
    energy: 0.35,
    tempo: 72,
    notes: [196.0, 220.0, 246.94, 293.66, 329.63],
    chords: [
      [196.0, 246.94, 293.66],
      [220.0, 261.63, 329.63],
    ],
    lyrics: [
      { time: 0, text: '🧘 Hít thật sâu... Thở ra nhẹ nhàng...' },
      { time: 12, text: '🎯 Trí tuệ sáng suốt, tập trung làm việc' },
    ],
  },
];

// ============================================================================
// Sleep timer presets
// ============================================================================

export const SLEEP_TIMER_PRESETS = [15, 30, 45, 60] as const;
export type SleepTimerPreset = typeof SLEEP_TIMER_PRESETS[number];

// ============================================================================
// helpers
// ============================================================================

export function formatMusicTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function getCurrentLyric(track: Track | null, currentTime: number): LyricLine | null {
  if (!track || !track.lyrics.length) return null;
  const reversed = [...track.lyrics].reverse();
  for (const line of reversed) {
    if (currentTime >= line.time) return line;
  }
  return track.lyrics[0] || null;
}

export function getTrackById(id: string): Track | null {
  return BUILTIN_TRACKS.find((t) => t.id === id) ?? null;
}

export function getMoodPlaylist(id: string): MoodPlaylist | null {
  return MOOD_PLAYLISTS[id] ?? null;
}

export function getEQPresetByKey(key: string): EQPreset {
  return EQ_PRESETS[key] ?? EQ_PRESETS.flat;
}
