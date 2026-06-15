'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GeneratedTrack } from '@/types';
import { FREQUENCY_PROFILES } from '@/lib/brainwave-science';
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
  const binauralRef = useRef<BrainWaveEngine | null>(null);
  const musicRef = useRef<AmbientMusicEngine | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<SoundCategory>('rain');

  const [binauralVol, setBinauralVol] = useState(0.25);
  const [musicVol, setMusicVol] = useState(0.6);
  const [natureVol, setNatureVol] = useState(0.5);
  const [beatHz, setBeatHz] = useState(FREQUENCY_PROFILES[track.mentalState].hz);

  const defaultId = DEFAULT_SOUNDSCAPE[track.mentalState] ?? SOUNDSCAPE_LIBRARY[0].id;
  const [selectedId, setSelectedId] = useState(defaultId);
  const selectedTrack = SOUNDSCAPE_LIBRARY.find((s) => s.id === selectedId) ?? SOUNDSCAPE_LIBRARY[0];
  const visibleSounds = SOUNDSCAPE_LIBRARY.filter((s) => s.category === activeCategory);
  const musicProfile = MUSIC_PROFILES[track.mentalState];

  useEffect(() => {
    setActiveCategory(selectedTrack.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const binaural = binauralRef.current!;
        const music = musicRef.current!;

        await binaural.init();
        binaural.setBinauralBeat(beatHz, 200);
        binaural.setBinauralVolume(binauralVol);
        binaural.setAmbientVolume(0);
        binaural.play();

        await music.init(track.mentalState);
        music.setVolume(musicVol);
        music.play();

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

  const handleBinauralVol = (v: number) => { setBinauralVol(v); binauralRef.current?.setBinauralVolume(v); };
  const handleMusicVol    = (v: number) => { setMusicVol(v);    musicRef.current?.setVolume(v); };
  const handleNatureVol   = (v: number) => { setNatureVol(v);   binauralRef.current?.setAmbientVolume(v); };
  const handleBeatHz      = (v: number) => { setBeatHz(v);      binauralRef.current?.rampBeat(v, 3); };

  const handleSelectSound = async (id: string) => {
    setSelectedId(id);
    const sound = SOUNDSCAPE_LIBRARY.find((s) => s.id === id);
    if (ready && sound) await binauralRef.current?.setAmbient(sound.url);
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
          <p className="text-sm font-medium text-white/80 truncate">{musicProfile.description.split(',')[0]}</p>
          <p className="text-xs text-white/35 mt-0.5">
            {beatHz.toFixed(1)} Hz · {selectedTrack.emoji} {selectedTrack.label}
          </p>
        </div>
      </div>

      {/* Mixer sliders */}
      <div className="space-y-3.5">
        <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em]">Mixer</p>

        {[
          { label: '🧠 Binaural Beat', suffix: `${beatHz.toFixed(1)} Hz`, value: beatHz, min: 0.5, max: 40, step: 0.5, onChange: handleBeatHz, isHz: true },
          { label: '〰️ Binaural Tone', suffix: `${Math.round(binauralVol * 100)}%`, value: binauralVol, min: 0, max: 1, step: 0.01, onChange: handleBinauralVol },
          { label: '🎹 Ambient Music',  suffix: `${Math.round(musicVol * 100)}%`,    value: musicVol,    min: 0, max: 1, step: 0.01, onChange: handleMusicVol },
          { label: '🌿 Nature Sounds', suffix: `${Math.round(natureVol * 100)}%`,    value: natureVol,   min: 0, max: 1, step: 0.01, onChange: handleNatureVol },
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

        {/* Beat Hz labels */}
        <div className="flex justify-between text-[9px] text-white/20 -mt-1">
          <span>δ Delta</span><span>θ Theta</span><span>α Alpha</span><span>β Beta</span><span>γ Gamma</span>
        </div>
      </div>

      {/* Soundscape picker */}
      <div className="space-y-2.5">
        <p className="text-[10px] font-medium text-white/25 uppercase tracking-[0.15em]">Soundscape</p>

        {/* Category tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
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
              {CATEGORY_LABELS[cat]}
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
        <p className="text-[9px] text-white/18">{selectedTrack.source}</p>
      </div>

      {!ready && (
        <p className="text-center text-[11px] text-white/25">
          🎧 Headphones recommended for binaural effect
        </p>
      )}
    </div>
  );
}
