'use client';

/**
 * SoundscapeBackground — a full-screen, dreamy animated Canvas behind the player.
 *
 * Two layers, drawn additively ('lighter') for an ethereal glow that reads on
 * both light and dark themes:
 *   1. AURORA — a few huge, slowly-drifting soft radial gradients (nebula wash)
 *      colored by the scene + mood, gently "breathing" over ~30s.
 *   2. PARTICLES — the scene's signature motion (rain, waves, embers, motes,
 *      stars) rendered with bloom (shadowBlur) and slow, graceful movement.
 *
 * Matches the SELECTED soundscape, tinted by the MENTAL STATE. Eases down when
 * paused; respects prefers-reduced-motion; mobile-tuned (DPR capped, modest counts).
 */

import { useEffect, useRef } from 'react';
import type { MentalState } from '@/types';
import type { NoiseSoundscape } from '@/lib/noise-engine';

type VisualType = 'rain' | 'waves' | 'fire' | 'motes' | 'stars';

const SCENE: Record<NoiseSoundscape, { type: VisualType; color: string; color2: string; storm?: boolean; big?: boolean; fast?: boolean }> = {
  rain:   { type: 'rain',  color: '#a8c4e8', color2: '#6d8fc4' },
  storm:  { type: 'rain',  color: '#c2cde0', color2: '#7e6fae', storm: true },
  ocean:  { type: 'waves', color: '#54b0d6', color2: '#2f7aa8', big: true },
  river:  { type: 'waves', color: '#86d6e0', color2: '#4fb0c4', fast: true },
  fire:   { type: 'fire',  color: '#ff9a4c', color2: '#ff5a3c' },
  forest: { type: 'motes', color: '#b6e08a', color2: '#6fc48f' },
  night:  { type: 'stars', color: '#d6dcff', color2: '#8a7cc8' },
  none:   { type: 'motes', color: '#9aaabe', color2: '#7a8aa6' },
};

const MOOD_TINT: Record<MentalState, string> = {
  focus:            '#6c6cf2',
  learning:         '#9b6cf2',
  relaxation:       '#22c08a',
  sleep:            '#2a4ed0',
  'mood-boost':     '#ffb43c',
  meditation:       '#f062c0',
  'anxiety-relief': '#22b6e0',
};

interface Props {
  soundscape: NoiseSoundscape;
  mentalState: MentalState;
  active: boolean;
}

interface P { x: number; y: number; v: number; s: number; a: number; t: number; }

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function SoundscapeBackground({ soundscape, mentalState, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
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

    // Pick up the active theme accent + mode so the bg matches the theme.
    const themeAccent = { current: '#8b5cf6' };
    const themeMode = { current: 'aurora' };
    const readTheme = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      if (/^#([0-9a-fA-F]{6})$/.test(v)) themeAccent.current = v;
      themeMode.current = document.documentElement.getAttribute('data-theme') || 'aurora';
    };
    readTheme();
    const mo = new MutationObserver(readTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    // Galaxy stars (used only by the Nebula theme)
    interface Star { r: number; ang: number; size: number; b: number; }
    let stars: Star[] = [];
    const buildNebula = () => {
      stars = [];
      const N = Math.min(700, Math.round((W * H) / 3200));
      const arms = 3, twist = 3.4;
      for (let i = 0; i < N; i++) {
        const r = Math.pow(Math.random(), 0.6);
        const arm = Math.floor(Math.random() * arms);
        const ang = arm * ((2 * Math.PI) / arms) + r * twist + (Math.random() - 0.5) * 0.55;
        stars.push({ r, ang, size: 0.5 + Math.random() * 1.7, b: 0.25 + Math.random() * 0.7 });
      }
    };

    // Network nodes (used only by the Holographic theme)
    interface Node { x: number; y: number; vx: number; vy: number; }
    let nodes: Node[] = [];
    const buildHolo = () => {
      nodes = [];
      const N = Math.min(72, Math.round((W * H) / 26000));
      for (let i = 0; i < N; i++) {
        nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
      }
    };

    // Aurora blobs — large soft drifting nebula clouds
    const blobs = Array.from({ length: 4 }, (_, i) => ({
      bx: 0.2 + 0.6 * Math.random(),
      by: 0.15 + 0.7 * Math.random(),
      rad: 0.5 + 0.35 * Math.random(),
      sp: 0.00004 + Math.random() * 0.00006,
      ph: Math.random() * 6.28,
      ph2: Math.random() * 6.28,
      which: i, // 0 scene, 1 mood, 2 scene2, 3 mood-light
    }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      buildNebula();
      buildHolo();
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
        mk(Math.min(storm ? 220 : 140, Math.round(area / 7500)), () => ({
          x: Math.random() * W, y: Math.random() * H,
          v: (storm ? 11 : 7) + Math.random() * 6, s: 9 + Math.random() * 16,
          a: 0.10 + Math.random() * 0.20, t: 0,
        }));
      } else if (curType === 'fire') {
        mk(64, () => ({ x: W / 2 + (Math.random() - 0.5) * W * 0.5, y: H + Math.random() * 60,
          v: 0.5 + Math.random() * 1.3, s: 1.4 + Math.random() * 3, a: 0.4 + Math.random() * 0.5, t: Math.random() * 6 }));
      } else if (curType === 'motes') {
        mk(Math.min(64, Math.round(area / 26000)), () => ({ x: Math.random() * W, y: Math.random() * H,
          v: 0.12 + Math.random() * 0.35, s: 1.4 + Math.random() * 3, a: 0.2 + Math.random() * 0.4, t: Math.random() * 6 }));
      } else if (curType === 'stars') {
        mk(Math.min(130, Math.round(area / 11000)), () => ({ x: Math.random() * W, y: Math.random() * H * 0.95,
          v: 0.015 + Math.random() * 0.05, s: 0.7 + Math.random() * 2, a: 0.25 + Math.random() * 0.6, t: Math.random() * 6.28 }));
      } else { // waves
        const bands = SCENE[sceneRef.current].big ? 6 : 8;
        for (let i = 0; i < bands; i++) parts.push({ x: 0, y: H * (0.42 + 0.58 * (i / bands)), v: 0, s: i, a: 0.05 + 0.06 * (i / bands), t: Math.random() * 6.28 });
      }
    };

    let last = performance.now();
    let flash = 0;

    const blobColor = (which: number, scene: typeof SCENE[NoiseSoundscape], mood: string): [number, number, number] => {
      if (which === 0) return hexRgb(scene.color);
      if (which === 2) return hexRgb(scene.color2);
      if (which === 3) return hexRgb(themeAccent.current); // theme accent blends in
      return hexRgb(mood);
    };

    const lerp3 = (a: number[], b: number[], t: number) =>
      [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

    // Nebula Wave theme — a slowly-rotating galaxy: drifting clouds, bright core,
    // spiral-arm stars graded core→accent→edge.
    const renderNebula = (now: number, baseA: number) => {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.46;
      const maxR = Math.min(W, H) * 0.64;
      const rot = now * 0.00003 * (activeRef.current ? 1 : 0.4);
      const acc = hexRgb(themeAccent.current);
      ctx.globalCompositeOperation = 'lighter';

      const clouds: { col: number[]; ox: number; oy: number; rad: number; a: number }[] = [
        { col: acc,             ox: 0.0,   oy: 0.0,   rad: 1.0,  a: 0.13 },
        { col: [236, 72, 153],  ox: 0.18,  oy: -0.10, rad: 0.8,  a: 0.09 },
        { col: [80, 110, 230],  ox: -0.16, oy: 0.12,  rad: 0.9,  a: 0.09 },
        { col: [251, 146, 60],  ox: 0.10,  oy: 0.16,  rad: 0.55, a: 0.06 },
      ];
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        const dx = Math.sin(now * 0.00005 + i) * 0.04;
        const px = cx + (c.ox + dx) * W, py = cy + c.oy * H;
        const g = ctx.createRadialGradient(px, py, 0, px, py, c.rad * maxR);
        g.addColorStop(0, `rgba(${c.col[0]|0},${c.col[1]|0},${c.col[2]|0},${c.a * baseA})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }

      // bright core
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.34);
      cg.addColorStop(0, `rgba(255,240,220,${0.35 * baseA})`);
      cg.addColorStop(0.4, `rgba(${acc[0]},${acc[1]},${acc[2]},${0.18 * baseA})`);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);

      // spiral-arm stars
      const core = [255, 235, 205], edge = [90, 110, 220];
      for (const s of stars) {
        const a = s.ang + rot * (1 - s.r * 0.4);
        const rr = s.r * maxR;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.6; // elliptical tilt
        const col = s.r < 0.5 ? lerp3(core, acc, s.r / 0.5) : lerp3(acc, edge, (s.r - 0.5) / 0.5);
        ctx.globalAlpha = s.b * baseA;
        ctx.fillStyle = `rgb(${col[0]|0},${col[1]|0},${col[2]|0})`;
        ctx.beginPath(); ctx.arc(x, y, s.size, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    // Holographic theme — neon grid + drifting node network + scan line.
    const renderHolographic = (now: number, baseA: number) => {
      ctx.clearRect(0, 0, W, H);
      const acc = hexRgb(themeAccent.current);
      const A = (a: number) => `rgba(${acc[0]},${acc[1]},${acc[2]},${a})`;
      ctx.globalCompositeOperation = 'lighter';

      // faint grid
      ctx.strokeStyle = A(0.045 * baseA); ctx.lineWidth = 1;
      const step = 64;
      for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // node network
      const motion = activeRef.current ? 1 : 0.5;
      for (const n of nodes) {
        n.x += n.vx * motion; n.y += n.vy * motion;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
      const D = 150;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.hypot(dx, dy);
          if (d < D) {
            ctx.strokeStyle = A(0.11 * baseA * (1 - d / D));
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          }
        }
      }
      for (const n of nodes) { ctx.fillStyle = A(0.5 * baseA); ctx.beginPath(); ctx.arc(n.x, n.y, 1.7, 0, 6.28); ctx.fill(); }

      // scan line sweeping down
      const scanY = ((now * 0.05) % (H + 240)) - 120;
      const sg = ctx.createLinearGradient(0, scanY - 70, 0, scanY + 70);
      sg.addColorStop(0, A(0)); sg.addColorStop(0.5, A(0.07 * baseA)); sg.addColorStop(1, A(0));
      ctx.fillStyle = sg; ctx.fillRect(0, scanY - 70, W, 140);

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    // Iridescence theme — a soft, slowly-flowing pastel-prism mesh.
    const IRID = [[165, 243, 252], [196, 181, 253], [251, 207, 232], [187, 247, 208], [167, 243, 208]];
    const renderIridescence = (now: number, baseA: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const maxR = Math.max(W, H);
      for (let i = 0; i < IRID.length; i++) {
        const c = IRID[i];
        const ph = i * 1.7;
        const cx = (0.5 + 0.42 * Math.sin(now * 0.00004 + ph)) * W;
        const cy = (0.5 + 0.42 * Math.cos(now * 0.00005 + ph * 1.3)) * H;
        const rad = maxR * (0.46 + 0.1 * Math.sin(now * 0.00006 + ph));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.11 * baseA})`);
        g.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},${0.04 * baseA})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      // a few drifting light sparkles
      for (const s of stars.slice(0, 40)) {
        const x = (s.r * 1.3 % 1) * W;
        const y = ((s.ang / 6.28 + now * 0.000015 * (0.4 + s.r)) % 1) * H;
        ctx.globalAlpha = (0.25 + 0.5 * (0.5 + 0.5 * Math.sin(now * 0.001 + s.ang))) * baseA;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(x, y, s.size * 0.7, 0, 6.28); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    };

    const frame = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.67); last = now;
      const scene = SCENE[sceneRef.current];
      if (scene.type !== curType) build();
      const [r, g, b] = hexRgb(scene.color);
      const mood = MOOD_TINT[moodRef.current] ?? '#6c6cf2';
      const motion = activeRef.current ? 1 : 0.4;
      const breathe = 0.82 + 0.18 * Math.sin(now * 0.00026);
      const baseA = (activeRef.current ? 1 : 0.55) * breathe;

      // Nebula theme overrides the soundscape scene with a galaxy swirl.
      if (themeMode.current === 'nebula') {
        renderNebula(now, baseA);
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      // Holographic theme — neon network.
      if (themeMode.current === 'holographic') {
        renderHolographic(now, baseA);
        rafRef.current = requestAnimationFrame(frame);
        return;
      }
      // Iridescence theme — flowing pastel-prism mesh.
      if (themeMode.current === 'iridescence') {
        renderIridescence(now, baseA);
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // ── Aurora nebula wash ───────────────────────────────────────────────
      for (const bl of blobs) {
        const cx = (bl.bx + 0.10 * Math.sin(now * bl.sp + bl.ph)) * W;
        const cy = (bl.by + 0.10 * Math.cos(now * bl.sp * 1.3 + bl.ph2)) * H;
        const rad = bl.rad * Math.max(W, H) * (0.9 + 0.1 * Math.sin(now * bl.sp * 2 + bl.ph));
        const [cr, cg, cb] = blobColor(bl.which, scene, mood);
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${0.10 * baseA})`);
        grd.addColorStop(0.5, `rgba(${cr},${cg},${cb},${0.04 * baseA})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Particles (with bloom) ───────────────────────────────────────────
      if (curType === 'rain') {
        if (scene.storm && Math.random() < 0.004) flash = 1;
        if (flash > 0) {
          ctx.fillStyle = `rgba(200,210,255,${0.16 * flash})`;
          ctx.fillRect(0, 0, W, H);
          flash = Math.max(0, flash - 0.05 * dt);
        }
        ctx.strokeStyle = `rgba(${r},${g},${b},1)`;
        ctx.lineWidth = 1.3;
        for (const p of parts) {
          ctx.globalAlpha = p.a * baseA;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 1.2, p.y + p.s);
          ctx.stroke();
          p.y += p.v * motion * dt * 1.7;
          p.x -= 0.35 * motion * dt;
          if (p.y > H) { p.y = -p.s; p.x = Math.random() * W; }
        }
      } else if (curType === 'fire') {
        const fg = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, H * 0.6);
        fg.addColorStop(0, `rgba(${r},${g},${b},${0.14 * baseA * (0.85 + Math.random() * 0.15)})`);
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
        ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 12;
        for (const p of parts) {
          p.t += 0.05 * dt;
          ctx.globalAlpha = p.a * baseA * (0.6 + 0.4 * Math.sin(p.t));
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
          p.y -= p.v * motion * dt * 1.4;
          p.x += Math.sin(p.t) * 0.5 * motion;
          if (p.y < H * 0.32 || p.a <= 0) { p.y = H + Math.random() * 30; p.x = W / 2 + (Math.random() - 0.5) * W * 0.5; }
        }
        ctx.shadowBlur = 0;
      } else if (curType === 'motes') {
        ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 10;
        for (const p of parts) {
          p.t += 0.018 * dt;
          ctx.globalAlpha = p.a * baseA * (0.45 + 0.55 * Math.sin(p.t));
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
          p.x += Math.sin(p.t) * 0.4 * motion * dt;
          p.y += p.v * motion * dt;
          if (p.y > H) { p.y = -4; p.x = Math.random() * W; }
        }
        ctx.shadowBlur = 0;
      } else if (curType === 'stars') {
        ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 8;
        for (const p of parts) {
          p.t += (0.35 + p.v) * dt;
          ctx.globalAlpha = p.a * baseA * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.t)));
          ctx.fillStyle = `rgba(${r},${g},${b},1)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill();
          p.x += p.v * motion * dt * 0.6;
          if (p.x > W) p.x = 0;
        }
        ctx.shadowBlur = 0;
      } else { // waves
        ctx.shadowColor = `rgb(${r},${g},${b})`; ctx.shadowBlur = 6;
        for (const p of parts) {
          p.t += (scene.fast ? 0.026 : 0.012) * dt * motion;
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
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      rafRef.current = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    if (!reduce) rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      mo.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: 0.95 }}
    />
  );
}
