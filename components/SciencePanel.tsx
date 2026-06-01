'use client';

import { useState } from 'react';
import type { GeneratedTrack } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  track: GeneratedTrack;
}

export function SciencePanel({ track }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-white hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-sm">🔬 Why does this music work?</span>
        <span className="text-white/40 text-lg">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          <p className="text-sm text-white/70 leading-relaxed">{track.scienceExplainer}</p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              { label: 'Frequency', value: `${track.profile.hz} Hz` },
              { label: 'Wave Type', value: track.profile.wavetype },
              { label: 'Tempo', value: `${track.profile.bpm} BPM` },
              { label: 'Key', value: track.profile.musicalKey },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl px-3 py-2">
                <div className="text-white/40 uppercase tracking-wide text-[10px]">{label}</div>
                <div className="text-white/90 font-medium mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-white/40 bg-white/5 rounded-xl px-3 py-2 leading-relaxed">
            📖 {track.profile.scienceNote}
          </div>

          <div className="text-xs text-white/30 bg-white/5 rounded-xl px-3 py-2">
            <span className="font-medium text-white/40">🎧 How it works:</span>
            <p className="mt-1 leading-relaxed">
              Binaural beats are generated live in your browser using the Web Audio API — no downloads, no external service.
              Your left ear hears a carrier tone, your right ear hears the same tone plus the target frequency offset.
              Your brain perceives the difference as a rhythmic pulse that entrains to {track.profile.hz} Hz.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
