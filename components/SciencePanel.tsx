'use client';

import { useState } from 'react';
import type { GeneratedTrack } from '@/types';

interface Props {
  track: GeneratedTrack;
}

export function SciencePanel({ track }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass rounded-[28px] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-colors"
      >
        <span className="text-base text-white/80 font-semibold">The science behind this session</span>
        <span className="text-white/45 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-5 fade-up">
          <p className="text-[15px] text-white/75 leading-relaxed">{track.scienceExplainer}</p>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Frequency', value: `${track.profile.hz} Hz` },
              { label: 'Brainwave', value: track.profile.wavetype.split('(')[0].trim() },
              { label: 'Tempo',     value: `${track.profile.bpm} BPM` },
              { label: 'Key',       value: track.profile.musicalKey },
            ].map(({ label, value }) => (
              <div key={label} className="glass-2 rounded-2xl px-4 py-3">
                <div className="text-white/55 uppercase tracking-wider text-[11px] mb-1 font-medium">{label}</div>
                <div className="text-white/90 font-semibold text-[15px]">{value}</div>
              </div>
            ))}
          </div>

          <div className="text-sm text-white/65 glass-2 rounded-2xl px-4 py-3.5 leading-relaxed">
            {track.profile.scienceNote}
          </div>

          <div className="text-[13px] text-white/45 leading-relaxed">
            Audio generated live via Web Audio API. Left ear receives a carrier tone; right ear receives carrier + {track.profile.hz} Hz offset. Brain entrains to the difference.
          </div>
        </div>
      )}
    </div>
  );
}
