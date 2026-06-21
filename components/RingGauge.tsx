'use client';

import { useRef } from 'react';

interface Props {
  label: string;
  display: string;
  value: number;               // 0–1 for the arc fill
  onChange: (v: number) => void;
}

/**
 * Nebula Wave mixer control — a circular gauge. Drag up/down to adjust.
 * Shows a 270° accent arc with the value in the centre.
 */
export function RingGauge({ label, display, value, onChange }: Props) {
  const dragging = useRef(false);
  const lastY = useRef(0);

  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    lastY.current = e.clientY;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy = e.clientY - lastY.current;
    lastY.current = e.clientY;
    onChange(Math.max(0, Math.min(1, value - dy * 0.006)));
  };
  const up = () => { dragging.current = false; };

  const r = 34;
  const c = 2 * Math.PI * r;
  const arc = 0.75;            // 270° sweep
  const dash = c * arc;
  const offset = dash * (1 - Math.max(0, Math.min(1, value)));

  return (
    <div
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="flex flex-col items-center gap-1.5 touch-none select-none cursor-ns-resize"
    >
      <div className="relative" style={{ width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(135deg)' }}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--track)" strokeWidth="5"
            strokeDasharray={`${dash} ${c}`} strokeLinecap="round" />
          <circle cx="44" cy="44" r={r} fill="none" stroke="var(--accent)" strokeWidth="5"
            strokeDasharray={`${dash} ${c}`} strokeDashoffset={offset} strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))', transition: 'stroke-dashoffset 0.1s' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-white/90">{display}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-white/50 text-center leading-tight">{label}</span>
    </div>
  );
}
