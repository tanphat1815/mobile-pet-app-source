/**
 * Ambient Sounds Catalog — Step 12a
 *
 * Soundscape entries used by the AmbientPlayer. Each entry maps to an
 * audio asset URL (or a synthesized oscillator fallback when running on
 * web without bundled assets).
 *
 * Step 12a — xem docs/steps/step-12a-wellness.md.
 */

export interface AmbientSound {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** Asset URL or external CDN. Optional — fallback uses synth. */
  assetUrl?: string;
  /** Synth fallback config when no asset is available. */
  synth?: {
    /** 'noise' | 'sine' | 'triangle' */
    type: 'noise' | 'sine' | 'triangle';
    /** Hz for tone-based synth (ignored for noise) */
    frequency?: number;
    /** Lowpass cutoff for noise (Hz) */
    cutoffHz?: number;
    /** Default volume 0..1 */
    defaultVolume: number;
  };
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    label: 'Rain',
    emoji: '🌧',
    description: 'Steady rainfall',
    assetUrl: 'https://cdn.pixabay.com/audio/2022/03/15/audio_4d4b3e0c0a.mp3',
    synth: { type: 'noise', cutoffHz: 2400, defaultVolume: 0.5 },
  },
  {
    id: 'forest',
    label: 'Forest',
    emoji: '🌳',
    description: 'Birds + leaves',
    assetUrl: 'https://cdn.pixabay.com/audio/2022/03/10/audio_b4e3c89b71.mp3',
    synth: { type: 'noise', cutoffHz: 3600, defaultVolume: 0.5 },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    emoji: '🌊',
    description: 'Rolling waves',
    assetUrl: 'https://cdn.pixabay.com/audio/2022/03/22/audio_5d8a89eb84.mp3',
    synth: { type: 'noise', cutoffHz: 1200, defaultVolume: 0.5 },
  },
  {
    id: 'fireplace',
    label: 'Fireplace',
    emoji: '🔥',
    description: 'Crackling fire',
    assetUrl: 'https://cdn.pixabay.com/audio/2022/04/01/audio_27a8a86e02.mp3',
    synth: { type: 'noise', cutoffHz: 1800, defaultVolume: 0.5 },
  },
  {
    id: 'binaural',
    label: 'Binaural',
    emoji: '🧘',
    description: '7.83 Hz Schumann tone',
    synth: { type: 'sine', frequency: 200, defaultVolume: 0.3 },
  },
];

export function getAmbientSound(id: string): AmbientSound | undefined {
  return AMBIENT_SOUNDS.find((s) => s.id === id);
}
