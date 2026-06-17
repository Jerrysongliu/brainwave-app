/**
 * NoiseEngine — synthesizes nature soundscapes using Tone.js
 * Never loops, never clicks, zero HTTP requests.
 *
 * Signal chain:
 *   Noise → AutoFilter (LFO-driven) → Reverb → MasterVol → destination
 *
 * The LFO makes the filter frequency sweep slowly, producing organic
 * texture: ocean waves, rain intensity, wind gusts, etc.
 */

import type { MentalState } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NoiseSoundscape =
  | 'rain' | 'rain-heavy' | 'storm'
  | 'ocean' | 'wind' | 'wind-howl'
  | 'fire' | 'night' | 'forest'
  | 'none';

interface NoiseProfile {
  noiseType: 'white' | 'pink' | 'brown';
  filterType: 'lowpass' | 'highpass' | 'bandpass';
  baseFreq: number;
  filterQ: number;
  lfoRate: number;    // Hz  (0 = static filter)
  lfoOctaves: number; // sweep range in octaves
  reverbDecay: number;
  reverbWet: number;
  volume: number;     // dB (design loudness at slider = 1)
}

// ─── Soundscape profiles ─────────────────────────────────────────────────────
//
// All soundscapes are sourced from WHITE noise and shaped by filters. White
// noise loops seamlessly (independent samples → no audible seam), unlike Tone's
// brown/pink noise whose short looped buffers produce a periodic low "thump".
//
// `volume` is hand-tuned for roughly EQUAL PERCEIVED loudness. The ear hears
// midrange (1–4 kHz) far louder than low rumble, so low/dark soundscapes
// (fire, ocean, gentle rain) get more gain (less negative dB) and bright ones
// (storm, night, heavy rain) get less. Lowpass scenes also use a steeper
// rolloff (set in _build) so they read as rumble, not hiss.

const PROFILES: Record<NoiseSoundscape, NoiseProfile> = {
  rain:       { noiseType:'white', filterType:'lowpass',  baseFreq:650,  filterQ:0.4, lfoRate:0.06, lfoOctaves:0.5, reverbDecay:1.5, reverbWet:0.18, volume:-5  },
  'rain-heavy':{ noiseType:'white', filterType:'lowpass', baseFreq:1300, filterQ:0.4, lfoRate:0.12, lfoOctaves:0.7, reverbDecay:1.2, reverbWet:0.15, volume:-11 },
  storm:      { noiseType:'white', filterType:'lowpass',  baseFreq:1700, filterQ:0.3, lfoRate:0.10, lfoOctaves:1.0, reverbDecay:2.0, reverbWet:0.22, volume:-13 },
  ocean:      { noiseType:'white', filterType:'lowpass',  baseFreq:480,  filterQ:0.6, lfoRate:0.05, lfoOctaves:1.6, reverbDecay:3.0, reverbWet:0.30, volume:-5  },
  wind:       { noiseType:'white', filterType:'bandpass', baseFreq:700,  filterQ:1.0, lfoRate:0.10, lfoOctaves:1.2, reverbDecay:1.5, reverbWet:0.22, volume:-9  },
  'wind-howl':{ noiseType:'white', filterType:'bandpass', baseFreq:1300, filterQ:1.8, lfoRate:0.14, lfoOctaves:1.8, reverbDecay:2.0, reverbWet:0.26, volume:-11 },
  fire:       { noiseType:'white', filterType:'lowpass',  baseFreq:420,  filterQ:0.3, lfoRate:0.25, lfoOctaves:0.8, reverbDecay:0.8, reverbWet:0.12, volume:-4  },
  night:      { noiseType:'white', filterType:'bandpass', baseFreq:4500, filterQ:3.0, lfoRate:0.06, lfoOctaves:0.4, reverbDecay:1.0, reverbWet:0.18, volume:-20 },
  forest:     { noiseType:'white', filterType:'lowpass',  baseFreq:2200, filterQ:0.5, lfoRate:0.08, lfoOctaves:0.8, reverbDecay:2.0, reverbWet:0.26, volume:-13 },
  none:       { noiseType:'white', filterType:'lowpass',  baseFreq:80,   filterQ:0.5, lfoRate:0,    lfoOctaves:0,   reverbDecay:1.0, reverbWet:0.0,  volume:-60 },
};

// ─── Public library (for UI) ──────────────────────────────────────────────────

export type NoiseCategory = 'rain' | 'water' | 'wind' | 'fire' | 'night' | 'forest';

export const NOISE_CATEGORY_LABELS: Record<NoiseCategory, string> = {
  rain:   '🌧 Rain',
  water:  '🌊 Water',
  wind:   '🌬 Wind',
  fire:   '🔥 Fire',
  night:  '🌙 Night',
  forest: '🌲 Forest',
};

export const NOISE_LIBRARY: {
  id: NoiseSoundscape; label: string; emoji: string; category: NoiseCategory;
}[] = [
  { id: 'rain',       label: 'Gentle Rain',  emoji: '🌧',  category: 'rain'   },
  { id: 'rain-heavy', label: 'Heavy Rain',   emoji: '🌨',  category: 'rain'   },
  { id: 'storm',      label: 'Thunderstorm', emoji: '⛈',  category: 'rain'   },
  { id: 'ocean',      label: 'Ocean Waves',  emoji: '🌊',  category: 'water'  },
  { id: 'wind',       label: 'Wind',         emoji: '🌬',  category: 'wind'   },
  { id: 'wind-howl',  label: 'Howling Wind', emoji: '💨',  category: 'wind'   },
  { id: 'fire',       label: 'Fireplace',    emoji: '🔥',  category: 'fire'   },
  { id: 'night',      label: 'Night Sounds', emoji: '🌙',  category: 'night'  },
  { id: 'forest',     label: 'Forest',       emoji: '🌲',  category: 'forest' },
];

export const DEFAULT_NOISE: Record<MentalState, NoiseSoundscape> = {
  focus:            'rain',
  learning:         'forest',
  relaxation:       'ocean',
  sleep:            'rain',
  'mood-boost':     'forest',
  meditation:       'ocean',
  'anxiety-relief': 'rain',
};

// ─── Engine ──────────────────────────────────────────────────────────────────

export class NoiseEngine {
  private Tone: any = null;
  private noise: any      = null;
  private autoFilter: any = null;
  private reverb: any     = null;
  private masterVol: any  = null;

  private _isPlaying = false;
  private _initialized = false;
  private _building = false;
  private _volume = 0.5;
  private _soundscape: NoiseSoundscape = 'rain';

  async init(): Promise<void> {
    if (this._initialized) return;
    this.Tone = await import('tone');
    await this.Tone.start();
    this._initialized = true;
  }

  async setSoundscape(id: NoiseSoundscape): Promise<void> {
    this._soundscape = id;
    if (!this._initialized || this._building) return;
    this._building = true;
    const wasPlaying = this._isPlaying;
    this._teardown();
    try {
      await this._build(id);
      if (wasPlaying) this._startNoise();
    } finally {
      this._building = false;
    }
  }

  play(): void {
    if (!this._initialized) return;
    this._isPlaying = true;
    if (!this.noise) {
      this._build(this._soundscape).then(() => this._startNoise());
      return;
    }
    this._startNoise();
  }

  pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    this.masterVol?.volume.rampTo(-60, 1.5);
  }

  resume(): void {
    if (this._isPlaying || !this._initialized) return;
    this._isPlaying = true;
    this.masterVol?.volume.rampTo(this._dbAtVolume(), 1.5);
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._isPlaying && this.masterVol) {
      this.masterVol.volume.rampTo(this._dbAtVolume(), 0.4);
    }
  }

  dispose(): void {
    this._isPlaying = false;
    this._teardown();
  }

  get isPlaying() { return this._isPlaying; }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async _build(id: NoiseSoundscape): Promise<void> {
    if (!this.Tone) return;
    const T = this.Tone;
    const p = PROFILES[id];

    this.masterVol = new T.Volume(-60); // start silent, fade in on play
    this.masterVol.toDestination();

    this.reverb = new T.Reverb({ decay: p.reverbDecay, wet: p.reverbWet, preDelay: 0.01 });
    await this.reverb.ready;
    this.reverb.connect(this.masterVol);

    // Steeper rolloff on lowpass scenes turns bright white noise into a soft
    // low rumble (rain/ocean/fire); bandpass scenes keep a gentler slope.
    const rolloff = (p.filterType === 'lowpass' ? -48 : -24) as -24 | -48;
    this.autoFilter = new T.AutoFilter({
      frequency: p.lfoRate > 0 ? p.lfoRate : 0.001,
      baseFrequency: p.baseFreq,
      octaves: p.lfoOctaves,
      type: 'sine',
      wet: p.lfoRate > 0 ? 1 : 0,
      filter: { type: p.filterType, rolloff, Q: p.filterQ },
    });
    if (p.lfoRate > 0) this.autoFilter.start();
    this.autoFilter.connect(this.reverb);

    this.noise = new T.Noise(p.noiseType);
    this.noise.connect(this.autoFilter);
  }

  private _startNoise(): void {
    if (!this.noise) return;
    try { this.noise.start(); } catch { /* already running */ }
    this.masterVol?.volume.rampTo(this._dbAtVolume(), 1.5);
  }

  private _teardown(): void {
    try {
      this.noise?.stop();
      this.noise?.dispose();
      this.autoFilter?.dispose();
      this.reverb?.dispose();
      this.masterVol?.dispose();
    } catch { /* ignore */ }
    this.noise = null;
    this.autoFilter = null;
    this.reverb = null;
    this.masterVol = null;
  }

  private _dbAtVolume(): number {
    if (this._volume <= 0) return -60;
    const p = PROFILES[this._soundscape];
    // Linear interpolation from -60dB (silence) to profile design volume
    return -60 + this._volume * (p.volume + 60);
  }
}
