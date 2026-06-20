/**
 * Music styles — the "timbre / instrumentation" half of a track.
 *
 * A track's sound = STATE harmony (chords, bpm, scale, entrainment — in
 * MUSIC_PROFILES) × STYLE instrumentation (which synths, envelopes, effects —
 * here). The same Dm7→Am7 progression can be rendered as warm Rhodes lo-fi,
 * a string ensemble, or a synthwave pluck depending on the chosen style.
 *
 * The engine reads a MusicStyle and builds each voice accordingly. `null` on a
 * voice disables that layer for the style (e.g. lo-fi has no bright lead).
 */

import type { MentalState } from '@/types';

export type StyleId = 'ambient' | 'cinematic' | 'classical' | 'electronic' | 'lofi' | 'piano';

export interface ADSR { attack: number; decay: number; sustain: number; release: number; }

/** One instrument layer's timbre. `fm` swaps Synth → FMSynth (Rhodes/EP/bell). */
export interface StyleVoice {
  fm?: boolean;
  harmonicity?: number;      // FM only
  modulationIndex?: number;  // FM only
  oscillator?: any;          // non-FM oscillator config
  envelope?: ADSR;           // overrides the engine default for this voice
  volume: number;            // dB
}

export interface MusicStyle {
  id: StyleId;
  label: string;
  emoji: string;
  description: string;
  pad:  StyleVoice & { filterFreq: number; chorus: boolean };
  arp:  (StyleVoice & { delayWet: number; delayFeedback: number }) | null;
  lead: StyleVoice | null;
  bass: StyleVoice | null;
  reverbWetScale:   number;  // multiplies the base reverb wet
  reverbDecayScale: number;  // multiplies the base reverb decay
  masterTrim:       number;  // dB offset on master target level
  lofi:             boolean; // adds master lowpass + pad vibrato (tape warble)
}

// ─── Style definitions ────────────────────────────────────────────────────────

export const MUSIC_STYLES: Record<StyleId, MusicStyle> = {
  // Real deep-ambient recordings (RealMusicEngine). Synth params below are
  // unused for real styles but required by the type — kept as sane defaults.
  ambient: {
    id: 'ambient', label: 'Immersive', emoji: '🌌',
    description: 'Deep, spacious ambient — immersive, high-bitrate (CC0)',
    pad:  { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, filterFreq: 1300, chorus: true, volume: -9 },
    arp:  null,
    lead: null,
    bass: { oscillator: { type: 'sine' }, volume: -14 },
    reverbWetScale: 1.3, reverbDecayScale: 1.4, masterTrim: 0, lofi: false,
  },

  cinematic: {
    id: 'cinematic', label: 'Cinematic', emoji: '🎬',
    description: 'Lush evolving string pads, wide and spacious',
    pad:  { oscillator: { type: 'fatsawtooth', count: 3, spread: 30 }, filterFreq: 1500, chorus: true, volume: -9 },
    arp:  { oscillator: { type: 'triangle' }, volume: -13, delayWet: 0.25, delayFeedback: 0.3 },
    lead: { oscillator: { type: 'triangle' }, volume: -12 },
    bass: { oscillator: { type: 'sine' }, volume: -14 },
    reverbWetScale: 1.15, reverbDecayScale: 1.25, masterTrim: 0, lofi: false,
  },

  classical: {
    id: 'classical', label: 'Classical', emoji: '🎻',
    description: 'Real recordings — Vivaldi, Bach, Mozart (study classical)',
    pad:  { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, filterFreq: 2200, chorus: true, volume: -10 },
    arp:  { oscillator: { type: 'triangle' }, volume: -14, delayWet: 0.15, delayFeedback: 0.2 },
    // soft piano/violin lead
    lead: { fm: true, harmonicity: 2, modulationIndex: 4, envelope: { attack: 0.01, decay: 1.2, sustain: 0.2, release: 1.6 }, volume: -11 },
    // pizzicato-ish cello
    bass: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.35, sustain: 0.0, release: 0.3 }, volume: -12 },
    reverbWetScale: 1.0, reverbDecayScale: 1.05, masterTrim: 0, lofi: false,
  },

  electronic: {
    id: 'electronic', label: 'Electronic', emoji: '🎛️',
    description: 'Analog-style plucks and driving arps, brighter',
    pad:  { oscillator: { type: 'fatsawtooth', count: 2, spread: 25 }, filterFreq: 2600, chorus: true, volume: -11 },
    arp:  { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.005, decay: 0.18, sustain: 0.2, release: 0.6 }, volume: -11, delayWet: 0.35, delayFeedback: 0.42 },
    lead: { oscillator: { type: 'sawtooth' }, volume: -13 },
    bass: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.55, release: 0.2 }, volume: -13 },
    reverbWetScale: 0.8, reverbDecayScale: 0.8, masterTrim: 0, lofi: false,
  },

  lofi: {
    id: 'lofi', label: 'Lo-fi', emoji: '📻',
    description: 'Real lo-fi beats to study/relax to (HoliznaCC0, CC0)',
    pad:  { fm: true, harmonicity: 1, modulationIndex: 2, envelope: { attack: 0.01, decay: 1.8, sustain: 0.35, release: 1.4 }, filterFreq: 1100, chorus: true, volume: -9 },
    arp:  { fm: true, harmonicity: 1, modulationIndex: 2.5, envelope: { attack: 0.005, decay: 0.3, sustain: 0.15, release: 1.0 }, volume: -13, delayWet: 0.2, delayFeedback: 0.28 },
    lead: null, // mellow — no bright lead
    bass: { oscillator: { type: 'sine' }, volume: -13 },
    reverbWetScale: 0.9, reverbDecayScale: 0.95, masterTrim: -1, lofi: true,
  },

  piano: {
    id: 'piano', label: 'Piano', emoji: '🎹',
    description: 'Real piano — Chopin nocturnes, Debussy Clair de Lune',
    // percussive, decaying "piano" chords instead of sustained pads
    pad:  { fm: true, harmonicity: 3, modulationIndex: 5, envelope: { attack: 0.005, decay: 1.6, sustain: 0.08, release: 1.4 }, filterFreq: 3200, chorus: false, volume: -8 },
    arp:  { fm: true, harmonicity: 3, modulationIndex: 5, envelope: { attack: 0.005, decay: 1.2, sustain: 0.05, release: 1.0 }, volume: -12, delayWet: 0.18, delayFeedback: 0.25 },
    lead: { fm: true, harmonicity: 3, modulationIndex: 5, envelope: { attack: 0.005, decay: 1.4, sustain: 0.06, release: 1.2 }, volume: -11 },
    bass: { oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 0.5 }, volume: -14 },
    reverbWetScale: 1.0, reverbDecayScale: 1.0, masterTrim: 0, lofi: false,
  },
};

// ─── Which styles each function offers (first = default) ──────────────────────

export const STATE_STYLES: Record<MentalState, StyleId[]> = {
  focus:            ['ambient', 'lofi', 'electronic'],
  learning:         ['ambient', 'piano', 'lofi'],
  relaxation:       ['ambient', 'piano', 'classical'],
  sleep:            ['ambient', 'piano', 'cinematic'],
  'mood-boost':     ['lofi', 'ambient', 'electronic'],
  meditation:       ['ambient', 'classical', 'piano'],
  'anxiety-relief': ['ambient', 'piano', 'lofi'],
};

export const DEFAULT_STYLE: Record<MentalState, StyleId> = {
  focus:            'ambient',
  learning:         'ambient',
  relaxation:       'ambient',
  sleep:            'ambient',
  'mood-boost':     'lofi',
  meditation:       'ambient',
  'anxiety-relief': 'ambient',
};
