'use client';

import { useEffect, useRef } from 'react';
import type { MentalState } from '@/types';
import { FREQUENCY_PROFILES } from '@/lib/brainwave-science';

interface Props {
  mentalState: MentalState;
  isPlaying: boolean;
}

const STATE_COLORS: Record<MentalState, string> = {
  focus: '#6366f1',
  learning: '#8b5cf6',
  relaxation: '#10b981',
  sleep: '#4338ca',
  'mood-boost': '#f59e0b',
  meditation: '#ec4899',
  'anxiety-relief': '#06b6d4',
};

export function FrequencyVisualizer({ mentalState, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const profile = FREQUENCY_PROFILES[mentalState];
  const color = STATE_COLORS[mentalState];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (timestamp: number) => {
      const dt = (timestamp - timeRef.current) / 1000;
      timeRef.current = timestamp;

      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      const numWaves = 3;
      for (let w = 0; w < numWaves; w++) {
        ctx.beginPath();
        const amplitude = isPlaying ? (H / 6) * (1 - w * 0.25) : H / 20;
        const freq = (profile.hz / 40) * (0.8 + w * 0.15);
        const speed = isPlaying ? 1.2 : 0.3;
        const phase = w * (Math.PI / numWaves);

        for (let x = 0; x <= W; x++) {
          const y =
            H / 2 +
            amplitude *
              Math.sin(
                (x / W) * Math.PI * 4 * freq +
                  timeRef.current * 0.001 * speed * Math.PI * 2 +
                  phase
              );
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = color + Math.round(255 * (0.6 - w * 0.15)).toString(16).padStart(2, '0');
        ctx.lineWidth = 2 - w * 0.4;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    timeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mentalState, isPlaying, color, profile.hz]);

  return (
    <div className="rounded-2xl overflow-hidden bg-black/30 border border-white/10">
      <canvas ref={canvasRef} width={600} height={120} className="w-full h-24" />
      <div className="px-4 py-2 text-xs text-white/40 flex justify-between">
        <span>{profile.wavetype}</span>
        <span>{profile.hz} Hz · {profile.bpm} BPM · {profile.musicalKey}</span>
      </div>
    </div>
  );
}
