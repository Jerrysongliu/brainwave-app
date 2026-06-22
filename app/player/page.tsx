'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedTrack } from '@/types';
import { AudioPlayer, type AudioPlayerHandle } from '@/components/AudioPlayer';
import { NeuralOrb } from '@/components/NeuralOrb';
import { HoloVisualizer } from '@/components/HoloVisualizer';
import { IridescentOrb } from '@/components/IridescentOrb';
import { SciencePanel } from '@/components/SciencePanel';
import { SoundscapeBackground } from '@/components/SoundscapeBackground';
import { type NoiseSoundscape } from '@/lib/noise-engine';
import { useThemePalette } from '@/lib/use-theme';
import { MENTAL_STATE_META } from '@/lib/brainwave-science';

const STATE_BG: Record<string, string> = {
  focus:            'from-indigo-950/60 via-transparent',
  learning:         'from-violet-950/60 via-transparent',
  relaxation:       'from-emerald-950/50 via-transparent',
  sleep:            'from-blue-950/70 via-transparent',
  'mood-boost':     'from-amber-950/50 via-transparent',
  meditation:       'from-pink-950/50 via-transparent',
  'anxiety-relief': 'from-cyan-950/50 via-transparent',
};

const STATE_GLOW: Record<string, string> = {
  focus:            'bg-indigo-500/10',
  learning:         'bg-violet-500/10',
  relaxation:       'bg-emerald-500/10',
  sleep:            'bg-blue-700/15',
  'mood-boost':     'bg-amber-500/10',
  meditation:       'bg-pink-500/10',
  'anxiety-relief': 'bg-cyan-500/10',
};

function useTimer(isPlaying: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return fmt(elapsed);
}

export default function PlayerPage() {
  const router = useRouter();
  const [track, setTrack] = useState<GeneratedTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [currentSound, setCurrentSound] = useState<NoiseSoundscape>('rain');
  const palette = useThemePalette();
  const playerRef = useRef<AudioPlayerHandle | null>(null);
  const elapsed = useTimer(isPlaying);

  useEffect(() => {
    const raw = sessionStorage.getItem('brainwave_track');
    if (!raw) { router.push('/'); return; }
    setTrack(JSON.parse(raw));
  }, [router]);

  const handleSave = useCallback(() => {
    if (!track) return;
    const existing = JSON.parse(localStorage.getItem('brainwave_library') ?? '[]');
    const updated = [track, ...existing.filter((t: GeneratedTrack) => t.id !== track.id)];
    localStorage.setItem('brainwave_library', JSON.stringify(updated));
    setSaved(true);
  }, [track]);

  if (!track) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  const meta = MENTAL_STATE_META[track.mentalState];

  return (
    <div className="relative min-h-screen flex flex-col items-center">
      {/* Animated soundscape scene — matches the selected sound, tinted by mood */}
      <SoundscapeBackground
        soundscape={currentSound}
        mentalState={track.mentalState}
        active={isPlaying}
      />

      {/* Per-state background aura */}
      <div className="pointer-events-none fixed inset-0">
        <div className={`absolute inset-0 bg-gradient-to-b ${STATE_BG[track.mentalState]}`} />
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] ${STATE_GLOW[track.mentalState]}`} />
      </div>

      {/* Back button */}
      <div className="relative w-full max-w-2xl px-5 pt-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white/90 transition-colors"
        >
          ← New session
        </button>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-2xl px-5 pb-12 flex flex-col items-center gap-8">

        {/* Neural orb + track info (orb hidden for Nebula — the galaxy is the visual) */}
        <div className="flex flex-col items-center gap-5 pt-4">
          {palette === 'nebula'
            ? (
              <button
                onClick={() => playerRef.current?.toggle()}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="nebula-halo relative flex items-center justify-center rounded-full active:scale-95 transition-transform"
                style={{ width: 224, height: 224, border: '1px solid var(--accent-border)', background: 'rgba(255,255,255,0.03)' }}
              >
                <span className="text-5xl" style={{ color: 'var(--text)' }}>{isPlaying ? '⏸' : '▶'}</span>
              </button>
            )
            : palette === 'holographic'
            ? <HoloVisualizer isPlaying={isPlaying} size={220} />
            : palette === 'iridescence'
            ? <IridescentOrb isPlaying={isPlaying} size={220} />
            : <NeuralOrb mentalState={track.mentalState} isPlaying={isPlaying} size={220} />}

          <div className="text-center space-y-2">
            <p className="text-xs text-white/55 tracking-[0.2em] uppercase font-medium">{meta.label}</p>
            <h1 className="text-3xl font-bold text-white">{track.title}</h1>
            <p className="text-[15px] text-white/55">{track.duration} min · {track.intensity}</p>
            <div className="pt-1.5">
              <span className="font-mono text-3xl font-light accent-text tabular-nums tracking-wider">
                {elapsed}
              </span>
            </div>
          </div>
        </div>

        {/* Single persistent AudioPlayer — always mounted to keep audio engines alive.
            compact=true hides mixer/soundscape UI while keeping play button visible. */}
        <div className="w-full space-y-3">
          {/* AudioPlayer is always rendered — toggling compact never unmounts engines */}
          <AudioPlayer
            ref={playerRef}
            track={track}
            onPlayingChange={setIsPlaying}
            onSoundscapeChange={setCurrentSound}
            compact={!showMixer}
          />

          {/* Expand/collapse toggle below the player */}
          <button
            onClick={() => setShowMixer((v) => !v)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 glass rounded-[20px] text-sm text-white/65 hover:text-white/90 transition-colors active:scale-[0.99]"
          >
            <span className="text-base">🎚️</span>
            <span className="font-medium">{showMixer ? 'Hide mixer & soundscape' : 'Show mixer & soundscape'}</span>
            <span className="text-white/40">{showMixer ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Science panel */}
        <div className="w-full">
          <SciencePanel track={track} />
        </div>

        {/* Actions */}
        <div className="w-full flex gap-3">
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex-1 py-4 rounded-[20px] glass text-[15px] font-semibold hover:bg-white/10 disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            {saved ? '✓ Saved' : '+ Save'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-4 rounded-[20px] glass text-[15px] font-semibold hover:bg-white/10 transition-all active:scale-[0.98]"
          >
            ↺ New session
          </button>
        </div>
      </div>
    </div>
  );
}
