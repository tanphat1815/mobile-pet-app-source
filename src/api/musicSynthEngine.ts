/**
 * MusicSynthEngine — Web Audio API procedural synth (Step 12b)
 *
 * Lightweight procedural synth that generates melody + chord pads using
 * OscillatorNode + BiquadFilter + Gain envelopes. Designed to play the
 * 6 built-in procedural tracks from api/music.ts.
 *
 * On native platforms (no `window`), the engine becomes a no-op — the
 * MusicPlayer UI still works (progress, controls, EQ visualization),
 * just without audible output.
 */

import type { Track } from './music';

export interface BeatData {
  step: number;
  chordIndex: number;
  timestamp: number;
}

export type AudioContextLike = AudioContext;

interface EnvOsc {
  osc: OscillatorNode;
  gain: GainNode;
}

function getAudioContext(): AudioContextLike | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  const AudioCtx = w.AudioContext || w.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    return new AudioCtx();
  } catch {
    return null;
  }
}

export class MusicSynthEngine {
  private ctx: AudioContextLike | null = null;
  private output: AudioNode | null = null;
  private isPlaying = false;
  private currentTrack: Track | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private beatStep = 0;
  private tempo = 100;
  private activeVoices: EnvOsc[] = [];
  private masterGain: GainNode | null = null;

  constructor(output?: AudioNode | null) {
    this.output = output ?? null;
  }

  setOutput(output: AudioNode | null) {
    this.output = output;
  }

  setAudioContext(ctx: AudioContextLike | null, output?: AudioNode | null) {
    this.stop();
    this.ctx = ctx;
    if (output) this.output = output;
  }

  isActive(): boolean {
    return this.isPlaying;
  }

  setMasterGain(value: number) {
    if (this.masterGain && this.ctx) {
      const v = Math.max(0, Math.min(1, value));
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    }
  }

  play(track: Track, _onBeat?: (data: BeatData) => void) {
    this.stop();
    if (!this.ensureContext()) return;
    this.currentTrack = track;
    this.isPlaying = true;
    this.beatStep = 0;
    this.tempo = track.tempo || 100;

    // 16th-note step in ms
    const beatMs = (60 / this.tempo / 4) * 1000;
    this.intervalId = setInterval(() => {
      if (!this.isPlaying) return;
      this._step();
    }, beatMs);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._releaseVoices();
    this.beatStep = 0;
  }

  /** Ensure AudioContext exists. Lazy-init on first play. */
  private ensureContext(): boolean {
    if (this.ctx) return true;
    this.ctx = getAudioContext();
    if (!this.ctx) return false;
    try {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.output ?? this.ctx.destination);
      this.output = this.masterGain;
    } catch {
      return false;
    }
    return true;
  }

  private _step() {
    if (!this.currentTrack || !this.ctx || !this.output) return;
    const track = this.currentTrack;
    const notes = track.notes;
    const chords = track.chords;

    if (!notes.length) return;

    // Pick melody note (advances through scale)
    const melodyNote = notes[this.beatStep % notes.length];

    // Pick chord every 4 steps (1 quarter note)
    const chordIdx = Math.floor(this.beatStep / 4) % chords.length;
    const chord = chords[chordIdx] ?? [];

    // Play chord pad on quarter
    if (this.beatStep % 4 === 0 && chord.length) {
      this._playChord(chord, 0.5);
    }

    // Play melody on every 2 steps (8th note feel)
    if (this.beatStep % 2 === 0) {
      this._playMelody(melodyNote, 0.18);
    }

    this.beatStep += 1;
  }

  private _playMelody(freq: number, durSec: number) {
    if (!this.ctx || !this.output) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.linearRampToValueAtTime(0, t + durSec);
    osc.connect(gain).connect(this.output);
    osc.start(t);
    osc.stop(t + durSec + 0.05);
  }

  private _playChord(freqs: number[], durSec: number) {
    if (!this.ctx || !this.output) return;
    const t = this.ctx.currentTime;
    for (const f of freqs) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      gain.gain.linearRampToValueAtTime(0, t + durSec);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      osc.connect(filter).connect(gain).connect(this.output);
      osc.start(t);
      osc.stop(t + durSec + 0.05);
    }
  }

  private _releaseVoices() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const v of this.activeVoices) {
      try {
        v.gain.gain.cancelScheduledValues(now);
        v.gain.gain.setTargetAtTime(0, now, 0.05);
        v.osc.stop(now + 0.1);
      } catch {
        // ignore
      }
    }
    this.activeVoices = [];
  }
}

/**
 * Convenience singleton. Consumers may call `getEngine()` to share a
 * single engine across the MusicStore / MusicPlayer.
 */
let _engine: MusicSynthEngine | null = null;

export function getEngine(): MusicSynthEngine {
  if (!_engine) {
    _engine = new MusicSynthEngine();
  }
  return _engine;
}

export function disposeEngine() {
  if (_engine) {
    _engine.stop();
    _engine = null;
  }
}
