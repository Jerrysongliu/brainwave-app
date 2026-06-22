'use client';

import { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
  size?: number;
}

/**
 * Holographic player visual — a neon oscilloscope: concentric rings + a live
 * waveform across the centre, glowing in the theme accent (cyan by default).
 */
export function HoloVisualizer({ isPlaying, size = 220 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const playing = useRef(isPlaying);
  playing.current = isPlaying;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size * dpr; c.height = size * dpr;
    ctx.scale(dpr, dpr);

    const accentHex = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return /^#([0-9a-fA-F]{6})$/.test(v) ? v : '#22d3ee';
    };
    const hex = (h: string): [number, number, number] => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    const draw = (t: number) => {
      const [r, g, b] = hex(accentHex());
      const A = (a: number) => `rgba(${r},${g},${b},${a})`;
      const cx = size / 2, cy = size / 2;
      const speed = playing.current ? 1 : 0.25;
      const tt = t * 0.001 * speed;
      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'lighter';

      // concentric rings
      for (let i = 0; i < 3; i++) {
        const rad = size * 0.18 + i * size * 0.1 + Math.sin(tt + i) * 3;
        ctx.strokeStyle = A(0.12 - i * 0.03); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.28); ctx.stroke();
      }
      // outer glow ring
      ctx.strokeStyle = A(0.5); ctx.lineWidth = 2;
      ctx.shadowColor = A(1); ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cx, cy, size * 0.42, 0, 6.28); ctx.stroke();
      ctx.shadowBlur = 0;

      // centre waveform
      ctx.strokeStyle = A(0.92); ctx.lineWidth = 2.5;
      ctx.shadowColor = A(1); ctx.shadowBlur = 8;
      ctx.beginPath();
      const amp = playing.current ? size * 0.12 : size * 0.03;
      const x0 = cx - size * 0.4, x1 = cx + size * 0.4;
      for (let x = x0; x <= x1; x += 3) {
        const dx = (x - cx) / (size * 0.4);
        const env = Math.cos(dx * 1.4);
        const y = cy + (Math.sin(dx * 8 + tt * 4) * 0.6 + Math.sin(dx * 16 - tt * 6) * 0.4) * amp * env;
        x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.shadowBlur = 0;

      ctx.globalCompositeOperation = 'source-over';
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="rounded-full" />;
}
