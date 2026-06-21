'use client';

import { useRef } from 'react';

interface Props {
  label: string;
  display: string;
  value: number;               // 0–1
  onChange: (v: number) => void;
}

const SIZE = 96, C = 48, R = 36, KNOB = 8;
const A0 = 135, SWEEP = 270;   // 270° arc, gap centred at the bottom

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const pt = (deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  return [C + R * Math.cos(r), C + R * Math.sin(r)];
};
const arc = (from: number, to: number) => {
  const [x0, y0] = pt(from);
  const [x1, y1] = pt(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1}`;
};

/**
 * Nebula Wave mixer control — a circular slider. Drag the knob around the ring
 * (or tap anywhere on the arc) to set the value.
 */
export function RingGauge({ label, display, value, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const v = clamp(value);
  const valDeg = A0 + v * SWEEP;
  const [kx, ky] = pt(valDeg);

  const fromPointer = (e: React.PointerEvent) => {
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const px = (e.clientX - rect.left) * scale;
    const py = (e.clientY - rect.top) * scale;
    let deg = (Math.atan2(py - C, px - C) * 180) / Math.PI; // -180..180
    let rel = (deg - A0 + 360) % 360;                        // 0 at arc start
    let nv: number;
    if (rel <= SWEEP) nv = rel / SWEEP;
    else nv = rel < SWEEP + (360 - SWEEP) / 2 ? 1 : 0;       // snap inside the gap
    onChange(clamp(nv));
  };

  const down = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    fromPointer(e);
  };
  const move = (e: React.PointerEvent) => { if (dragging.current) fromPointer(e); };
  const up = () => { dragging.current = false; };

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div
        ref={boxRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="relative touch-none cursor-pointer"
        style={{ width: 88, height: 88 }}
      >
        <svg width="88" height="88" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
          {/* track */}
          <path d={arc(A0, A0 + SWEEP)} fill="none" stroke="var(--track)" strokeWidth="5.5" strokeLinecap="round" />
          {/* value */}
          {v > 0.002 && (
            <path d={arc(A0, valDeg)} fill="none" stroke="var(--accent)" strokeWidth="5.5" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 5px var(--accent-glow))' }} />
          )}
          {/* knob */}
          <circle cx={kx} cy={ky} r={KNOB} fill="#fff"
            stroke="var(--accent)" strokeWidth="2.5"
            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.35))' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-semibold text-white/90">{display}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-white/50 text-center leading-tight">{label}</span>
    </div>
  );
}
