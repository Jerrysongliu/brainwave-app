'use client';

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { GeneratedTrack } from '@/types';
import { FREQUENCY_PROFILES } from '@/lib/brainwave-science';
import {
  NoiseEngine,
  NOISE_LIBRARY,
  NOISE_CATEGORY_LABELS,
  DEFAULT_NOISE,
  type NoiseSoundscape,
  type NoiseCategory,
} from '@/lib/noise-engine';
import { BrainWaveEngine } from '@/lib/audio-engine';
import { AmbientMusicEngine, MUSIC_PROFILES } from '@/lib/ambient-music-engine';
import { RealMusicEngine } from '@/lib/real-music-engine';
import { isRealMusicStyle } from '@/lib/music-tracks';
import { STATE_STYLES, MUSIC_STYLES, DEFAULT_STYLE, type StyleId } from '@/lib/music-styles';
import { useThemePalette } from '@/lib/use-theme';
import { RingGauge } from '@/components/RingGauge';
import { FrequencyCard } from '@/components/FrequencyCard';
import { BackgroundAudio } from '@/lib/background-audio';
import type { MentalState } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  track: GeneratedTrack;
  onPlayingChange?: (playing: boolean) => void;
  onSoundscapeChange?: (id: NoiseSoundscape) => void;
  compact?: boolean; // hides mixer + soundscape, shows only play button
}

const NOISE_CATEGORIES = Object.keys(NOISE_CATEGORY_LABELS) as NoiseCategory[];

/** Shared surface so the player can swap between the synth and real-track engines. */
interface MusicEngine {
  init: (state: MentalState, styleId?: StyleId) => Promise<void>;
  play: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (v: number) => void;
  fadeOut: (sec?: number) => void;
  next?: () => void;        // real-track engine: skip to next track
  dispose: () => void;
  readonly isPlaying: boolean;
}

/** Real recordings for Classical/Lo-fi/Piano; synth engine for the rest. */
function makeMusicEngine(styleId: StyleId, onTitle: (t: string) => void): MusicEngine {
  if (isRealMusicStyle(styleId)) {
    const e = new RealMusicEngine();
    e.onTrackChange = onTitle;
    return e;
  }
  return new AmbientMusicEngine();
}

export interface AudioPlayerHandle { toggle: () => void; isPlaying: boolean; }

export const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(function AudioPlayer(
  { track, onPlayingChange, onSoundscapeChange, compact = false },
  ref,
) {
  const palette = useThemePalette();
  const binauralRef = useRef<BrainWaveEngine | null>(null);
  const musicRef    = useRef<MusicEngine | null>(null);
  const noiseRef    = useRef<NoiseEngine | null>(null);
  const bgRef       = useRef<BackgroundAudio | null>(null);

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [ready,       setReady]       = useState(false);
  const [error,       setError]       = useState('');
  const [musicTitle,  setMusicTitle]  = useState('');
  const [activeCategory, setActiveCategory] = useState<NoiseCategory>('rain');

  const [binauralVol, setBinauralVol] = useState(0.20);
  const [musicVol,    setMusicVol]    = useState(0.65);
  const [natureVol,   setNatureVol]   = useState(0.65);
  const [beatHz,      setBeatHz]      = useState(FREQUENCY_PROFILES[track.mentalState].hz);

  const defaultNoise  = DEFAULT_NOISE[track.mentalState] ?? 'rain';
  const [selectedId,  setSelectedId]  = useState<NoiseSoundscape>(defaultNoise);
  const selectedItem  = NOISE_LIBRARY.find((s) => s.id === selectedId) ?? NOISE_LIBRARY[0];
  const visibleSounds = NOISE_LIBRARY.filter((s) => s.category === activeCategory);
  const musicProfile  = MUSIC_PROFILES[track.mentalState];

  const styleOptions  = STATE_STYLES[track.mentalState];
  const [styleId, setStyleId] = useState<StyleId>(DEFAULT_STYLE[track.mentalState]);

  useEffect(() => {
    setActiveCategory(selectedItem.category);
    onSoundscapeChange?.(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    binauralRef.current = new BrainWaveEngine();
    musicRef.current    = makeMusicEngine(styleId, setMusicTitle);
    noiseRef.current    = new NoiseEngine();
    bgRef.current       = new BackgroundAudio();
    return () => {
      binauralRef.current?.dispose();
      musicRef.current?.dispose();
      noiseRef.current?.dispose();
      bgRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Shared pause/resume so the play button AND lock-screen controls use one path.
  const doPause = useCallback(() => {
    binauralRef.current?.pause();
    musicRef.current?.pause();
    noiseRef.current?.pause();
    setIsPlaying(false);
    onPlayingChange?.(false);
    bgRef.current?.setPlaying(false);
  }, [onPlayingChange]);

  const doResume = useCallback(() => {
    bgRef.current?.start();
    binauralRef.current?.resume();
    musicRef.current?.resume();
    noiseRef.current?.resume();
    setIsPlaying(true);
    onPlayingChange?.(true);
    bgRef.current?.setPlaying(true);
  }, [onPlayingChange]);

  const handleToggle = useCallback(async () => {
    setError('');
    bgRef.current?.start(); // claim the audio session inside the user gesture
    try {
      if (!ready) {
        const binaural = binauralRef.current!;
        const music    = musicRef.current!;
        const noise    = noiseRef.current!;

        // Binaural beats
        await binaural.init();
        binaural.setBinauralBeat(beatHz, 200);
        binaural.setBinauralVolume(binauralVol);
        binaural.play();

        // Generative music
        await music.init(track.mentalState, styleId);
        music.setVolume(musicVol);
        music.play();

        // Nature soundscape
        await noise.init();
        await noise.setSoundscape(selectedId);
        noise.setVolume(natureVol);
        noise.play();

        // Lock-screen now-playing + remote controls
        bgRef.current?.setHandlers({
          onPlay: doResume,
          onPause: doPause,
          onNext: () => musicRef.current?.next?.(),
        });
        bgRef.current?.setMetadata(musicTitle || musicProfile.description.split(',')[0]);

        setReady(true);
        setIsPlaying(true);
        onPlayingChange?.(true);
        bgRef.current?.setPlaying(true);
      } else if (isPlaying) {
        doPause();
      } else {
        doResume();
      }
    } catch (e) {
      setError('Could not start audio. Please allow audio in your browser.');
      console.error(e);
    }
  }, [ready, isPlaying, beatHz, binauralVol, musicVol, natureVol, selectedId, styleId, track.mentalState, onPlayingChange, doPause, doResume, musicTitle, musicProfile]);

  // Keep the lock-screen title in sync with the current track.
  useEffect(() => {
    if (ready) bgRef.current?.setMetadata(musicTitle || musicProfile.description.split(',')[0]);
  }, [musicTitle, ready, musicProfile]);

  // Let the player page drive playback (e.g. Nebula's hero play button).
  useImperativeHandle(ref, () => ({ toggle: handleToggle, isPlaying }), [handleToggle, isPlaying]);

  const handleBinauralVol = (v: number) => { setBinauralVol(v); binauralRef.current?.setBinauralVolume(v); };
  const handleMusicVol    = (v: number) => { setMusicVol(v);    musicRef.current?.setVolume(v); };
  const handleNatureVol   = (v: number) => { setNatureVol(v);   noiseRef.current?.setVolume(v); };
  const handleBeatHz      = (v: number) => { setBeatHz(v);      binauralRef.current?.rampBeat(v, 3); };

  const handleSelectSound = async (id: NoiseSoundscape) => {
    // Tapping the already-selected scene cycles to its next recording.
    if (id === selectedId) {
      if (ready) await noiseRef.current?.cycleVariant();
      return;
    }
    setSelectedId(id);
    onSoundscapeChange?.(id);
    if (ready) await noiseRef.current?.setSoundscape(id);
  };

  // Switching style rebuilds the music engine — and may switch engine TYPE
  // (real-track player vs synth). Old engine fades out while the new fades in.
  const handleSelectStyle = async (id: StyleId) => {
    // Tapping the active style again skips to the next real track (if any).
    if (id === styleId) {
      if (ready && isRealMusicStyle(id)) musicRef.current?.next?.();
      return;
    }
    setStyleId(id);
    if (!isRealMusicStyle(id)) setMusicTitle('');
    if (!ready) return;
    const wasPlaying = isPlaying;
    const old = musicRef.current;
    old?.fadeOut(0.8);

    const music = makeMusicEngine(id, setMusicTitle);
    musicRef.current = music;
    await music.init(track.mentalState, id);
    music.setVolume(musicVol);
    if (wasPlaying) music.play();

    // Dispose the old engine after its fade completes.
    setTimeout(() => old?.dispose(), 1200);
  };

  return (
    <div className="glass rounded-[28px] p-6 space-y-6">
      {error && (
        <div className="text-red-500/90 text-sm bg-red-400/10 rounded-2xl px-4 py-2.5">{error}</div>
      )}

      {/* Play button + track summary (Nebula uses the hero button on the page) */}
      <div className="flex items-center gap-4">
        {palette !== 'nebula' && (
          <button
            onClick={handleToggle}
            className="ring-accent w-16 h-16 flex-shrink-0 rounded-full bg-white/12 hover:bg-white/20 active:scale-95 flex items-center justify-center text-2xl transition-all border border-white/15"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold text-white/90 truncate">{musicTitle || musicProfile.description.split(',')[0]}</p>
          <p className="text-sm text-white/55 mt-0.5">
            {beatHz.toFixed(1)} Hz · {selectedItem.emoji} {selectedItem.label}
          </p>
        </div>
      </div>

      {/* Mixer sliders — hidden in compact mode.
          (Soundscape volume lives in the Soundscape section, not here.) */}
      <div className={compact ? 'hidden' : 'space-y-4'}>
        <p className="text-xs font-semibold text-white/45 uppercase tracking-[0.14em]">
          {palette === 'holographic' ? 'Frequency Matrix' : 'Mixer'}
        </p>

        {palette === 'nebula' ? (
          /* Nebula Wave — circular ring gauges (drag up/down to adjust) */
          <div className="flex justify-around items-start pt-1">
            <RingGauge
              label="Binaural Beat" display={`${beatHz.toFixed(0)} Hz`}
              value={(beatHz - 0.5) / 39.5}
              onChange={(v) => handleBeatHz(0.5 + v * 39.5)}
            />
            <RingGauge
              label="Binaural Tone" display={`${Math.round(binauralVol * 100)}%`}
              value={binauralVol} onChange={handleBinauralVol}
            />
            <RingGauge
              label="Music Mix" display={`${Math.round(musicVol * 100)}%`}
              value={musicVol} onChange={handleMusicVol}
            />
          </div>
        ) : palette === 'holographic' ? (
          /* Holographic — neon "Frequency Matrix" EQ cards (drag left/right) */
          <div className="grid grid-cols-3 gap-2.5">
            <FrequencyCard
              label="Binaural Beat" display={`${beatHz.toFixed(0)} Hz`}
              value={(beatHz - 0.5) / 39.5}
              onChange={(v) => handleBeatHz(0.5 + v * 39.5)}
            />
            <FrequencyCard
              label="Binaural Tone" display={`${Math.round(binauralVol * 100)}%`}
              value={binauralVol} onChange={handleBinauralVol}
            />
            <FrequencyCard
              label="Music Mix" display={`${Math.round(musicVol * 100)}%`}
              value={musicVol} onChange={handleMusicVol}
            />
          </div>
        ) : (
          <>
            {[
              { label: '🧠 Binaural Beat',  suffix: `${beatHz.toFixed(1)} Hz`,          value: beatHz,      min: 0.5, max: 40, step: 0.5, onChange: handleBeatHz },
              { label: '〰️ Binaural Tone',  suffix: `${Math.round(binauralVol * 100)}%`, value: binauralVol, min: 0,   max: 1,  step: 0.01, onChange: handleBinauralVol },
              { label: '🎹 Music',           suffix: `${Math.round(musicVol * 100)}%`,    value: musicVol,    min: 0,   max: 1,  step: 0.01, onChange: handleMusicVol },
            ].map(({ label, suffix, value, min, max, step, onChange }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-sm text-white/65">
                  <span>{label}</span>
                  <span className="font-mono text-white/45">{suffix}</span>
                </div>
                <input
                  type="range" min={min} max={max} step={step}
                  value={value}
                  onChange={(e) => onChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}

            <div className="flex justify-between text-[11px] text-white/40 -mt-0.5">
              <span>δ Delta</span><span>θ Theta</span><span>α Alpha</span><span>β Beta</span><span>γ Gamma</span>
            </div>
          </>
        )}
      </div>

      {/* Music style picker — hidden in compact mode */}
      <div className={compact ? 'hidden' : 'space-y-3'}>
        <p className="text-xs font-semibold text-white/45 uppercase tracking-[0.14em]">Music Style</p>
        <div className="flex gap-2 flex-wrap">
          {styleOptions.map((id) => {
            const st = MUSIC_STYLES[id];
            return (
              <button
                key={id}
                onClick={() => handleSelectStyle(id)}
                className={cn(
                  'flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl border transition-all active:scale-95',
                  styleId === id
                    ? 'bg-white/15 border-white/30 text-white shadow-sm'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60'
                )}
              >
                <span className="text-base leading-none">{st.emoji}</span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-white/45">
          {MUSIC_STYLES[styleId].description}
          {isRealMusicStyle(styleId) && <span className="text-white/35"> · tap again to skip track</span>}
        </p>
      </div>

      {/* Soundscape picker — hidden in compact mode */}
      <div className={compact ? 'hidden' : 'space-y-3'}>
        <p className="text-xs font-semibold text-white/45 uppercase tracking-[0.14em]">Soundscape</p>

        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap">
          {NOISE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'text-sm px-3.5 py-1.5 rounded-xl border transition-all active:scale-95',
                activeCategory === cat
                  ? 'chip-on'
                  : 'bg-transparent border-white/10 text-white/55 hover:text-white/80 hover:border-white/20'
              )}
            >
              {NOISE_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Sound buttons */}
        <div className="flex gap-2 flex-wrap">
          {visibleSounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSelectSound(sound.id)}
              className={cn(
                'flex items-center gap-2 text-sm px-4 py-2.5 rounded-2xl border transition-all active:scale-95',
                selectedId === sound.id
                  ? 'chip-on'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/60'
              )}
            >
              <span className="text-base leading-none">{sound.emoji}</span>
              <span>{sound.label}</span>
            </button>
          ))}
        </div>

        {/* Soundscape volume (the single control for nature sound level) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-sm text-white/65">
            <span>🔊 {selectedItem.label} volume</span>
            <span className="font-mono text-white/45">{Math.round(natureVol * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={natureVol}
            onChange={(e) => handleNatureVol(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <p className="text-[11px] text-white/40">
          Real field recordings · tap a selected sound again for another recording
        </p>
      </div>

      {!ready && (
        <p className="text-center text-[11px] text-white/25">
          🎧 Headphones recommended for binaural effect
        </p>
      )}
    </div>
  );
});
