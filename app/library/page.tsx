'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedTrack } from '@/types';
import { MENTAL_STATE_META } from '@/lib/brainwave-science';

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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
        <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center text-2xl">
          ◎
        </div>
        <div className="text-center space-y-1">
          <p className="text-white/50 font-medium">Your library is empty</p>
          <p className="text-white/25 text-sm">Sessions you save will appear here</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 rounded-xl glass text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Start a session →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white/80">Library</h1>
        <span className="text-sm text-white/25">{tracks.length} session{tracks.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-2">
        {tracks.map((track) => {
          const meta = MENTAL_STATE_META[track.mentalState];
          return (
            <div
              key={track.id}
              className="flex items-center gap-4 glass hover:bg-white/7 rounded-2xl px-4 py-3.5 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/8 flex items-center justify-center text-lg flex-shrink-0">
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white/80 truncate">{track.title}</div>
                <div className="text-xs text-white/30 mt-0.5">
                  {meta.label} · {track.duration} min · {track.profile.hz} Hz
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => loadTrack(track)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all"
                >
                  ▶
                </button>
                <button
                  onClick={() => deleteTrack(track.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/8 hover:bg-red-500/18 text-red-400/60 hover:text-red-400 transition-all"
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
