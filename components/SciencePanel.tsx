'use client';

import { useState } from 'react';
import type { GeneratedTrack } from '@/types';

interface Props {
  track: GeneratedTrack;
}

export function SciencePanel({ track }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/4 transition-colors"
      >
        <span className="text-sm text-white/50 font-medium">The science behind this session</span>
        <span className="text-white/25 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 fade-up">
          <p className="text-sm text-white/60 leading-relaxed">{track.scienceExplainer}</p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: 'Frequency', value: `${track.profile.hz} Hz` },
              { label: 'Brainwave', value: track.profile.wavetype.split('(')[0].trim() },
              { label: 'Tempo',     value: `${track.profile.bpm} BPM` },
              { label: 'Key',       value: track.profile.musicalKey },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/4 rounded-xl px-3 py-2.5 border border-white/5">
                <div className="text-white/30 uppercase tracking-wider text-[9px] mb-1">{label}</div>
                <div className="text-white/75 font-medium">{value}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-white/35 bg-white/3 rounded-xl px-4 py-3 leading-relaxed border border-white/5">
            {track.profile.scienceNote}
          </div>

          <div className="text-[11px] text-white/25 leading-relaxed">
            Audio generated live via Web Audio API. Left ear receives a carrier tone; right ear receives carrier + {track.profile.hz} Hz offset. Brain entrains to the difference.
          </div>
        </div>
      )}
    </div>
  );
}
