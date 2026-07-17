'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoodSelector } from '@/components/MoodSelector';
import { OrbitalMoodSelector } from '@/components/OrbitalMoodSelector';
import { ListMoodSelector } from '@/components/ListMoodSelector';
import { PrismMoodSelector } from '@/components/PrismMoodSelector';
import { SoundscapeBackground } from '@/components/SoundscapeBackground';
import { useThemePalette } from '@/lib/use-theme';
import { buildSession } from '@/lib/session-content';
import type { MentalState, Duration, Intensity } from '@/types';
import { cn } from '@/lib/utils';

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 5,  label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
];

const INTENSITIES: { value: Intensity; label: string; desc: string; icon: string }[] = [
  { value: 'light',    label: 'Light',    desc: 'Subtle, in background', icon: '○' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced entrainment',  icon: '◑' },
  { value: 'deep',     label: 'Deep',     desc: 'Full immersion',        icon: '●' },
];

export default function Home() {
  const router = useRouter();
  const palette = useThemePalette();
  const [mentalState, setMentalState] = useState<MentalState | null>(null);
  const [duration, setDuration] = useState<Duration>(15);
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    if (!mentalState) return;
    setGenerating(true);
    const track = buildSession(mentalState, duration, intensity);
    sessionStorage.setItem('brainwave_track', JSON.stringify(track));
    router.push('/player');
  };

  return (
    <div className="relative min-h-screen">
      {/* Background — themed canvas for Nebula/Holographic/Iridescence, aura orbs otherwise */}
      {palette === 'nebula' || palette === 'holographic' || palette === 'iridescence' ? (
        <SoundscapeBackground soundscape="none" mentalState={mentalState ?? 'meditation'} active={false} />
      ) : (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="orb-1 absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px]" style={{ background: 'var(--accent)', opacity: 0.12 }} />
          <div className="orb-2 absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[100px]" style={{ background: 'var(--accent-2)', opacity: 0.10 }} />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: 'var(--accent-3)', opacity: 0.08 }} />
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-5 py-12 space-y-14">

        {/* Hero */}
        <div className="text-center space-y-5 fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs text-white/50 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Binaural beats · Generative music · Nature sounds
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            What does your
            <br />
            <span className="accent-text">
              mind need?
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
            Science-backed frequencies generated live in your browser. Free, forever.
          </p>
        </div>

        {/* Mood selector */}
        <div className="space-y-4 fade-up">
          <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Choose your state</p>
          {palette === 'nebula'
            ? <OrbitalMoodSelector selected={mentalState} onSelect={setMentalState} />
            : palette === 'holographic'
            ? <ListMoodSelector selected={mentalState} onSelect={setMentalState} />
            : palette === 'iridescence'
            ? <PrismMoodSelector selected={mentalState} onSelect={setMentalState} />
            : <MoodSelector selected={mentalState} onSelect={setMentalState} />}
        </div>

        {/* Duration + Intensity row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 fade-up">
          <div className="space-y-3">
            <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Duration</p>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDuration(value)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    duration === value
                      ? 'chip-on'
                      : 'glass text-white/60 hover:text-white hover:border-white/20'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Intensity</p>
            <div className="flex gap-2 flex-wrap">
              {INTENSITIES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setIntensity(value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                    intensity === value
                      ? 'chip-on'
                      : 'glass text-white/60 hover:text-white hover:border-white/20'
                  )}
                >
                  <span className="text-xs">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate CTA */}
        <button
          onClick={handleGenerate}
          disabled={!mentalState || generating}
          className={cn(
            'w-full py-5 rounded-2xl font-semibold text-base tracking-wide transition-all duration-300 fade-up',
            mentalState && !generating
              ? 'btn-accent hover:scale-[1.01]'
              : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
          )}
        >
          {generating ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Composing your session…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Start Session
              {mentalState && <span className="text-white/60">→</span>}
            </span>
          )}
        </button>

        {/* Footer note */}
        <p className="text-center text-xs text-white/20 pb-4">
          All audio generated in your browser · Free · Use headphones for best results
        </p>
      </div>
    </div>
  );
}
