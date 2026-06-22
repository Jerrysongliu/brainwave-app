'use client';

import { useRef } from 'react';

interface Props {
  label: string;
  display: string;
  value: number;               // 0–1
  onChange: (v: number) => void;
}

const BARS = 13;

/**
 * Holographic "Frequency Matrix" control — a neon EQ card. Drag left/right (or
 * tap) to set the value; lit bars show the level, glowing in the accent.
 */
export function FrequencyCard({ label, display, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const set = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onChange(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };
  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    set(e);
  };
  const move = (e: React.PointerEvent) => { if (dragging.current) set(e); };
  const up = () => { dragging.current = false; };

  const v = Math.max(0, Math.min(1, value));

  return (
    <div
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="glass rounded-2xl p-3 flex flex-col gap-2 touch-none cursor-ew-resize select-none"
    >
      <div className="text-[9px] uppercase tracking-wider text-white/50 leading-tight">{label}</div>
      <div className="text-[15px] font-semibold text-white/90 font-mono">{display}</div>
      <div className="flex items-end gap-[2px] h-8">
        {Array.from({ length: BARS }).map((_, i) => {
          const lit = i / BARS < v;
          const h = 28 + Math.abs(Math.sin(i * 1.3 + 0.5)) * (lit ? 70 : 22);
          return (
            <div
              key={i}
              className="flex-1 rounded-[2px]"
              style={{
                height: `${h}%`,
                background: lit ? 'var(--accent)' : 'var(--track)',
                boxShadow: lit ? '0 0 5px var(--accent-glow)' : 'none',
                opacity: lit ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
