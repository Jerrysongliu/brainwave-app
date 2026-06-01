'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoodSelector } from '@/components/MoodSelector';
import type { MentalState, Duration, Intensity } from '@/types';
import { cn } from '@/lib/utils';

const DURATIONS: Duration[] = [5, 15, 30, 60];
const INTENSITIES: { value: Intensity; label: string; desc: string }[] = [
  { value: 'light', label: 'Light', desc: 'Subtle background support' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced entrainment' },
  { value: 'deep', label: 'Deep', desc: 'Full immersion' },
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

      // Store in sessionStorage for the player page
      sessionStorage.setItem('brainwave_track', JSON.stringify(track));
      router.push('/player');
    } catch {
      setError('Generation failed. Check your ANTHROPIC_API_KEY and try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3 pt-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Music tuned to your{' '}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            brain
          </span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Science-backed frequencies. AI-generated in real time. For any mental state.
        </p>
      </div>

      {/* Smart recommender */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-3">
        <label className="text-sm font-medium text-white/70">
          ✨ Describe how you feel or what you need
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSmartRecommend()}
            placeholder="e.g. I need to study for my exam, I'm anxious about tomorrow..."
            className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 border border-white/10 focus:outline-none focus:border-white/30"
          />
          <button
            onClick={handleSmartRecommend}
            disabled={loadingRec || !smartInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {loadingRec ? 'Thinking…' : 'Suggest'}
          </button>
        </div>
      </div>

      {/* Mood selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
          Choose your state
        </h2>
        <MoodSelector selected={mentalState} onSelect={setMentalState} />
      </div>

      {/* Duration */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Duration</h2>
        <div className="flex gap-3 flex-wrap">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-medium border transition-all',
                duration === d
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Intensity</h2>
        <div className="flex gap-3 flex-wrap">
          {INTENSITIES.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setIntensity(value)}
              className={cn(
                'flex flex-col items-start px-5 py-3 rounded-xl text-sm border transition-all',
                intensity === value
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
              )}
            >
              <span className="font-medium">{label}</span>
              <span className={cn('text-xs', intensity === value ? 'text-black/60' : 'text-white/40')}>
                {desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Generate CTA */}
      <button
        onClick={handleGenerate}
        disabled={!mentalState || generating}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200',
          mentalState && !generating
            ? 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/20'
            : 'bg-white/10 text-white/30 cursor-not-allowed'
        )}
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span> Generating your session…
          </span>
        ) : (
          '🎵 Generate My Session'
        )}
      </button>
    </div>
  );
}
