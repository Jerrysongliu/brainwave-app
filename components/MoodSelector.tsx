'use client';

import { MENTAL_STATE_META } from '@/lib/brainwave-science';
import type { MentalState } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  selected: MentalState | null;
  onSelect: (state: MentalState) => void;
}

export function MoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {(Object.entries(MENTAL_STATE_META) as [MentalState, typeof MENTAL_STATE_META[MentalState]][]).map(
        ([state, meta]) => (
          <button
            key={state}
            onClick={() => onSelect(state)}
            className={cn(
              'relative group flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 text-left',
              selected === state
                ? `bg-gradient-to-br ${meta.color} border-transparent text-white shadow-lg scale-105`
                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10 text-white/80'
            )}
          >
            <span className="text-4xl">{meta.emoji}</span>
            <div>
              <div className="font-semibold text-sm">{meta.label}</div>
              <div
                className={cn(
                  'text-xs mt-1 leading-snug',
                  selected === state ? 'text-white/80' : 'text-white/50'
                )}
              >
                {meta.description}
              </div>
            </div>
            {selected === state && (
              <span className="absolute top-2 right-2 text-xs bg-white/20 rounded-full px-2 py-0.5">
                ✓
              </span>
            )}
          </button>
        )
      )}
    </div>
  );
}
