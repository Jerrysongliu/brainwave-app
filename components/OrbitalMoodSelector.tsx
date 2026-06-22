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
 * Nebula Wave — an orbital "constellation" state selector. The chosen state sits
 * glowing at the centre; the rest orbit around it, connected by faint lines.
 */
export function OrbitalMoodSelector({ selected, onSelect }: Props) {
  const center = selected;
  const ring = center ? ALL.filter((s) => s !== center) : ALL;
  const R = 38; // orbit radius in % of the box

  // positions for ring nodes (start at top, go clockwise)
  const pos = ring.map((_, i) => {
    const a = (-90 + (360 / ring.length) * i) * (Math.PI / 180);
    return { x: 50 + R * Math.cos(a), y: 50 + R * Math.sin(a) };
  });

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 360, aspectRatio: '1 / 1' }}>
      {/* constellation lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {pos.map((p, i) => (
          <line
            key={i}
            x1={50} y1={50} x2={p.x} y2={p.y}
            stroke="var(--accent-border)" strokeWidth={0.25} opacity={0.5}
          />
        ))}
      </svg>

      {/* centre node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {center ? (
          <button
            onClick={() => onSelect(center)}
            className="nebula-halo flex flex-col items-center justify-center rounded-full transition-all"
            style={{
              width: 138, height: 138,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <span className="text-3xl leading-none">{MENTAL_STATE_META[center].emoji}</span>
            <span className="mt-1.5 text-[15px] font-semibold text-white/90">{MENTAL_STATE_META[center].label}</span>
          </button>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-full"
            style={{ width: 132, height: 132, border: '1px dashed var(--accent-border)' }}
          >
            <span className="text-2xl leading-none">✦</span>
            <span className="mt-1 text-[11px] text-white/55 px-4 text-center">Pick a state</span>
          </div>
        )}
      </div>

      {/* orbit nodes */}
      {ring.map((state, i) => {
        const p = pos[i];
        const meta = MENTAL_STATE_META[state];
        return (
          <button
            key={state}
            onClick={() => onSelect(state)}
            className={cn(
              'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-full transition-all active:scale-95',
              'bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30'
            )}
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: 78, height: 78 }}
            title={meta.label}
          >
            <span className="text-xl leading-none">{meta.emoji}</span>
            <span className="mt-0.5 text-[10px] font-medium text-white/70 px-1 text-center leading-tight">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}
