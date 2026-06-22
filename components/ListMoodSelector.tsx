'use client';

import { MENTAL_STATE_META } from '@/lib/brainwave-science';
import type { MentalState } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  selected: MentalState | null;
  onSelect: (state: MentalState) => void;
}

const ALL = Object.keys(MENTAL_STATE_META) as MentalState[];

/**
 * Holographic — a vertical list of states: icon · label · sub-label · chevron,
 * the selected row glowing in the accent.
 */
export function ListMoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-2.5">
      {ALL.map((state) => {
        const meta = MENTAL_STATE_META[state];
        const on = selected === state;
        return (
          <button
            key={state}
            onClick={() => onSelect(state)}
            className={cn(
              'w-full flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99]',
              on ? 'chip-on' : 'glass hover:bg-white/[0.06]'
            )}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={on
                ? { background: 'var(--accent-soft)', boxShadow: '0 0 18px var(--accent-glow)' }
                : { background: 'rgba(255,255,255,0.05)' }}
            >
              {meta.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] text-white/90">{meta.label}</div>
              <div className="text-xs text-white/50 truncate">{meta.description}</div>
            </div>
            <span className="text-lg flex-shrink-0" style={{ color: on ? 'var(--accent)' : 'rgba(255,255,255,0.3)' }}>›</span>
          </button>
        );
      })}
    </div>
  );
}
