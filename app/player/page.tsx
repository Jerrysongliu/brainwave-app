'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedTrack } from '@/types';
import { AudioPlayer } from '@/components/AudioPlayer';
import { NeuralOrb } from '@/components/NeuralOrb';
import { SciencePanel } from '@/components/SciencePanel';
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
      {/* Per-state background aura */}
      <div className="pointer-events-none fixed inset-0">
        <div className={`absolute inset-0 bg-gradient-to-b ${STATE_BG[track.mentalState]}`} />
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] ${STATE_GLOW[track.mentalState]}`} />
      </div>

      {/* Back button */}
      <div className="relative w-full max-w-2xl px-5 pt-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-sm text-white/30 hover:text-white/70 transition-colors"
        >
          ← New session
        </button>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-2xl px-5 pb-12 flex flex-col items-center gap-8">

        {/* Neural orb + track info */}
        <div className="flex flex-col items-center gap-5 pt-4">
          <NeuralOrb mentalState={track.mentalState} isPlaying={isPlaying} size={220} />

          <div className="text-center space-y-1.5">
            <p className="text-xs text-white/30 tracking-widest uppercase">{meta.label}</p>
            <h1 className="text-2xl font-bold text-white">{track.title}</h1>
            <p className="text-sm text-white/40">{track.duration} min · {track.intensity}</p>
            <div className="pt-1">
              <span className="font-mono text-2xl font-light text-white/70 tabular-nums tracking-wider">
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
            track={track}
            onPlayingChange={setIsPlaying}
            compact={!showMixer}
          />

          {/* Expand/collapse toggle below the player */}
          <button
            onClick={() => setShowMixer((v) => !v)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 glass rounded-2xl text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            <span>🎚️</span>
            <span>{showMixer ? 'Hide mixer & soundscape' : 'Show mixer & soundscape'}</span>
            <span className="text-white/20">{showMixer ? '▲' : '▼'}</span>
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
            className="flex-1 py-3 rounded-xl glass text-sm font-medium hover:bg-white/8 disabled:opacity-40 transition-all"
          >
            {saved ? '✓ Saved' : '+ Save'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-3 rounded-xl glass text-sm font-medium hover:bg-white/8 transition-all"
          >
            ↺ New session
          </button>
        </div>
      </div>
    </div>
  );
}
