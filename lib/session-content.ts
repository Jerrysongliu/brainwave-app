import { FREQUENCY_PROFILES, MENTAL_STATE_META } from './brainwave-science';
import type { MentalState, Duration, Intensity, GeneratedTrack } from '@/types';

// A few evocative title options per state — picked at random so repeat
// sessions don't always read identically. All audio/science content is
// generated locally; no network round-trip needed to start a session.
const TITLES: Record<MentalState, string[]> = {
  focus:            ['Clear Signal', 'Deep Work', 'Sharpened Mind', 'Flow Current'],
  learning:         ['Memory Bridge', 'Open Channel', 'Absorb & Retain', 'Quiet Study'],
  relaxation:       ['Tension Release', 'Soft Landing', 'Unwind', 'Gentle Drift'],
  sleep:            ['Deep Descent', 'Night Tide', 'Last Light', 'Slow Fade'],
  'mood-boost':     ['Bright Spark', 'Lift Off', 'Sunlit Mind', 'Fresh Current'],
  meditation:       ['Inner Stillness', 'Quiet Center', 'Present Moment', 'Still Water'],
  'anxiety-relief':  ['Safe Ground', 'Steady Breath', 'Calm Shore', 'Settling In'],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Builds a session locally — no network call, works fully offline. */
export function buildSession(
  mentalState: MentalState,
  duration: Duration,
  intensity: Intensity
): GeneratedTrack {
  const profile = FREQUENCY_PROFILES[mentalState];
  const meta = MENTAL_STATE_META[mentalState];

  return {
    id: crypto.randomUUID(),
    title: pick(TITLES[mentalState]),
    mentalState,
    duration,
    intensity,
    profile,
    scienceExplainer: `${profile.name} uses a ${profile.hz} Hz ${profile.wavetype.split('(')[0].trim()} binaural beat to guide your brain toward ${meta.label.toLowerCase()}. ${profile.scienceNote}`,
    audioUrl: null,
    createdAt: new Date().toISOString(),
  };
}
