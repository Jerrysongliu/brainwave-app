/**
 * NoiseEngine v2 — REAL recorded ambience with seamless crossfade looping.
 *
 * Replaces the synthesized white-noise scenes with bundled CC0 / Creative
 * Commons field recordings (see /public/sounds/CREDITS.txt). Each scene is one
 * recording that is looped *seamlessly* by overlapping two playheads with a
 * short equal-time crossfade at the loop point — so there is no audible seam,
 * regardless of whether the file was crafted to loop.
 *
 * Signal: AudioBufferSource → instanceGain (fade env) → masterGain (volume) → out
 *
 * Uses Tone's shared AudioContext so it coexists with the music/binaural engines.
 */

import type { MentalState } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type NoiseSoundscape =
  | 'rain' | 'storm'
  | 'ocean' | 'river'
  | 'fire'
  | 'forest' | 'pond'
  | 'night'
  | 'none';

export type NoiseCategory = 'rain' | 'water' | 'fire' | 'forest' | 'night';

interface SceneProfile {
  file:  string;   // public path
  gain:  number;   // 0–1 loudness normalization (design level at slider = 1)
  xfade: number;   // crossfade seconds at the loop point
}

// ─── Scene profiles ───────────────────────────────────────────────────────────

const PROFILES: Record<NoiseSoundscape, SceneProfile> = {
  rain:   { file: '/sounds/rain.mp3',   gain: 0.85, xfade: 1.5 },
  storm:  { file: '/sounds/storm.mp3',  gain: 0.80, xfade: 3.0 },
  ocean:  { file: '/sounds/ocean.mp3',  gain: 0.95, xfade: 3.0 },
  river:  { file: '/sounds/river.mp3',  gain: 0.80, xfade: 2.5 },
  fire:   { file: '/sounds/fire.mp3',   gain: 0.95, xfade: 2.0 },
  forest: { file: '/sounds/forest.mp3', gain: 0.90, xfade: 2.0 },
  pond:   { file: '/sounds/pond.mp3',   gain: 0.90, xfade: 2.5 },
  night:  { file: '/sounds/night.mp3',  gain: 0.85, xfade: 1.2 },
  none:   { file: '',                   gain: 0,    xfade: 0   },
};

// ─── Public library (for UI) ──────────────────────────────────────────────────

export const NOISE_CATEGORY_LABELS: Record<NoiseCategory, string> = {
  rain:   '🌧 Rain',
  water:  '🌊 Water',
  fire:   '🔥 Fire',
  forest: '🌲 Forest',
  night:  '🌙 Night',
};

export const NOISE_LIBRARY: {
  id: NoiseSoundscape; label: string; emoji: string; category: NoiseCategory;
}[] = [
  { id: 'rain',   label: 'Rain',         emoji: '🌧', category: 'rain'   },
  { id: 'storm',  label: 'Thunderstorm', emoji: '⛈', category: 'rain'   },
  { id: 'ocean',  label: 'Ocean Waves',  emoji: '🌊', category: 'water'  },
  { id: 'river',  label: 'River',        emoji: '🏞', category: 'water'  },
  { id: 'fire',   label: 'Campfire',     emoji: '🔥', category: 'fire'   },
  { id: 'forest', label: 'Forest Birds', emoji: '🌲', category: 'forest' },
  { id: 'pond',   label: 'Wetland Pond', emoji: '🐸', category: 'forest' },
  { id: 'night',  label: 'Crickets',     emoji: '🦗', category: 'night'  },
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
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private buffers = new Map<string, AudioBuffer>();
  private active: { src: AudioBufferSourceNode; g: GainNode }[] = [];
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private token = 0;            // invalidates stale scheduling/loads

  private _isPlaying = false;
  private _initialized = false;
  private _loading = false;
  private _volume = 0.65;
  private _soundscape: NoiseSoundscape = 'rain';

  async init(): Promise<void> {
    if (this._initialized) return;
    this.Tone = await import('tone');
    await this.Tone.start();
    this.ctx = this.Tone.getContext().rawContext as AudioContext;
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0;
    this.masterGain.connect(this.ctx.destination);
    this._initialized = true;
  }

  async setSoundscape(id: NoiseSoundscape): Promise<void> {
    this._soundscape = id;
    if (!this._initialized) return;
    const myToken = ++this.token;       // cancel any in-flight loop/load
    this._stopActive(0.6);
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    if (id === 'none') return;

    const buf = await this._load(id);
    if (!buf || myToken !== this.token) return; // superseded
    if (this._isPlaying) this._startLoop(buf, PROFILES[id], myToken);
  }

  play(): void {
    if (!this._initialized) return;
    this._isPlaying = true;
    const id = this._soundscape;
    if (id === 'none') return;
    const myToken = ++this.token;
    this._load(id).then((buf) => {
      if (!buf || myToken !== this.token || !this._isPlaying) return;
      this.masterGain!.gain.cancelScheduledValues(this.ctx!.currentTime);
      this.masterGain!.gain.setValueAtTime(this.masterGain!.gain.value, this.ctx!.currentTime);
      this.masterGain!.gain.linearRampToValueAtTime(this._target(), this.ctx!.currentTime + 1.5);
      this._startLoop(buf, PROFILES[id], myToken);
    });
  }

  pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    this._rampMaster(0, 1.2);
    // Stop scheduling new instances; let the fade finish, then stop sources.
    this.token++;
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    setTimeout(() => this._stopActive(0.05), 1300);
  }

  resume(): void {
    if (this._isPlaying || !this._initialized) return;
    this.play();
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this._isPlaying && this.masterGain) this._rampMaster(this._target(), 0.4);
  }

  dispose(): void {
    this._isPlaying = false;
    this.token++;
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    this._stopActive(0.05);
    try { this.masterGain?.disconnect(); } catch { /* ignore */ }
    this.masterGain = null;
    this.buffers.clear();
  }

  get isPlaying() { return this._isPlaying; }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _target(): number {
    if (this._volume <= 0) return 0;
    return PROFILES[this._soundscape].gain * this._volume;
  }

  private _rampMaster(to: number, sec: number): void {
    if (!this.masterGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(to, now + sec);
  }

  private async _load(id: NoiseSoundscape): Promise<AudioBuffer | null> {
    const prof = PROFILES[id];
    if (!prof.file || !this.ctx) return null;
    const cached = this.buffers.get(prof.file);
    if (cached) return cached;
    if (this._loading) { /* allow concurrent; each awaits its own fetch */ }
    try {
      this._loading = true;
      const res = await fetch(prof.file);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers.set(prof.file, buf);
      return buf;
    } catch {
      return null;
    } finally {
      this._loading = false;
    }
  }

  /** Seamless crossfade loop: overlap successive playbacks by `xfade` seconds. */
  private _startLoop(buf: AudioBuffer, prof: SceneProfile, myToken: number): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const dur = buf.duration;
    const x   = Math.min(prof.xfade, dur * 0.45);

    const startOne = (at: number) => {
      if (myToken !== this.token) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      src.connect(g);
      g.connect(this.masterGain!);

      // Equal-time fade in at the head and fade out at the tail
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(1, at + x);
      g.gain.setValueAtTime(1, at + Math.max(x, dur - x));
      g.gain.linearRampToValueAtTime(0, at + dur);

      src.start(at);
      src.stop(at + dur + 0.05);
      const entry = { src, g };
      this.active.push(entry);
      src.onended = () => {
        this.active = this.active.filter((e) => e !== entry);
        try { src.disconnect(); g.disconnect(); } catch { /* ignore */ }
      };

      // Schedule the next overlapping instance a little before this one ends
      const nextAt = at + dur - x;
      const delayMs = Math.max(0, (nextAt - ctx.currentTime - 0.25) * 1000);
      this.loopTimer = setTimeout(() => {
        if (this._isPlaying && myToken === this.token) startOne(nextAt);
      }, delayMs);
    };

    startOne(ctx.currentTime + 0.08);
  }

  private _stopActive(fade: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const dying = this.active;
    this.active = [];
    for (const { src, g } of dying) {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + fade);
        src.stop(now + fade + 0.02);
      } catch { /* already stopped */ }
    }
  }
}
