'use client';

import { useEffect, useRef } from 'react';
import type { MentalState } from '@/types';
import { FREQUENCY_PROFILES } from '@/lib/brainwave-science';

interface Props {
  mentalState: MentalState;
  isPlaying: boolean;
  size?: number;
}

const STATE_COLORS: Record<MentalState, [string, string, string]> = {
  focus:            ['#6366f1', '#818cf8', '#4f46e5'],
  learning:         ['#8b5cf6', '#a78bfa', '#7c3aed'],
  relaxation:       ['#10b981', '#34d399', '#059669'],
  sleep:            ['#1e40af', '#3b82f6', '#1e3a8a'],
  'mood-boost':     ['#f59e0b', '#fcd34d', '#d97706'],
  meditation:       ['#ec4899', '#f472b6', '#db2777'],
  'anxiety-relief': ['#06b6d4', '#67e8f9', '#0891b2'],
};

export function NeuralOrb({ mentalState, isPlaying, size = 280 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());
  const profile = FREQUENCY_PROFILES[mentalState];
  const colors = STATE_COLORS[mentalState];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.28;

    const draw = (now: number) => {
      const t = (now - startRef.current) / 1000;
      ctx.clearRect(0, 0, size, size);

      const speed = isPlaying ? 1 : 0.2;
      const amplitude = isPlaying ? 0.18 : 0.04;

      // ── Outer glow rings ──────────────────────────────────────────
      for (let ring = 3; ring >= 1; ring--) {
        const r = baseRadius * (1 + ring * 0.22) + Math.sin(t * speed * 0.7 + ring) * 6;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, colors[0] + '00');
        grad.addColorStop(0.6, colors[0] + Math.round(12 / ring).toString(16).padStart(2, '0'));
        grad.addColorStop(1, colors[0] + '00');
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Organic blob shape ────────────────────────────────────────
      const points = 64;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noiseFreq = profile.hz / 10;
        const noise =
          Math.sin(angle * 3 + t * speed * 0.8) * amplitude * 0.5 +
          Math.sin(angle * 5 - t * speed * 0.6 + 1) * amplitude * 0.3 +
          Math.sin(angle * 7 + t * speed * 1.1 + 2) * amplitude * 0.2 +
          Math.sin(angle * noiseFreq + t * speed * 0.4) * amplitude * 0.15;
        const r = baseRadius * (1 + noise);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy * 0.85, 0, cx, cy, baseRadius * 1.1);
      grad.addColorStop(0, colors[1] + 'ff');
      grad.addColorStop(0.5, colors[0] + 'dd');
      grad.addColorStop(1, colors[2] + 'aa');
      ctx.fillStyle = grad;
      ctx.fill();

      // ── Inner bright core ─────────────────────────────────────────
      const coreR = baseRadius * (0.35 + Math.sin(t * speed * 1.5) * 0.05);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
      coreGrad.addColorStop(0.4, colors[1] + '88');
      coreGrad.addColorStop(1, colors[0] + '00');
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // ── Orbiting particles (only when playing) ────────────────────
      if (isPlaying) {
        const particleCount = 5;
        for (let i = 0; i < particleCount; i++) {
          const orbitAngle = (i / particleCount) * Math.PI * 2 + t * speed * 0.5;
          const orbitR = baseRadius * (1.15 + Math.sin(t * 0.7 + i) * 0.08);
          const px = cx + Math.cos(orbitAngle) * orbitR;
          const py = cy + Math.sin(orbitAngle) * orbitR;
          const pr = 2.5 + Math.sin(t * 2 + i * 1.3) * 1;
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fillStyle = colors[1] + 'cc';
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mentalState, isPlaying, size, colors, profile.hz]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  );
}
