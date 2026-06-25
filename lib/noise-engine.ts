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
  files: string[];  // one or more recordings; tap the active scene to cycle them
  gain:  number;    // 0–1 loudness normalization (design level at slider = 1)
  xfade: number;    // crossfade seconds at the loop point
}

// ─── Scene profiles ───────────────────────────────────────────────────────────
// Scenes with multiple files: tapping the already-selected scene cycles to the
// next recording (crossfaded). Single-file scenes just re-trigger.

const PROFILES: Record<NoiseSoundscape, SceneProfile> = {
  rain:   { files: ['/sounds/rain.mp3', '/sounds/rain-2.mp3', '/sounds/rain-3.mp3'], gain: 0.9, xfade: 2.5 },
  storm:  { files: ['/sounds/storm.mp3', '/sounds/storm-2.mp3'],   gain: 0.9, xfade: 2.5 },
  ocean:  { files: ['/sounds/ocean.mp3'],                          gain: 0.9, xfade: 2.5 },
  river:  { files: ['/sounds/river.mp3'],                          gain: 0.9, xfade: 2.5 },
  fire:   { files: ['/sounds/fire.mp3'],                           gain: 0.9, xfade: 2.0 },
  forest: { files: ['/sounds/forest.mp3', '/sounds/forest-2.mp3'], gain: 0.9, xfade: 2.5 },
  pond:   { files: ['/sounds/pond.mp3'],                           gain: 0.9, xfade: 2.5 },
  night:  { files: ['/sounds/night.mp3', '/sounds/night-2.mp3'],   gain: 0.9, xfade: 2.5 },
  none:   { files: [],                                             gain: 0,   xfade: 0   },
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
  private _volume = 0.65;
  private _soundscape: NoiseSoundscape = 'rain';
  private _variant = 0;          // which recording within the current scene

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
    if (id !== this._soundscape) { this._soundscape = id; this._variant = 0; }
    if (!this._initialized) return;
    await this._switchTo(this._currentFile());
  }

  /** Tap the already-selected scene again → crossfade to its next recording. */
  async cycleVariant(): Promise<void> {
    const n = PROFILES[this._soundscape].files.length;
    if (n < 2) return;
    this._variant = (this._variant + 1) % n;
    if (this._initialized) await this._switchTo(this._currentFile());
  }

  play(): void {
    if (!this._initialized) return;
    this._isPlaying = true;
    const file = this._currentFile();
    if (!file) return;
    const myToken = ++this.token;
    this._load(file).then((buf) => {
      if (!buf || myToken !== this.token || !this._isPlaying) return;
      this._rampMaster(this._target(), 1.5);
      this._startLoop(buf, PROFILES[this._soundscape], myToken);
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
  get variantIndex() { return this._variant; }
  get variantCount() { return PROFILES[this._soundscape].files.length; }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _currentFile(): string {
    const f = PROFILES[this._soundscape].files;
    return f.length ? f[this._variant % f.length] : '';
  }

  /** Crossfade the active loop over to `file` (used by scene switch + variant cycle). */
  private async _switchTo(file: string): Promise<void> {
    const myToken = ++this.token;        // cancel any in-flight loop/load
    this._stopActive(0.6);
    if (this.loopTimer) { clearTimeout(this.loopTimer); this.loopTimer = null; }
    if (!file) return;
    const buf = await this._load(file);
    if (!buf || myToken !== this.token) return; // superseded
    if (this._isPlaying) this._startLoop(buf, PROFILES[this._soundscape], myToken);
  }

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

  private async _load(file: string): Promise<AudioBuffer | null> {
    if (!file || !this.ctx) return null;
    const cached = this.buffers.get(file);
    if (cached) return cached;
    try {
      const res = await fetch(file);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers.set(file, buf);
      return buf;
    } catch {
      return null;
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
