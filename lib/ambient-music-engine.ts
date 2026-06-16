/**
 * Ambient Music Engine — Tone.js generative music synthesis
 *
 * Redesigned for audible, Brain.fm-quality ambient music:
 *   • Drone:   filtered triangle oscillators (warm sub-bass foundation)
 *   • Pad:     PolySynth with fatsawtooth + low-pass filter (lush, rich chords)
 *   • Melody:  triangle synth, much louder & more frequent than before
 *
 * Signal chain:
 *   Drone/Pad/Melody → FeedbackDelay → Reverb → MasterVol → destination
 */

import type { MentalState } from '@/types';

// ─── Note frequency table ─────────────────────────────────────────────────────

const NOTE_FREQ: Record<string, number> = {
  C2:65.41,  D2:73.42,  E2:82.41,  F2:87.31,  G2:98.00,  A2:110.00, B2:123.47,
  C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
  C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00,
  Db3:138.59, Eb3:155.56, Gb3:185.00, Ab3:207.65, Bb3:233.08,
  Db4:277.18, Eb4:311.13, Gb4:369.99, Ab4:415.30, Bb4:466.16,
  Db5:554.37, Eb5:622.25, Gb5:739.99, Ab5:830.61, Bb5:932.33,
};

function hz(note: string): number { return NOTE_FREQ[note] ?? 220; }

// ─── Per-state music profiles ─────────────────────────────────────────────────

export interface MusicProfile {
  droneNotes:         string[];
  padNotes:           string[][];
  padIntervalSec:     number;
  padAttack:          number;
  padRelease:         number;
  melodyNotes:        string[];
  melodyIntervalSec:  [number, number];
  melodyEnabled:      boolean;
  reverbDecay:        number;
  masterVolume:       number; // dB — louder than previous version
  description:        string;
}

export const MUSIC_PROFILES: Record<MentalState, MusicProfile> = {
  focus: {
    droneNotes:        ['D2', 'A2'],
    padNotes:          [['D3','A3','F4'], ['D3','F3','C4'], ['A2','E3','A3'], ['D3','G3','D4']],
    padIntervalSec:    10,
    padAttack:         3,
    padRelease:        5,
    melodyNotes:       ['D4','E4','F4','G4','A4','C5','D5'],
    melodyIntervalSec: [4, 9],
    melodyEnabled:     true,
    reverbDecay:       5,
    masterVolume:      -5,
    description:       'D minor drone — steady focus, sparse melodic movement',
  },
  learning: {
    droneNotes:        ['F2', 'C3'],
    padNotes:          [['F3','A3','C4'], ['F3','Bb3','D4'], ['C3','G3','C4'], ['F3','A3','Eb4']],
    padIntervalSec:    9,
    padAttack:         2.5,
    padRelease:        4.5,
    melodyNotes:       ['F4','G4','A4','Bb4','C5','D5','F5'],
    melodyIntervalSec: [4, 8],
    melodyEnabled:     true,
    reverbDecay:       4,
    masterVolume:      -5,
    description:       'F major pads — warm and open, supports memory and attention',
  },
  relaxation: {
    droneNotes:        ['G2', 'D3'],
    padNotes:          [['G3','B3','D4'], ['G3','C4','E4'], ['D3','A3','D4'], ['E3','G3','B3']],
    padIntervalSec:    13,
    padAttack:         4,
    padRelease:        7,
    melodyNotes:       ['G4','A4','B4','D5','E5','G5'],
    melodyIntervalSec: [6, 13],
    melodyEnabled:     true,
    reverbDecay:       7,
    masterVolume:      -6,
    description:       'G major pastoral — long reverb tails, gentle movement',
  },
  sleep: {
    droneNotes:        ['C2', 'G2'],
    padNotes:          [['C3','E3','G3'], ['C3','F3','G3'], ['G2','D3','G3'], ['C3','E3','A3']],
    padIntervalSec:    18,
    padAttack:         7,
    padRelease:        10,
    melodyNotes:       [],
    melodyIntervalSec: [30, 60],
    melodyEnabled:     false,
    reverbDecay:       10,
    masterVolume:      -8,
    description:       'C major — ultra-slow evolving pads, maximum stillness',
  },
  'mood-boost': {
    droneNotes:        ['E2', 'B2'],
    padNotes:          [['E3','Ab3','B3'], ['E3','Ab3','Db4'], ['Db3','Ab3','E4'], ['B2','Gb3','B3']],
    padIntervalSec:    7,
    padAttack:         2,
    padRelease:        3.5,
    melodyNotes:       ['E4','Gb4','Ab4','B4','Db5','E5'],
    melodyIntervalSec: [2, 5],
    melodyEnabled:     true,
    reverbDecay:       3.5,
    masterVolume:      -4,
    description:       'E major — brighter, more frequent melody for uplift',
  },
  meditation: {
    droneNotes:        ['A2', 'E3'],
    padNotes:          [['A2','E3','A3'], ['A2','D3','A3'], ['E2','B2','E3'], ['A2','C3','E3']],
    padIntervalSec:    18,
    padAttack:         6,
    padRelease:        9,
    melodyNotes:       ['A4','B4','D5','E5','A5'],
    melodyIntervalSec: [10, 22],
    melodyEnabled:     true,
    reverbDecay:       10,
    masterVolume:      -7,
    description:       'A drone (432 Hz aligned) — vast reverb, deep stillness',
  },
  'anxiety-relief': {
    droneNotes:        ['F2', 'C3'],
    padNotes:          [['F3','A3','C4'], ['F3','G3','C4'], ['C3','F3','A3'], ['F3','A3','Bb3']],
    padIntervalSec:    14,
    padAttack:         5,
    padRelease:        8,
    melodyNotes:       ['F4','G4','A4','C5','F5'],
    melodyIntervalSec: [8, 18],
    melodyEnabled:     true,
    reverbDecay:       8,
    masterVolume:      -6,
    description:       'Stable F major — slow, predictable movement soothes anxiety',
  },
};

// ─── Engine ──────────────────────────────────────────────────────────────────

export class AmbientMusicEngine {
  private Tone: any  = null;
  private reverb: any     = null;
  private delay: any      = null;
  private masterVol: any  = null;
  private padFilter: any  = null;

  private droneOscA: any  = null;
  private droneOscB: any  = null;
  private droneGain: any  = null;

  private padSynth: any   = null;
  private padInterval: ReturnType<typeof setInterval>  | null = null;
  private padChordIdx = 0;

  private melodySynth: any = null;
  private melodyTimeout: ReturnType<typeof setTimeout> | null = null;

  private profile: MusicProfile | null = null;
  private _isPlaying = false;
  private _volume = 0.7;

  async init(mentalState: MentalState): Promise<void> {
    this.Tone   = await import('tone');
    const T     = this.Tone;
    this.profile = MUSIC_PROFILES[mentalState];
    const p      = this.profile;

    await T.start();
    T.getTransport().bpm.value = 70;

    // ── Effects chain ──────────────────────────────────────────────────────
    this.masterVol = new T.Volume(p.masterVolume);
    this.masterVol.toDestination();

    // Less wet reverb so direct signal stays present
    this.reverb = new T.Reverb({ decay: p.reverbDecay, wet: 0.48, preDelay: 0.03 });
    await this.reverb.ready;
    this.reverb.connect(this.masterVol);

    // Gentle delay — sits behind the reverb
    this.delay = new T.FeedbackDelay({ delayTime: '8n', feedback: 0.18, wet: 0.10 });
    this.delay.connect(this.reverb);

    // ── Drone ──────────────────────────────────────────────────────────────
    this.droneGain = new T.Gain(0).connect(this.delay);

    this.droneOscA = new T.Oscillator({
      frequency: hz(p.droneNotes[0]),
      type:      'triangle',
      volume:    -12,
    }).connect(this.droneGain);

    const droneB = p.droneNotes[1] ?? p.droneNotes[0];
    this.droneOscB = new T.Oscillator({
      frequency: hz(droneB),
      type:      'triangle',
      detune:    3,
      volume:    -16,
    }).connect(this.droneGain);

    // ── Pad — fatsawtooth for rich, lush chords ────────────────────────────
    // Lowpass filter softens the brightness of sawtooth
    this.padFilter = new T.Filter({ frequency: 1400, type: 'lowpass', rolloff: -24 });
    this.padFilter.connect(this.delay);

    this.padSynth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'fatsawtooth', count: 2, spread: 18 },
      envelope: {
        attack:  p.padAttack,
        decay:   1.5,
        sustain: 0.82,
        release: p.padRelease,
      },
      volume: -8,  // much louder than old -14
    });
    this.padSynth.connect(this.padFilter);

    // ── Melody — triangle, clearly audible ─────────────────────────────────
    if (p.melodyEnabled) {
      this.melodySynth = new T.Synth({
        oscillator: { type: 'triangle' },
        envelope: {
          attack:  0.6,
          decay:   0.8,
          sustain: 0.55,
          release: 2.5,
        },
        volume: -10,  // was -22 — now clearly audible
      });
      this.melodySynth.connect(this.reverb); // skip delay for cleaner melody
    }
  }

  play(): void {
    if (this._isPlaying || !this.profile) return;
    this._isPlaying = true;

    this.droneOscA.start();
    this.droneOscB.start();
    this.droneGain.gain.rampTo(1, 3);

    this._playPadChord();
    this.padInterval = setInterval(
      () => this._playPadChord(),
      this.profile.padIntervalSec * 1000
    );

    if (this.profile.melodyEnabled) this._scheduleMelodyNote();
  }

  pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    this.droneGain?.gain.rampTo(0, 2);
    this.padSynth?.releaseAll();
    if (this.padInterval)   { clearInterval(this.padInterval);   this.padInterval   = null; }
    if (this.melodyTimeout) { clearTimeout(this.melodyTimeout);  this.melodyTimeout = null; }
  }

  resume(): void {
    if (this._isPlaying || !this.profile) return;
    this.play();
  }

  /** volume 0–1 */
  setVolume(v: number): void {
    this._volume = v;
    if (this.masterVol && this.profile) {
      // Linear dB interpolation: v=0 → -60dB, v=1 → masterVolume
      const db = -60 + v * (this.profile.masterVolume + 60);
      this.masterVol.volume.rampTo(Math.max(-60, Math.min(0, db)), 0.5);
    }
  }

  get isPlaying() { return this._isPlaying; }
  get volume()    { return this._volume; }

  private _playPadChord(): void {
    if (!this.profile || !this.padSynth) return;
    const chords = this.profile.padNotes;
    this.padChordIdx = (this.padChordIdx + 1) % chords.length;
    const chord = chords[this.padChordIdx];
    const freqs = chord.map(hz);

    // Release old chord, wait a moment, then attack new chord
    this.padSynth.releaseAll();
    const transitionMs = Math.min(1800, this.profile.padRelease * 250);
    freqs.forEach((f: number, i: number) => {
      setTimeout(() => {
        if (!this._isPlaying) return;
        try { this.padSynth.triggerAttack(f); } catch { /* disposed */ }
      }, transitionMs + i * 120);
    });
  }

  private _scheduleMelodyNote(): void {
    if (!this.profile?.melodyEnabled || !this._isPlaying) return;
    const [minS, maxS] = this.profile.melodyIntervalSec;
    const delayMs = (minS + Math.random() * (maxS - minS)) * 1000;

    this.melodyTimeout = setTimeout(() => {
      if (!this._isPlaying || !this.profile) return;
      const notes = this.profile.melodyNotes;
      const note  = notes[Math.floor(Math.random() * notes.length)];
      try {
        // Duration varies: quarter or half note feel
        const dur = Math.random() > 0.4 ? '2n' : '4n';
        this.melodySynth?.triggerAttackRelease(hz(note), dur);
      } catch { /* disposed */ }
      this._scheduleMelodyNote();
    }, delayMs);
  }

  dispose(): void {
    this.pause();
    setTimeout(() => {
      try {
        this.droneOscA?.dispose();
        this.droneOscB?.dispose();
        this.droneGain?.dispose();
        this.padSynth?.dispose();
        this.padFilter?.dispose();
        this.melodySynth?.dispose();
        this.delay?.dispose();
        this.reverb?.dispose();
        this.masterVol?.dispose();
      } catch { /* ignore */ }
    }, 400);
  }
}
