import type { MentalState, FrequencyProfile } from '@/types';

export const MENTAL_STATE_META: Record<
  MentalState,
  { label: string; emoji: string; description: string; color: string }
> = {
  focus: {
    label: 'Deep Focus',
    emoji: '🎯',
    description: 'Enter a flow state for coding, writing, or problem-solving',
    color: 'from-blue-600 to-indigo-700',
  },
  learning: {
    label: 'Learning',
    emoji: '📚',
    description: 'Enhance memory retention and information absorption',
    color: 'from-violet-600 to-purple-700',
  },
  relaxation: {
    label: 'Relaxation',
    emoji: '🌿',
    description: 'Decompress and let tension melt away',
    color: 'from-emerald-500 to-teal-600',
  },
  sleep: {
    label: 'Sleep',
    emoji: '🌙',
    description: 'Wind down for deep, restorative sleep',
    color: 'from-indigo-800 to-slate-900',
  },
  'mood-boost': {
    label: 'Mood Boost',
    emoji: '✨',
    description: 'Lift your spirits and energize your day',
    color: 'from-amber-500 to-orange-600',
  },
  meditation: {
    label: 'Meditation',
    emoji: '🧘',
    description: 'Deepen your mindfulness and inner stillness',
    color: 'from-pink-500 to-rose-600',
  },
  'anxiety-relief': {
    label: 'Anxiety Relief',
    emoji: '💆',
    description: 'Calm your nervous system and find safety',
    color: 'from-cyan-500 to-sky-600',
  },
};

// Research-backed frequency profiles per mental state
export const FREQUENCY_PROFILES: Record<MentalState, FrequencyProfile> = {
  focus: {
    name: 'Gamma-Alpha Focus',
    hz: 40,
    wavetype: 'Gamma (40 Hz binaural) layered with Alpha (10 Hz)',
    bpm: 70,
    musicalKey: 'D minor',
    instruments: ['ambient synth pads', 'subtle piano', 'soft bass drone'],
    moodTags: ['focused', 'clear', 'steady', 'immersive'],
    scienceNote:
      '40 Hz gamma oscillations are linked to high-level cognitive binding and sustained attention (Herrmann et al., 2004). Alpha waves reduce distraction while maintaining alertness.',
  },
  learning: {
    name: 'Theta Memory Bridge',
    hz: 6,
    wavetype: 'Theta (6 Hz binaural)',
    bpm: 60,
    musicalKey: 'F major',
    instruments: ['soft piano', 'string pads', 'gentle flute'],
    moodTags: ['curious', 'open', 'receptive', 'calm alertness'],
    scienceNote:
      'Hippocampal theta rhythms (4–8 Hz) are strongly associated with memory encoding and spatial learning (Buzsáki, 2002). 432 Hz tuning may reduce cognitive tension.',
  },
  relaxation: {
    name: 'Alpha Restoration',
    hz: 10,
    wavetype: 'Alpha (10 Hz binaural)',
    bpm: 55,
    musicalKey: 'G major',
    instruments: ['nature sounds', 'acoustic guitar', 'soft synth', 'rain'],
    moodTags: ['peaceful', 'warm', 'gentle', 'unhurried'],
    scienceNote:
      'Alpha waves (8–12 Hz) are the brain\'s "idle but aware" state. Music at 55–65 BPM entrains the heart toward a parasympathetic rest response (Trappe, 2010).',
  },
  sleep: {
    name: 'Delta Deep Rest',
    hz: 2,
    wavetype: 'Delta (2 Hz binaural)',
    bpm: 40,
    musicalKey: 'C major',
    instruments: ['deep drones', 'bowls', 'breath-like pads'],
    moodTags: ['heavy', 'dark', 'slow', 'dissolving'],
    scienceNote:
      'Delta waves (0.5–4 Hz) dominate during deep NREM sleep and tissue repair. 174 Hz is associated with pain relief and deep relaxation in sound therapy research.',
  },
  'mood-boost': {
    name: 'Serotonin Surge',
    hz: 528,
    wavetype: 'Isochronic tones at 10 Hz (Alpha uplift)',
    bpm: 120,
    musicalKey: 'E major',
    instruments: ['bright synths', 'upbeat percussion', 'layered vocals', 'bass'],
    moodTags: ['joyful', 'energetic', 'uplifting', 'vibrant'],
    scienceNote:
      '528 Hz is studied as a frequency associated with positive affect and DNA repair hypothesis (Horowitz, 2010). Upbeat 120 BPM music releases dopamine and stimulates reward circuits.',
  },
  meditation: {
    name: 'Theta Stillness',
    hz: 432,
    wavetype: 'Theta (4–7 Hz) with 432 Hz tuning',
    bpm: 48,
    musicalKey: 'A minor (432 Hz)',
    instruments: ['Tibetan bowls', 'tanpura drone', 'soft gong', 'silence'],
    moodTags: ['still', 'vast', 'present', 'timeless'],
    scienceNote:
      'Tibetan bowl frequencies match theta brain rhythms, promoting meditative states (Goldsby et al., 2017). 432 Hz tuning is reported to feel more natural and calming than 440 Hz.',
  },
  'anxiety-relief': {
    name: 'Vagal Calm',
    hz: 396,
    wavetype: 'Alpha-Theta bridge (8 Hz binaural)',
    bpm: 52,
    musicalKey: 'F major',
    instruments: ['slow strings', 'gentle piano', 'low flute', 'ambient breath'],
    moodTags: ['safe', 'grounded', 'slow', 'releasing'],
    scienceNote:
      '396 Hz is associated with releasing fear and guilt in solfeggio research. Music at <60 BPM activates the vagal brake and shifts the ANS toward parasympathetic dominance (Thayer & Lane, 2000).',
  },
};
