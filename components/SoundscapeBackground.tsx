'use client';

/**
 * SoundscapeBackground — full-screen animated Canvas behind the player.
 *
 * The visual matches the SELECTED soundscape (rain streaks, fire embers, ocean
 * waves, drifting forest motes, night stars …) and is color-tinted by the
 * MENTAL STATE (a soft mood wash). Drawn additively ('lighter') so it glows on
 * dark and stays subtle on light — no theme takeover. Respects reduced motion.
 */

import { useEffect, useRef } from 'react';
import type { MentalState } from '@/types';
import type { NoiseSoundscape } from '@/lib/noise-engine';

type VisualType = 'rain' | 'waves' | 'fire' | 'motes' | 'stars';

const SCENE: Record<NoiseSoundscape, { type: VisualType; color: string; storm?: boolean; big?: boolean; fast?: boolean }> = {
  rain:   { type: 'rain',  color: '#9fb8d8' },
  storm:  { type: 'rain',  color: '#b4c0d2', storm: true },
  ocean:  { type: 'waves', color: '#4f9fc4', big: true },
  river:  { type: 'waves', color: '#79c6d6', fast: true },
  fire:   { type: 'fire',  color: '#ff8a3c' },
  forest: { type: 'motes', color: '#a9d488' },
  pond:   { type: 'motes', color: '#8fcab0' },
  night:  { type: 'stars', color: '#cdd6ff' },
  none:   { type: 'motes', color: '#8899aa' },
};

const MOOD_TINT: Record<MentalState, string> = {
  focus:            '#6366f1',
  learning:         '#8b5cf6',
  relaxation:       '#10b981',
  sleep:            '#1e3a8a',
  'mood-boost':     '#f59e0b',
  meditation:       '#ec4899',
  'anxiety-relief': '#06b6d4',
};

interface Props {
  soundscape: NoiseSoundscape;
  mentalState: MentalState;
  active: boolean; // playing → full motion; paused → calmer
}

interface P { x: number; y: number; v: number; s: number; a: number; t: number; }

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function SoundscapeBackground({ soundscape, mentalState, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // Refs so the animation loop always reads current props without re-subscribing
  const sceneRef = useRef(soundscape);
  const moodRef = useRef(mentalState);
  const activeRef = useRef(active);
  sceneRef.current = soundscape;
  moodRef.current = mentalState;
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    let parts: P[] = [];
    let curType: VisualType = SCENE[sceneRef.current].type;

    const build = () => {
      curType = SCENE[sceneRef.current].type;
      const storm = SCENE[sceneRef.current].storm;
      parts = [];
      const area = W * H;
      const mk = (n: number, fn: () => P) => { for (let i = 0; i < n; i++) parts.push(fn()); };
      if (curType === 'rain') {
        mk(Math.min(storm ? 240 : 150, Math.round(area / 7000)), () => ({
          x: Math.random() * W, y: Math.random() * H,
          v: (storm ? 14 : 9) + Math.random() * 7, s: 8 + Math.random() * 14,
          a: 0.12 + Math.random() * 0.22, t: 0,
        }));
      } else if (curType === 'fire') {
        mk(70, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.5, y: H + Math.random() * 60,
          v: 0.6 + Math.random() * 1.6, s: 1 + Math.random() * 2.6, a: 0.4 + Math.random() * 0.5, t: Math.random() * 6 }));
      } else if (curType === 'motes') {
        mk(Math.min(70, Math.round(area / 24000)), () => ({ x: Math.random() * W, y: Math.random() * H,
          v: 0.15 + Math.random() * 0.4, s: 1 + Math.random() * 2.4, a: 0.15 + Math.random() * 0.4, t: Math.random() * 6 }));
      } else if (curType === 'stars') {
        mk(Math.min(120, Math.round(area / 12000)), () => ({ x: Math.random() * W, y: Math.random() * H * 0.92,
          v: 0.02 + Math.random() * 0.06, s: 0.6 + Math.random() * 1.8, a: 0.2 + Math.random() * 0.6, t: Math.random() * 6.28 }));
      } else { // waves — a few horizontal bands
        const bands = SCENE[sceneRef.current].big ? 6 : 8;
        for (let i = 0; i < bands; i++) parts.push({ x: 0, y: H * (0.45 + 0.55 * (i / bands)), v: 0, s: i, a: 0.05 + 0.05 * (i / bands), t: Math.random() * 6.28 });
      }
    };

    let last = performance.now();
    let flash = 0; // lightning

    const frame = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.67); last = now;
      const scene = SCENE[sceneRef.current];
      if (scene.type !== curType) build();
      const [r, g, b] = hexRgb(scene.color);
      const motion = activeRef.current ? 1 : 0.35;
      const baseA = activeRef.current ? 1 : 0.5;

      ctx.clearRect(0, 0, W, H);

      // Mood tint wash (top-down radial) — works under any theme
      const [mr, mg, mb] = hexRgb(MOOD_TINT[moodRef.current] ?? '#6366f1');
      const grad = ctx.createRadialGradient(W / 2, -H * 0.2, 0, W / 2, -H * 0.2, H * 1.3);
      grad.addColorStop(0, `rgba(${mr},${mg},${mb},${0.16 * baseA})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';

      if (curType === 'rain') {
        if (scene.storm && Math.random() < 0.004) flash = 1;
        if (flash > 0) {
          ctx.fillStyle = `rgba(200,210,255,${0.18 * flash})`;
          ctx.fillRect(0, 0, W, H);
          flash = Math.max(0, flash - 0.06 * dt);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
        ctx.lineWidth = 1.1;
        for (const p of parts) {
          ctx.globalAlpha = p.a * baseA;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1.5, p.y + p.s);
          ctx.stroke();
          p.y += p.v * motion * dt * 2;
          p.x -= 0.4 * motion * dt;
          if (p.y > H) { p.y = -p.s; p.x = Math.random() * W; }
        }
      } else if (curType === 'fire') {
        // warm glow at the base
        const fg = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, H * 0.55);
        fg.addColorStop(0, `rgba(${r},${g},${b},${0.12 * baseA * (0.8 + Math.random() * 0.2)})`);
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
        for (const p of parts) {
          p.t += 0.05 * dt;
          ctx.globalAlpha = p.a * baseA * (0.6 + 0.4 * Math.sin(p.t));
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
          p.y -= p.v * motion * dt * 1.5;
          p.x += Math.sin(p.t) * 0.6 * motion;
          if (p.y < H * 0.35 || p.a <= 0) { p.y = H + Math.random() * 30; p.x = W / 2 + (Math.random() - 0.5) * W * 0.5; }
        }
      } else if (curType === 'motes') {
        for (const p of parts) {
          p.t += 0.02 * dt;
          ctx.globalAlpha = p.a * baseA * (0.5 + 0.5 * Math.sin(p.t));
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
          p.x += Math.sin(p.t) * 0.5 * motion * dt;
          p.y += p.v * motion * dt;
          if (p.y > H) { p.y = -4; p.x = Math.random() * W; }
        }
      } else if (curType === 'stars') {
        for (const p of parts) {
          p.t += (0.4 + p.v) * dt;
          ctx.globalAlpha = p.a * baseA * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.t)));
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
          p.x += p.v * motion * dt;
          if (p.x > W) p.x = 0;
        }
      } else { // waves
        for (const p of parts) {
          p.t += (scene.fast ? 0.03 : 0.014) * dt * motion;
          const amp = (scene.big ? 26 : 14) + p.s * 3;
          ctx.globalAlpha = p.a * baseA;
          ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let xx = 0; xx <= W; xx += 14) {
            const yy = p.y + Math.sin(xx * 0.008 + p.t + p.s) * amp;
            xx === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
          }
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      rafRef.current = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduce) {
      // Static single paint
      ctx.clearRect(0, 0, W, H);
    } else {
      rafRef.current = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: 0.9 }}
    />
  );
}
