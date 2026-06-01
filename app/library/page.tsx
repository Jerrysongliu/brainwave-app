'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedTrack } from '@/types';
import { MENTAL_STATE_META } from '@/lib/brainwave-science';
import { cn } from '@/lib/utils';

export default function LibraryPage() {
  const router = useRouter();
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem('brainwave_library');
    if (raw) setTracks(JSON.parse(raw));
  }, []);

  const loadTrack = (track: GeneratedTrack) => {
    sessionStorage.setItem('brainwave_track', JSON.stringify(track));
    router.push('/player');
  };

  const deleteTrack = (id: string) => {
    const updated = tracks.filter((t) => t.id !== id);
    setTracks(updated);
    localStorage.setItem('brainwave_library', JSON.stringify(updated));
  };

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-white/40">
        <span className="text-5xl">📭</span>
        <p className="text-lg">Your library is empty</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Generate your first session →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Library</h1>
      <div className="space-y-3">
        {tracks.map((track) => {
          const meta = MENTAL_STATE_META[track.mentalState];
          return (
            <div
              key={track.id}
              className="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl px-5 py-4 transition-colors group"
            >
              <div className={cn('text-3xl w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', meta.color)}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{track.title}</div>
                <div className="text-xs text-white/40 mt-0.5">
                  {meta.label} · {track.duration} min · {track.intensity} · {track.profile.hz} Hz
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => loadTrack(track)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  ▶ Play
                </button>
                <button
                  onClick={() => deleteTrack(track.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
