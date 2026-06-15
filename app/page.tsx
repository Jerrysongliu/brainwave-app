'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoodSelector } from '@/components/MoodSelector';
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
  const [mentalState, setMentalState] = useState<MentalState | null>(null);
  const [duration, setDuration] = useState<Duration>(15);
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [smartInput, setSmartInput] = useState('');
  const [loadingRec, setLoadingRec] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleSmartRecommend = async () => {
    if (!smartInput.trim()) return;
    setLoadingRec(true);
    setError('');
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: smartInput }),
      });
      const data = await res.json();
      if (data.mentalState) setMentalState(data.mentalState);
    } catch {
      setError('Could not get recommendation. Please select manually.');
    } finally {
      setLoadingRec(false);
    }
  };

  const handleGenerate = async () => {
    if (!mentalState) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentalState, duration, intensity }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const track = await res.json();
      sessionStorage.setItem('brainwave_track', JSON.stringify(track));
      router.push('/player');
    } catch {
      setError('Generation failed. Check your ANTHROPIC_API_KEY and try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background aura orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb-1 absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="orb-2 absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-indigo-500/6 blur-[80px]" />
      </div>

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
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-cyan-400 bg-clip-text text-transparent">
              mind need?
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
            Science-backed frequencies generated live in your browser. Free, forever.
          </p>
        </div>

        {/* AI recommender */}
        <div className="glass rounded-2xl p-1 fade-up">
          <div className="flex gap-2">
            <input
              type="text"
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSmartRecommend()}
              placeholder="Describe how you feel… e.g. can't focus, anxious, exhausted"
              className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder-white/25 focus:outline-none"
            />
            <button
              onClick={handleSmartRecommend}
              disabled={loadingRec || !smartInput.trim()}
              className="m-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-sm font-medium disabled:opacity-30 transition-all whitespace-nowrap"
            >
              {loadingRec ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  Thinking
                </span>
              ) : '✦ Suggest'}
            </button>
          </div>
        </div>

        {/* Mood selector */}
        <div className="space-y-4 fade-up">
          <p className="text-xs font-medium text-white/30 uppercase tracking-[0.2em]">Choose your state</p>
          <MoodSelector selected={mentalState} onSelect={setMentalState} />
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
                      ? 'bg-white text-black border-transparent'
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
                      ? 'bg-white text-black border-transparent'
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

        {error && (
          <div className="text-red-400 text-sm glass border-red-400/20 rounded-xl px-4 py-3 fade-up">
            {error}
          </div>
        )}

        {/* Generate CTA */}
        <button
          onClick={handleGenerate}
          disabled={!mentalState || generating}
          className={cn(
            'w-full py-5 rounded-2xl font-semibold text-base tracking-wide transition-all duration-300 fade-up',
            mentalState && !generating
              ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 hover:opacity-90 text-white shadow-2xl shadow-violet-600/25 hover:shadow-violet-600/40 hover:scale-[1.01] active:scale-[0.99]'
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
