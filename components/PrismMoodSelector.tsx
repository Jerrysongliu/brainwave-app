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
 * Iridescence — an airy, minimal state list: a small prism dot, the emoji, and
 * a light, spacious label. The selected row glows with the iridescent gradient.
 */
export function PrismMoodSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-1">
      {ALL.map((state) => {
        const meta = MENTAL_STATE_META[state];
        const on = selected === state;
        return (
          <button
            key={state}
            onClick={() => onSelect(state)}
            className="group w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all"
            style={on ? { background: 'var(--accent-soft)', boxShadow: '0 0 24px var(--accent-glow)' } : {}}
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
              style={{ background: 'var(--accent-grad)', opacity: on ? 1 : 0.4, boxShadow: on ? '0 0 12px var(--accent-glow)' : 'none' }}
            />
            <span className="text-xl leading-none">{meta.emoji}</span>
            <span
              className={cn(
                'text-lg tracking-wide transition-colors',
                on ? 'font-medium text-white/95' : 'font-light text-white/55 group-hover:text-white/80'
              )}
            >
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
