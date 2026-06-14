/**
 * Generative Ambient Music Engine
 * ─────────────────────────────────
 * Uses Tone.js to synthesize continuously evolving ambient music in the browser.
 * Infinite length, never loops awkwardly — like YouTube brainwave music.
 *
 * Architecture per mental state:
 *   - Drone layer:    1–2 slow oscillators with slight detuning (warmth)
 *   - Pad layer:      Polyphonic synth with long attack/release (atmosphere)
 *   - Melody layer:   Sparse random notes in a scale (movement, optional)
 *   - Reverb + delay: Large hall reverb for spaciousness
 */

import type { MentalState } from '@/types';

// ─── Music theory helpers ────────────────────────────────────────────────────

const NOTE_FREQ: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
  Db3: 138.59, Eb3: 155.56, Gb3: 185.00, Ab3: 207.65, Bb3: 233.08,
  Db4: 277.18, Eb4: 311.13, Gb4: 369.99, Ab4: 415.30, Bb4: 466.16,
  Db5: 554.37, Eb5: 622.25, Gb5: 739.99, Ab5: 830.61, Bb5: 932.33,
};

function hz(note: string): number {
  return NOTE_FREQ[note] ?? 220;
}

// ─── Per-state music profiles ────────────────────────────────────────────────

export interface MusicProfile {
  // Drone: deep, slowly evolving bass tone
  droneNotes: string[];        // 1-2 bass notes, slight detune for warmth
  droneDetune: number;         // cents of detuning on second oscillator

  // Pad: slow atmospheric chords
  padNotes: string[][];        // chord voicings to rotate through
  padIntervalSec: number;      // how often to shift chord (seconds)
  padAttack: number;           // Tone.js envelope attack (seconds)
  padRelease: number;          // release

  // Melody: sparse high notes (set melodyNotes to [] to disable)
  melodyNotes: string[];       // scale tones to pick from
  melodyIntervalSec: [number, number]; // [min, max] random interval between notes
  melodyEnabled: boolean;

  // Global
  reverbDecay: number;         // reverb tail length in seconds (3–12)
  masterVolume: number;        // dB (-20 to 0)
  tempo: number;               // BPM (used for any rhythmic elements)
  description: string;
}

export const MUSIC_PROFILES: Record<MentalState, MusicProfile> = {
  focus: {
    droneNotes: ['D2', 'A2'],
    droneDetune: 4,
    padNotes: [
      ['D3', 'A3', 'F4'],
      ['D3', 'F3', 'C4'],
      ['A2', 'E3', 'A3'],
      ['D3', 'G3', 'D4'],
    ],
    padIntervalSec: 14,
    padAttack: 4,
    padRelease: 6,
    melodyNotes: ['D4', 'E4', 'F4', 'G4', 'A4', 'C5', 'D5'],
    melodyIntervalSec: [8, 18],
    melodyEnabled: true,
    reverbDecay: 6,
    masterVolume: -10,
    tempo: 70,
    description: 'Steady D minor drone with sparse melodic movement for sustained attention',
  },

  learning: {
    droneNotes: ['F2', 'C3'],
    droneDetune: 3,
    padNotes: [
      ['F3', 'A3', 'C4'],
      ['F3', 'Bb3', 'D4'],
      ['C3', 'G3', 'C4'],
      ['F3', 'A3', 'Eb4'],
    ],
    padIntervalSec: 12,
    padAttack: 3.5,
    padRelease: 5,
    melodyNotes: ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'F5'],
    melodyIntervalSec: [7, 15],
    melodyEnabled: true,
    reverbDecay: 5,
    masterVolume: -12,
    tempo: 60,
    description: 'Warm F major pads tuned to support memory and open attention',
  },

  relaxation: {
    droneNotes: ['G2', 'D3'],
    droneDetune: 5,
    padNotes: [
      ['G3', 'B3', 'D4'],
      ['G3', 'C4', 'E4'],
      ['D3', 'A3', 'D4'],
      ['E3', 'G3', 'B3'],
    ],
    padIntervalSec: 16,
    padAttack: 5,
    padRelease: 8,
    melodyNotes: ['G4', 'A4', 'B4', 'D5', 'E5', 'G5'],
    melodyIntervalSec: [10, 22],
    melodyEnabled: true,
    reverbDecay: 8,
    masterVolume: -11,
    tempo: 55,
    description: 'G major pastoral atmosphere with long reverb tails',
  },

  sleep: {
    droneNotes: ['C2', 'G2'],
    droneDetune: 2,
    padNotes: [
      ['C3', 'E3', 'G3'],
      ['C3', 'F3', 'G3'],
      ['G2', 'D3', 'G3'],
      ['C3', 'E3', 'A3'],
    ],
    padIntervalSec: 22,
    padAttack: 8,
    padRelease: 12,
    melodyNotes: [],
    melodyIntervalSec: [20, 40],
    melodyEnabled: false,
    reverbDecay: 12,
    masterVolume: -14,
    tempo: 40,
    description: 'Deep C major drone, very slow evolving pads, no melody — maximum stillness',
  },

  'mood-boost': {
    droneNotes: ['E2', 'B2'],
    droneDetune: 6,
    padNotes: [
      ['E3', 'Ab3', 'B3'],
      ['E3', 'Ab3', 'Db4'],
      ['Db3', 'Ab3', 'E4'],
      ['B2', 'Gb3', 'B3'],
    ],
    padIntervalSec: 10,
    padAttack: 2.5,
    padRelease: 4,
    melodyNotes: ['E4', 'Gb4', 'Ab4', 'B4', 'Db5', 'E5'],
    melodyIntervalSec: [5, 12],
    melodyEnabled: true,
    reverbDecay: 4,
    masterVolume: -9,
    tempo: 120,
    description: 'Bright E major with more frequent melodic movement for uplift',
  },

  meditation: {
    droneNotes: ['A2', 'E3'],
    droneDetune: 2,
    padNotes: [
      ['A2', 'E3', 'A3'],
      ['A2', 'D3', 'A3'],
      ['E2', 'B2', 'E3'],
      ['A2', 'C3', 'E3'],
    ],
    padIntervalSec: 24,
    padAttack: 7,
    padRelease: 10,
    melodyNotes: ['A4', 'B4', 'D5', 'E5', 'A5'],
    melodyIntervalSec: [16, 35],
    melodyEnabled: true,
    reverbDecay: 11,
    masterVolume: -13,
    tempo: 48,
    description: 'Pure A drone (432 Hz aligned), vast reverb, meditative stillness',
  },

  'anxiety-relief': {
    droneNotes: ['F2', 'C3'],
    droneDetune: 2,
    padNotes: [
      ['F3', 'A3', 'C4'],
      ['F3', 'G3', 'C4'],
      ['C3', 'F3', 'A3'],
      ['F3', 'A3', 'Bb3'],
    ],
    padIntervalSec: 18,
    padAttack: 6,
    padRelease: 9,
    melodyNotes: ['F4', 'G4', 'A4', 'C5', 'F5'],
    melodyIntervalSec: [14, 28],
    melodyEnabled: true,
    reverbDecay: 9,
    masterVolume: -12,
    tempo: 52,
    description: 'Stable F major with very slow movement — predictability reduces anxiety',
  },
};

// ─── Engine class ────────────────────────────────────────────────────────────

export class AmbientMusicEngine {
  private Tone: any = null;
  private reverb: any = null;
  private delay: any = null;
  private masterVol: any = null;

  // Drone
  private droneOscA: any = null;
  private droneOscB: any = null;
  private droneGain: any = null;

  // Pad
  private padSynth: any = null;
  private padInterval: ReturnType<typeof setInterval> | null = null;
  private padChordIdx = 0;

  // Melody
  private melodySynth: any = null;
  private melodyTimeout: ReturnType<typeof setTimeout> | null = null;

  private profile: MusicProfile | null = null;
  private _isPlaying = false;
  private _volume = 0.7; // 0–1

  async init(mentalState: MentalState): Promise<void> {
    this.Tone = await import('tone');
    const T = this.Tone;
    this.profile = MUSIC_PROFILES[mentalState];

    await T.start();
    T.getTransport().bpm.value = this.profile.tempo;

    // ── Effects chain ──────────────────────────────────────────────────────
    this.reverb = new T.Reverb({
      decay: this.profile.reverbDecay,
      wet: 0.65,
      preDelay: 0.04,
    });
    await this.reverb.ready;

    this.delay = new T.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.25,
      wet: 0.18,
    });

    this.masterVol = new T.Volume(this.profile.masterVolume);
    this.masterVol.toDestination();

    const fxChain = [this.delay, this.reverb, this.masterVol];

    // ── Drone ──────────────────────────────────────────────────────────────
    this.droneGain = new T.Gain(0).connect(fxChain[0]);

    this.droneOscA = new T.Oscillator({
      frequency: hz(this.profile.droneNotes[0]),
      type: 'sine',
      volume: -18,
    }).connect(this.droneGain);

    const secondDrone = this.profile.droneNotes[1] ?? this.profile.droneNotes[0];
    this.droneOscB = new T.Oscillator({
      frequency: hz(secondDrone),
      type: 'triangle',
      detune: this.profile.droneDetune,
      volume: -22,
    }).connect(this.droneGain);

    // ── Pad ────────────────────────────────────────────────────────────────
    this.padSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: this.profile.padAttack,
        decay: 2,
        sustain: 0.8,
        release: this.profile.padRelease,
      },
      volume: -14,
    });
    this.padSynth.connect(fxChain[0]);

    // ── Melody ─────────────────────────────────────────────────────────────
    if (this.profile.melodyEnabled) {
      this.melodySynth = new T.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 1.5,
          decay: 1,
          sustain: 0.3,
          release: 4,
        },
        volume: -22,
      });
      this.melodySynth.connect(fxChain[0]);
    }
  }

  play(): void {
    if (this._isPlaying || !this.profile) return;
    this._isPlaying = true;

    // Fade in drone
    this.droneOscA.start();
    this.droneOscB.start();
    this.droneGain.gain.rampTo(1, 4);

    // Start pad cycling
    this._playPadChord();
    this.padInterval = setInterval(() => {
      this._playPadChord();
    }, this.profile.padIntervalSec * 1000);

    // Start melody
    if (this.profile.melodyEnabled) {
      this._scheduleMelodyNote();
    }
  }

  pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;

    this.droneGain?.gain.rampTo(0, 2);
    this.padSynth?.releaseAll();

    if (this.padInterval) { clearInterval(this.padInterval); this.padInterval = null; }
    if (this.melodyTimeout) { clearTimeout(this.melodyTimeout); this.melodyTimeout = null; }
  }

  resume(): void {
    if (this._isPlaying || !this.profile) return;
    this.play();
  }

  /** Volume 0–1 */
  setVolume(v: number): void {
    this._volume = v;
    if (this.masterVol && this.profile) {
      // Map 0–1 to dB: at v=1 → profile.masterVolume, at v=0 → -60
      const db = this.profile.masterVolume + (1 - v) * (this.profile.masterVolume - (-60));
      this.masterVol.volume.rampTo(Math.max(-60, Math.min(0, db)), 0.5);
    }
  }

  get isPlaying() { return this._isPlaying; }
  get volume() { return this._volume; }

  private _playPadChord(): void {
    if (!this.profile || !this.padSynth) return;
    const chords = this.profile.padNotes;
    this.padChordIdx = (this.padChordIdx + 1) % chords.length;
    const chord = chords[this.padChordIdx];
    const freqs = chord.map(hz);

    this.padSynth.releaseAll();
    // slight stagger for natural feel
    freqs.forEach((f: number, i: number) => {
      setTimeout(() => {
        try { this.padSynth.triggerAttack(f); } catch { /* synth may be disposed */ }
      }, i * 120);
    });
  }

  private _scheduleMelodyNote(): void {
    if (!this.profile?.melodyEnabled || !this._isPlaying) return;
    const [minSec, maxSec] = this.profile.melodyIntervalSec;
    const delay = (minSec + Math.random() * (maxSec - minSec)) * 1000;

    this.melodyTimeout = setTimeout(() => {
      if (!this._isPlaying || !this.profile) return;
      const notes = this.profile.melodyNotes;
      const note = notes[Math.floor(Math.random() * notes.length)];
      try {
        this.melodySynth?.triggerAttackRelease(hz(note), '4n');
      } catch { /* ignore */ }
      this._scheduleMelodyNote();
    }, delay);
  }

  dispose(): void {
    this.pause();
    setTimeout(() => {
      try {
        this.droneOscA?.dispose();
        this.droneOscB?.dispose();
        this.droneGain?.dispose();
        this.padSynth?.dispose();
        this.melodySynth?.dispose();
        this.reverb?.dispose();
        this.delay?.dispose();
        this.masterVol?.dispose();
      } catch { /* ignore */ }
    }, 300);
  }
}
