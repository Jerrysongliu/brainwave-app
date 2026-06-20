'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

export function AudioPlayer({ track, onPlayingChange, onSoundscapeChange, compact = false }: Props) {
  const binauralRef = useRef<BrainWaveEngine | null>(null);
  const musicRef    = useRef<MusicEngine | null>(null);
  const noiseRef    = useRef<NoiseEngine | null>(null);

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
    return () => {
      binauralRef.current?.dispose();
      musicRef.current?.dispose();
      noiseRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = useCallback(async () => {
    setError('');
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

        // Nature soundscape (Tone.js noise — never loops)
        await noise.init();
        await noise.setSoundscape(selectedId);
        noise.setVolume(natureVol);
        noise.play();

        setReady(true);
        setIsPlaying(true);
        onPlayingChange?.(true);
      } else if (isPlaying) {
        binauralRef.current?.pause();
        musicRef.current?.pause();
        noiseRef.current?.pause();
        setIsPlaying(false);
        onPlayingChange?.(false);
      } else {
        binauralRef.current?.resume();
        musicRef.current?.resume();
        noiseRef.current?.resume();
        setIsPlaying(true);
        onPlayingChange?.(true);
      }
    } catch (e) {
      setError('Could not start audio. Please allow audio in your browser.');
      console.error(e);
    }
  }, [ready, isPlaying, beatHz, binauralVol, musicVol, natureVol, selectedId, styleId, track.mentalState, onPlayingChange]);

  const handleBinauralVol = (v: number) => { setBinauralVol(v); binauralRef.current?.setBinauralVolume(v); };
  const handleMusicVol    = (v: number) => { setMusicVol(v);    musicRef.current?.setVolume(v); };
  const handleNatureVol   = (v: number) => { setNatureVol(v);   noiseRef.current?.setVolume(v); };
  const handleBeatHz      = (v: number) => { setBeatHz(v);      binauralRef.current?.rampBeat(v, 3); };

  const handleSelectSound = async (id: NoiseSoundscape) => {
    setSelectedId(id);
    onSoundscapeChange?.(id);
    if (ready) await noiseRef.current?.setSoundscape(id);
  };

  // Switching style rebuilds the music engine — and may switch engine TYPE
  // (real-track player vs synth). Old engine fades out while the new fades in.
  const handleSelectStyle = async (id: StyleId) => {
    if (id === styleId) return;
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
    <div className="glass rounded-2xl p-5 space-y-5">
      {error && (
        <div className="text-red-400/80 text-xs bg-red-400/8 rounded-xl px-3 py-2">{error}</div>
      )}

      {/* Play button + track summary */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToggle}
          className="w-14 h-14 flex-shrink-0 rounded-full bg-white/10 hover:bg-white/18 active:scale-95 flex items-center justify-center text-xl transition-all border border-white/10"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{musicTitle || musicProfile.description.split(',')[0]}</p>
          <p className="text-xs text-white/35 mt-0.5">
            {beatHz.toFixed(1)} Hz · {selectedItem.emoji} {selectedItem.label}
          </p>
        </div>
      </div>

      {/* Mixer sliders — hidden in compact mode */}
      <div className={compact ? 'hidden' : 'space-y-3.5'}>
        <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em]">Mixer</p>

        {[
          { label: '🧠 Binaural Beat',  suffix: `${beatHz.toFixed(1)} Hz`,          value: beatHz,      min: 0.5, max: 40, step: 0.5, onChange: handleBeatHz },
          { label: '〰️ Binaural Tone',  suffix: `${Math.round(binauralVol * 100)}%`, value: binauralVol, min: 0,   max: 1,  step: 0.01, onChange: handleBinauralVol },
          { label: '🎹 Ambient Music',   suffix: `${Math.round(musicVol * 100)}%`,    value: musicVol,    min: 0,   max: 1,  step: 0.01, onChange: handleMusicVol },
          { label: '🌿 Nature Sounds',  suffix: `${Math.round(natureVol * 100)}%`,    value: natureVol,   min: 0,   max: 1,  step: 0.01, onChange: handleNatureVol },
        ].map(({ label, suffix, value, min, max, step, onChange }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs text-white/45">
              <span>{label}</span>
              <span className="font-mono text-white/30">{suffix}</span>
            </div>
            <input
              type="range" min={min} max={max} step={step}
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        ))}

        <div className="flex justify-between text-[9px] text-white/20 -mt-1">
          <span>δ Delta</span><span>θ Theta</span><span>α Alpha</span><span>β Beta</span><span>γ Gamma</span>
        </div>
      </div>

      {/* Music style picker — hidden in compact mode */}
      <div className={compact ? 'hidden' : 'space-y-2.5'}>
        <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em]">Music Style</p>
        <div className="flex gap-2 flex-wrap">
          {styleOptions.map((id) => {
            const st = MUSIC_STYLES[id];
            return (
              <button
                key={id}
                onClick={() => handleSelectStyle(id)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all',
                  styleId === id
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/3 border-white/8 hover:bg-white/8 text-white/45'
                )}
              >
                <span>{st.emoji}</span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[9px] text-white/18">{MUSIC_STYLES[styleId].description}</p>
      </div>

      {/* Soundscape picker — hidden in compact mode */}
      <div className={compact ? 'hidden' : 'space-y-2.5'}>
        <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em]">Soundscape</p>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {NOISE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-lg border transition-all',
                activeCategory === cat
                  ? 'bg-white/12 border-white/25 text-white'
                  : 'bg-transparent border-white/8 text-white/35 hover:text-white/55 hover:border-white/15'
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
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all',
                selectedId === sound.id
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'bg-white/3 border-white/8 hover:bg-white/8 text-white/45'
              )}
            >
              <span>{sound.emoji}</span>
              <span>{sound.label}</span>
            </button>
          ))}
        </div>

        {/* Dedicated soundscape volume — synced with the mixer's Nature slider */}
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between text-xs text-white/45">
            <span>🔊 {selectedItem.label} volume</span>
            <span className="font-mono text-white/30">{Math.round(natureVol * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={natureVol}
            onChange={(e) => handleNatureVol(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <p className="text-[9px] text-white/18">
          Real field recordings · seamless crossfade loop · CC0/CC-licensed
        </p>
      </div>

      {!ready && (
        <p className="text-center text-[11px] text-white/25">
          🎧 Headphones recommended for binaural effect
        </p>
      )}
    </div>
  );
}
