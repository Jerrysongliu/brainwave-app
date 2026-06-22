'use client';

import { useEffect, useRef } from 'react';

interface Props {
  isPlaying: boolean;
  size?: number;
}

const COLORS = [[165, 243, 252], [196, 181, 253], [251, 207, 232], [187, 247, 208]];

/**
 * Iridescence player visual — a pearlescent orb: a luminous sphere with soft
 * pastel iridescent bands drifting inside and a specular highlight, like a soap
 * bubble or pearl. Slowly shifts; calmer when paused.
 */
export function IridescentOrb({ isPlaying, size = 220 }: Props) {
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

    const draw = (t: number) => {
      const cx = size / 2, cy = size / 2, R = size * 0.42;
      const speed = playing.current ? 1 : 0.3;
      const tt = t * 0.0004 * speed;
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.clip();

      // luminous base
      const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      base.addColorStop(0, 'rgba(255,255,255,0.85)');
      base.addColorStop(1, 'rgba(220,222,255,0.22)');
      ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);

      // drifting iridescent bands
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < COLORS.length; i++) {
        const col = COLORS[i], ph = i * 1.6;
        const bx = cx + Math.cos(tt + ph) * R * 0.5;
        const by = cy + Math.sin(tt * 1.2 + ph) * R * 0.5;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, R * 0.9);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.55)`);
        g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
      }
      ctx.globalCompositeOperation = 'source-over';

      // specular highlight
      const hx = cx - R * 0.32, hy = cy - R * 0.4;
      const hl = ctx.createRadialGradient(hx, hy, 0, hx, hy, R * 0.55);
      hl.addColorStop(0, 'rgba(255,255,255,0.85)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hl; ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // rim
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.28); ctx.stroke();

      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf.current);
  }, [size]);

  return <canvas ref={ref} style={{ width: size, height: size }} className="rounded-full" />;
}
