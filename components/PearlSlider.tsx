'use client';

import { useRef } from 'react';

interface Props {
  label: string;
  display: string;
  value: number;               // 0–1
  onChange: (v: number) => void;
}

/**
 * Iridescence mixer control — a soft pastel-prism bar. Drag anywhere on the
 * track (or tap) to set the value; the fill is a cyan→lilac→pink→mint gradient
 * with a pearlescent thumb, echoing the theme's background mesh.
 */
export function PearlSlider({ label, display, value, onChange }: Props) {
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
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm text-white/70">
        <span>{label}</span>
        <span className="font-mono text-white/50">{display}</span>
      </div>
      <div
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="relative h-2.5 rounded-full touch-none cursor-pointer select-none"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${v * 100}%`,
            background: 'linear-gradient(90deg, #a5f3fc, #c4b5fd 40%, #fbcfe8 72%, #bbf7d0)',
            boxShadow: '0 0 10px rgba(196,181,253,0.5)',
          }}
        />
        <div
          className="absolute top-1/2 rounded-full"
          style={{
            left: `${v * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 20, height: 20,
            background: '#fff',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.6), 0 0 12px rgba(196,181,253,0.7), 0 1px 4px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    </div>
  );
}
