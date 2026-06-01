'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedTrack } from '@/types';
import { AudioPlayer } from '@/components/AudioPlayer';
import { FrequencyVisualizer } from '@/components/FrequencyVisualizer';
import { SciencePanel } from '@/components/SciencePanel';

export default function PlayerPage() {
  const router = useRouter();
  const [track, setTrack] = useState<GeneratedTrack | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('brainwave_track');
    if (!raw) {
      router.push('/');
      return;
    }
    setTrack(JSON.parse(raw));
  }, [router]);

  const handleSave = () => {
    if (!track) return;
    const existing = JSON.parse(localStorage.getItem('brainwave_library') ?? '[]');
    const updated = [track, ...existing.filter((t: GeneratedTrack) => t.id !== track.id)];
    localStorage.setItem('brainwave_library', JSON.stringify(updated));
    setSaved(true);
  };

  if (!track) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white/40">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <button
        onClick={() => router.push('/')}
        className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1"
      >
        ← New Session
      </button>

      <AudioPlayer track={track} onPlayingChange={setIsPlaying} />

      <FrequencyVisualizer mentalState={track.mentalState} isPlaying={isPlaying} />

      <SciencePanel track={track} />

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saved}
          className="flex-1 py-3 rounded-xl border border-white/20 text-sm font-medium hover:bg-white/5 disabled:opacity-50 transition-colors"
        >
          {saved ? '✓ Saved to Library' : '💾 Save to Library'}
        </button>
        <button
          onClick={() => router.push('/')}
          className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors"
        >
          🔄 Generate Another
        </button>
      </div>
    </div>
  );
}
