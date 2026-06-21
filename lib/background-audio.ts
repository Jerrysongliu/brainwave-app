/**
 * BackgroundAudio — keeps audio alive when the screen locks / app backgrounds,
 * and drives the iOS/Android lock-screen "now playing" + remote controls.
 *
 * Why a silent <audio> loop: on iOS the Web Audio API (binaural / soundscapes /
 * music) doesn't register with the system's now-playing center, and the audio
 * session can be torn down in the background. A looping near-silent
 * HTMLAudioElement, started inside the play gesture, holds the audio session and
 * gives the Web MediaSession API a media element to attach lock-screen controls
 * to. In the native Capacitor app this pairs with AVAudioSession(.playback) +
 * the `audio` background mode (see scripts/ios-configure.mjs).
 */

export interface MediaHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export class BackgroundAudio {
  private el: HTMLAudioElement | null = null;
  private started = false;

  /** Must be called from within a user-gesture (the play tap). Idempotent. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    const el = new Audio('/silent.mp3');
    el.loop = true;
    el.preload = 'auto';
    (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    el.volume = 0.0001; // inaudible, but a "playing" element holds the session
    el.play().catch(() => { /* gesture lost; engines still drive sound */ });
    this.el = el;
    this._setState('playing');
  }

  setMetadata(title: string, artist = 'BrainWave'): void {
    const ms = this._ms();
    if (!ms || typeof MediaMetadata === 'undefined') return;
    try {
      ms.metadata = new MediaMetadata({
        title: title || 'BrainWave session',
        artist,
        album: 'BrainWave',
        artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
      });
    } catch { /* ignore */ }
  }

  setHandlers(h: MediaHandlers): void {
    const ms = this._ms();
    if (!ms) return;
    const bind = (action: MediaSessionAction, fn?: () => void) => {
      try { ms.setActionHandler(action, fn ? () => fn() : null); } catch { /* unsupported action */ }
    };
    bind('play', h.onPlay);
    bind('pause', h.onPause);
    bind('nexttrack', h.onNext);
    bind('previoustrack', h.onPrev);
  }

  setPlaying(playing: boolean): void {
    this._setState(playing ? 'playing' : 'paused');
  }

  stop(): void {
    try { this.el?.pause(); } catch { /* ignore */ }
    this.el = null;
    this.started = false;
    this._setState('none');
  }

  private _ms(): MediaSession | null {
    return typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : null;
  }

  private _setState(state: MediaSessionPlaybackState): void {
    const ms = this._ms();
    if (ms) { try { ms.playbackState = state; } catch { /* ignore */ } }
  }
}
