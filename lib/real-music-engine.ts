/**
 * RealMusicEngine — plays bundled real recordings (Ambient / Classical / Lo-fi /
 * Piano) as a shuffled, auto-advancing, gapless playlist.
 *
 * Uses the WEB AUDIO API on Tone's shared AudioContext (same approach as the
 * soundscape engine). This is critical: on iOS, an HTMLAudioElement cannot be
 * re-`play()`ed programmatically when a track ends (no user gesture), so the
 * playlist would stall after one track. Web Audio buffer sources, once the
 * context is unlocked by the initial tap, schedule freely — so tracks advance
 * for the full session. Tracks are lazy-fetched and the next one is prefetched.
 *
 * Drop-in for AmbientMusicEngine's player surface (init/play/pause/resume/
 * setVolume/fadeOut/next/dispose/isPlaying/currentTitle/onTrackChange).
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
  private Tone: any = null;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private src: AudioBufferSourceNode | null = null;
  private srcGain: GainNode | null = null;

  private buffers = new Map<string, AudioBuffer>();
  private playlist: MusicTrack[] = [];
  private idx = 0;
  private token = 0;          // invalidates superseded sources/loads
  private startAt = 0;        // ctx time the current track started
  private offset = 0;         // resume offset into the current track
  private _vol = 0.7;
  private _isPlaying = false;
  private _started = false;

  /** Set by AudioPlayer to show the now-playing title. */
  onTrackChange: ((title: string) => void) | null = null;

  async init(_mentalState: MentalState, styleId?: StyleId): Promise<void> {
    this.Tone = await import('tone');
    await this.Tone.start();
    this.ctx = this.Tone.getContext().rawContext as AudioContext;
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    this.playlist = shuffle((styleId && MUSIC_TRACKS[styleId]) || []);
    this.idx = 0;
    this.offset = 0;
    if (this.playlist[0]) this._prefetch(this.playlist[0].file); // warm the first track
  }

  play(): void {
    if (this._isPlaying || !this.ctx || !this.playlist.length) return;
    this._isPlaying = true;
    this._started = true;
    this._rampMaster(this._vol, 1.2);
    this._playFrom(this.idx, this.offset || 0);
  }

  pause(): void {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    if (this.ctx && this.startAt) {
      this.offset = Math.max(0, (this.ctx.currentTime - this.startAt) + this.offset);
    }
    this.token++;                 // cancel the scheduled advance
    this._rampMaster(0, 0.6);
    this._stopSource(0.65);
  }

  resume(): void {
    if (this._isPlaying || !this.ctx || !this.playlist.length) return;
    if (!this._started) { this.play(); return; }
    this._isPlaying = true;
    this._rampMaster(this._vol, 1.0);
    this._playFrom(this.idx, this.offset || 0);
  }

  setVolume(v: number): void {
    this._vol = Math.max(0, Math.min(1, v));
    if (this._isPlaying) this._rampMaster(this._vol, 0.3);
  }

  /** Skip to the next track (tap the active genre again). */
  next(): void {
    if (this.playlist.length < 2) return;
    this.offset = 0;
    this.idx = (this.idx + 1) % this.playlist.length;
    if (this._isPlaying) this._playFrom(this.idx, 0);
    else this._announce();
  }

  /** Fade out (smooth crossfade when switching styles). */
  fadeOut(sec = 0.8): void {
    this._isPlaying = false;
    this.token++;
    this._rampMaster(0, sec);
    this._stopSource(sec + 0.05);
  }

  dispose(): void {
    this._isPlaying = false;
    this.token++;
    this._stopSource(0.05);
    try { this.master?.disconnect(); } catch { /* ignore */ }
    this.master = null;
    this.buffers.clear();
  }

  get isPlaying() { return this._isPlaying; }
  get currentTitle() { return this.playlist[this.idx]?.title ?? ''; }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async _prefetch(file?: string): Promise<void> {
    if (!file || !this.ctx || this.buffers.has(file)) return;
    try {
      const res = await fetch(file);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers.set(file, buf);
    } catch { /* leave unloaded; _playFrom will retry */ }
  }

  private async _playFrom(i: number, off: number): Promise<void> {
    if (!this.ctx || !this.master) return;
    const myToken = ++this.token;
    this._stopSource(0.12);          // fade out whatever's playing
    const track = this.playlist[i];
    if (!track) return;
    this._announce();

    let buf = this.buffers.get(track.file);
    if (!buf) {
      await this._prefetch(track.file);
      if (myToken !== this.token || !this._isPlaying) return;
      buf = this.buffers.get(track.file);
    }
    if (!buf || myToken !== this.token || !this._isPlaying) return;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    src.connect(g);
    g.connect(this.master);

    const now = this.ctx.currentTime;
    const startOff = Math.max(0, Math.min(off, buf.duration - 0.1));
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(1, now + 0.4);   // gentle fade-in
    src.start(now, startOff);

    this.src = src;
    this.srcGain = g;
    this.startAt = now;
    this.offset = startOff;

    // Prefetch the next track so the hand-off is gapless
    this._prefetch(this.playlist[(i + 1) % this.playlist.length]?.file);

    // Auto-advance when this track ends (no user gesture needed — Web Audio)
    src.onended = () => {
      if (myToken !== this.token || !this._isPlaying) return;
      this.offset = 0;
      this.idx = (i + 1) % this.playlist.length;
      this._playFrom(this.idx, 0);
    };
  }

  private _stopSource(fade: number): void {
    if (!this.ctx) return;
    const s = this.src, g = this.srcGain;
    this.src = null; this.srcGain = null;
    if (s && g) {
      try {
        const now = this.ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0, now + fade);
        s.onended = null;
        s.stop(now + fade + 0.02);
      } catch { /* already stopped */ }
    }
  }

  private _rampMaster(to: number, sec: number): void {
    if (!this.master || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(to, now + sec);
  }

  private _announce(): void {
    this.onTrackChange?.(this.currentTitle);
  }
}
