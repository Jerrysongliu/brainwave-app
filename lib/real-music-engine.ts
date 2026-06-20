/**
 * RealMusicEngine — plays bundled real recordings (Classical / Lo-fi / Piano)
 * as a shuffled, auto-advancing playlist.
 *
 * Drop-in for AmbientMusicEngine's player surface (init/play/pause/resume/
 * setVolume/fadeOut/dispose/isPlaying) so AudioPlayer can swap between the two
 * by style. Uses ONE HTMLAudioElement (not a Web Audio graph) for maximum
 * mobile/iOS reliability and so only the current track is fetched (lazy-load).
 * Tracks fade in on start and advance to the next one when they end.
 */

import type { MentalState } from '@/types';
import type { StyleId } from './music-styles';
import { MUSIC_TRACKS, type MusicTrack } from './music-tracks';

function shuffle<T>(a: T[]): T[] {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export class RealMusicEngine {
  private el: HTMLAudioElement | null = null;
  private playlist: MusicTrack[] = [];
  private idx = 0;
  private _vol = 0.7;
  private _isPlaying = false;
  private rampId: ReturnType<typeof setInterval> | null = null;

  /** Set by AudioPlayer to show the now-playing title. */
  onTrackChange: ((title: string) => void) | null = null;

  // styleId selects the genre playlist; mentalState is unused (kept for parity)
  async init(_mentalState: MentalState, styleId?: StyleId): Promise<void> {
    const tracks = (styleId && MUSIC_TRACKS[styleId]) || [];
    this.playlist = shuffle(tracks);
    this.idx = 0;
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.volume = 0;
    this.el.onended = () => this._next();
    if (this.playlist[0]) this.el.src = this.playlist[0].file;
  }

  play(): void {
    if (this._isPlaying || !this.el || !this.playlist.length) return;
    this._isPlaying = true;
    this.el.volume = 0;
    this.el.play().catch(() => { /* autoplay blocked / not ready */ });
    this._ramp(this._vol, 1.2);
    this._announce();
  }

  pause(): void {
    if (!this._isPlaying || !this.el) return;
    this._isPlaying = false;
    this._ramp(0, 0.6, () => this.el?.pause());
  }

  resume(): void {
    if (this._isPlaying || !this.el || !this.playlist.length) return;
    this._isPlaying = true;
    this.el.play().catch(() => {});
    this._ramp(this._vol, 1.0);
    this._announce();
  }

  setVolume(v: number): void {
    this._vol = Math.max(0, Math.min(1, v));
    if (this._isPlaying) this._ramp(this._vol, 0.3);
  }

  /** Fade out (used for a smooth crossfade when switching styles). */
  fadeOut(sec = 0.8): void {
    this._isPlaying = false;
    this._ramp(0, sec, () => this.el?.pause());
  }

  dispose(): void {
    this._isPlaying = false;
    this._clearRamp();
    if (this.el) {
      try { this.el.pause(); this.el.onended = null; this.el.src = ''; this.el.load(); } catch { /* ignore */ }
    }
    this.el = null;
  }

  get isPlaying() { return this._isPlaying; }
  get currentTitle() { return this.playlist[this.idx]?.title ?? ''; }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _next(): void {
    if (!this.el || !this.playlist.length) return;
    this.idx = (this.idx + 1) % this.playlist.length;
    this.el.src = this.playlist[this.idx].file;
    this.el.volume = 0;
    if (this._isPlaying) {
      this.el.play().catch(() => {});
      this._ramp(this._vol, 1.5);
    }
    this._announce();
  }

  private _announce(): void {
    this.onTrackChange?.(this.currentTitle);
  }

  private _ramp(target: number, sec: number, done?: () => void): void {
    if (!this.el) return;
    this._clearRamp();
    const el = this.el;
    const start = el.volume;
    const t0 = performance.now();
    const dur = Math.max(1, sec * 1000);
    this.rampId = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / dur);
      try { el.volume = Math.max(0, Math.min(1, start + (target - start) * p)); } catch { /* detached */ }
      if (p >= 1) { this._clearRamp(); done?.(); }
    }, 50);
  }

  private _clearRamp(): void {
    if (this.rampId) { clearInterval(this.rampId); this.rampId = null; }
  }
}
