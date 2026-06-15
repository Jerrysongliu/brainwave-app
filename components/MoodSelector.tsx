'use client';

import { MENTAL_STATE_META } from '@/lib/brainwave-science';
import type { MentalState } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  selected: MentalState | null;
  onSelect: (state: MentalState) => void;
}

const STATE_GLOW: Record<MentalState, string> = {
  focus:            'hover:shadow-indigo-500/20 hover:border-indigo-500/30',
  learning:         'hover:shadow-violet-500/20 hover:border-violet-500/30',
  relaxation:       'hover:shadow-emerald-500/20 hover:border-emerald-500/30',
  sleep:            'hover:shadow-blue-800/30 hover:border-blue-700/30',
  'mood-boost':     'hover:shadow-amber-500/20 hover:border-amber-500/30',
  meditation:       'hover:shadow-pink-500/20 hover:border-pink-500/30',
  'anxiety-relief': 'hover:shadow-cyan-500/20 hover:border-cyan-500/30',
};

const STATE_SELECTED: Record<MentalState, string> = {
  focus:            'bg-indigo-500/12 border-indigo-400/40 shadow-indigo-500/20',
  learning:         'bg-violet-500/12 border-violet-400/40 shadow-violet-500/20',
  relaxation:       'bg-emerald-500/12 border-emerald-400/40 shadow-emerald-500/20',
  sleep:            'bg-blue-900/25 border-blue-600/40 shadow-blue-800/20',
  'mood-boost':     'bg-amber-500/12 border-amber-400/40 shadow-amber-500/20',
  meditation:       'bg-pink-500/12 border-pink-400/40 shadow-pink-500/20',
  'anxiety-relief': 'bg-cyan-500/12 border-cyan-400/40 shadow-cyan-500/20',
};

const STATE_ICON: Record<MentalState, string> = {
  focus:            'bg-indigo-500/15',
  learning:         'bg-violet-500/15',
  relaxation:       'bg-emerald-500/15',
  sleep:            'bg-blue-900/30',
  'mood-boost':     'bg-amber-500/15',
  meditation:       'bg-pink-500/15',
  'anxiety-relief': 'bg-cyan-500/15',
};

export function MoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {(Object.entries(MENTAL_STATE_META) as [MentalState, typeof MENTAL_STATE_META[MentalState]][]).map(
        ([state, meta]) => {
          const isSelected = selected === state;
          return (
            <button
              key={state}
              onClick={() => onSelect(state)}
              className={cn(
                'group relative flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all duration-200 text-left hover:shadow-lg',
                isSelected
                  ? `${STATE_SELECTED[state]} shadow-lg`
                  : `bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] ${STATE_GLOW[state]}`
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                isSelected ? STATE_ICON[state] : 'bg-white/5'
              )}>
                {meta.emoji}
              </div>

              <div>
                <div className={cn(
                  'font-semibold text-sm',
                  isSelected ? 'text-white' : 'text-white/65 group-hover:text-white/85'
                )}>
                  {meta.label}
                </div>
                <div className={cn(
                  'text-[11px] mt-0.5 leading-snug',
                  isSelected ? 'text-white/55' : 'text-white/28 group-hover:text-white/40'
                )}>
                  {meta.description}
                </div>
              </div>

              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-white/15 flex items-center justify-center text-[9px] text-white/80">
                  ✓
                </div>
              )}
            </button>
          );
        }
      )}
    </div>
  );
}
