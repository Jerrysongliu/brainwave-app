'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GeneratedTrack } from '@/types';
import { MENTAL_STATE_META, FREQUENCY_PROFILES } from '@/lib/brainwave-science';
import {
  SOUNDSCAPE_LIBRARY,
  CATEGORY_LABELS,
  DEFAULT_SOUNDSCAPE,
  type SoundCategory,
} from '@/lib/ambient-tracks';
import { BrainWaveEngine } from '@/lib/audio-engine';
import { AmbientMusicEngine, MUSIC_PROFILES } from '@/lib/ambient-music-engine';
import { cn } from '@/lib/utils';

interface Props {
  track: GeneratedTrack;
  onPlayingChange?: (playing: boolean) => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as SoundCategory[];

export function AudioPlayer({ track, onPlayingChange }: Props) {
  // Engines
  const binauralRef = useRef<BrainWaveEngine | null>(null);
  const musicRef = useRef<AmbientMusicEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<SoundCategory>('rain');

  // Volume mix (0–1)
  const [binauralVol, setBinauralVol] = useState(0.25);
  const [musicVol, setMusicVol] = useState(0.6);
  const [natureVol, setNatureVol] = useState(0.5);

  // Beat frequency
  const [beatHz, setBeatHz] = useState(FREQUENCY_PROFILES[track.mentalState].hz);

  // Soundscape
  const defaultId = DEFAULT_SOUNDSCAPE[track.mentalState] ?? SOUNDSCAPE_LIBRARY[0].id;
  const [selectedId, setSelectedId] = useState(defaultId);
  const selectedTrack = SOUNDSCAPE_LIBRARY.find((s) => s.id === selectedId) ?? SOUNDSCAPE_LIBRARY[0];
  const visibleSounds = SOUNDSCAPE_LIBRARY.filter((s) => s.category === activeCategory);

  const meta = MENTAL_STATE_META[track.mentalState];
  const profile = FREQUENCY_PROFILES[track.mentalState];
  const musicProfile = MUSIC_PROFILES[track.mentalState];

  useEffect(() => {
    setActiveCategory(selectedTrack.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create engines on mount, dispose on unmount
  useEffect(() => {
    binauralRef.current = new BrainWaveEngine();
    musicRef.current = new AmbientMusicEngine();
    return () => {
      binauralRef.current?.dispose();
      musicRef.current?.dispose();
    };
  }, []);

  const handleToggle = useCallback(async () => {
    setError('');
    try {
      if (!ready) {
        // ── First play: initialise all three layers ──────────────────────
        const binaural = binauralRef.current!;
        const music = musicRef.current!;

        // Layer 1: binaural beats
        await binaural.init();
        binaural.setBinauralBeat(beatHz, 200);
        binaural.setBinauralVolume(binauralVol);
        binaural.setAmbientVolume(0); // nature handled separately
        binaural.play();

        // Layer 2: generative ambient music
        await music.init(track.mentalState);
        music.setVolume(musicVol);
        music.play();

        // Layer 3: nature soundscape (via binaural engine's ambient slot)
        binaural.setAmbientVolume(natureVol);
        await binaural.setAmbient(selectedTrack.url);

        setReady(true);
        setIsPlaying(true);
        onPlayingChange?.(true);
      } else if (isPlaying) {
        binauralRef.current?.pause();
        musicRef.current?.pause();
        setIsPlaying(false);
        onPlayingChange?.(false);
      } else {
        binauralRef.current?.resume();
        musicRef.current?.resume();
        setIsPlaying(true);
        onPlayingChange?.(true);
      }
    } catch (e) {
      setError('Could not start audio. Please allow audio in your browser.');
      console.error(e);
    }
  }, [ready, isPlaying, beatHz, binauralVol, musicVol, natureVol, selectedTrack, track.mentalState, onPlayingChange]);

  const handleBinauralVol = (v: number) => {
    setBinauralVol(v);
    binauralRef.current?.setBinauralVolume(v);
  };

  const handleMusicVol = (v: number) => {
    setMusicVol(v);
    musicRef.current?.setVolume(v);
  };

  const handleNatureVol = (v: number) => {
    setNatureVol(v);
    binauralRef.current?.setAmbientVolume(v);
  };

  const handleBeatHz = (v: number) => {
    setBeatHz(v);
    binauralRef.current?.rampBeat(v, 3);
  };

  const handleSelectSound = async (id: string) => {
    setSelectedId(id);
    const sound = SOUNDSCAPE_LIBRARY.find((s) => s.id === id);
    if (ready && sound) await binauralRef.current?.setAmbient(sound.url);
  };

  return (
    <div className={cn('rounded-3xl p-6 bg-gradient-to-br text-white space-y-6', meta.color)}>
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-2">{meta.emoji}</div>
        <h2 className="text-xl font-bold">{track.title}</h2>
        <p className="text-sm text-white/70 mt-1">
          {meta.label} · {track.duration} min · {track.intensity}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          {beatHz.toFixed(1)} Hz · {musicProfile.description.split(',')[0]}
        </p>
      </div>

      {error && (
        <div className="text-red-200 text-xs bg-red-500/20 rounded-xl px-3 py-2">{error}</div>
      )}

      {/* Play button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleToggle}
          className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-3xl transition-all"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>
      </div>

      {/* 3-layer mixer */}
      <div className="space-y-4 bg-black/20 rounded-2xl p-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Mixer</p>

        {/* Beat frequency */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>🧠 Binaural Beat</span>
            <span className="font-mono font-bold">{beatHz.toFixed(1)} Hz</span>
          </div>
          <input
            type="range" min={0.5} max={40} step={0.5}
            value={beatHz}
            onChange={(e) => handleBeatHz(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>Delta</span><span>Theta</span><span>Alpha</span><span>Beta</span><span>Gamma</span>
          </div>
        </div>

        {/* Binaural tone volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>〰️ Binaural Tone Level</span>
            <span>{Math.round(binauralVol * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={binauralVol}
            onChange={(e) => handleBinauralVol(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Generative music volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>🎹 Ambient Music</span>
            <span>{Math.round(musicVol * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={musicVol}
            onChange={(e) => handleMusicVol(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Nature soundscape volume */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/70">
            <span>🌿 Nature Sounds</span>
            <span>{Math.round(natureVol * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={natureVol}
            onChange={(e) => handleNatureVol(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Soundscape picker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Nature Soundscape</p>
          <p className="text-xs text-white/40">{selectedTrack.emoji} {selectedTrack.label}</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg border transition-all',
                activeCategory === cat
                  ? 'bg-white/25 border-white/40 text-white font-medium'
                  : 'bg-white/5 border-white/10 hover:bg-white/15 text-white/50'
              )}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Sounds in active category */}
        <div className="flex gap-2 flex-wrap">
          {visibleSounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => handleSelectSound(sound.id)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border transition-all',
                selectedId === sound.id
                  ? 'bg-white text-black border-white font-medium'
                  : 'bg-white/10 border-white/20 hover:bg-white/20 text-white/70'
              )}
            >
              <span>{sound.emoji}</span>
              <span>{sound.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-white/25">{selectedTrack.source}</p>
      </div>

      {!ready && (
        <p className="text-center text-xs text-white/40">
          🎧 Use headphones — three layers blend for the full effect
        </p>
      )}
    </div>
  );
}
