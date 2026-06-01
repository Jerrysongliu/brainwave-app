export type MentalState =
  | 'focus'
  | 'learning'
  | 'relaxation'
  | 'sleep'
  | 'mood-boost'
  | 'meditation'
  | 'anxiety-relief';

export type Duration = 5 | 15 | 30 | 60;

export type Intensity = 'light' | 'moderate' | 'deep';

export interface FrequencyProfile {
  name: string;
  hz: number;
  wavetype: string;
  bpm: number;
  musicalKey: string;
  instruments: string[];
  moodTags: string[];
  scienceNote: string;
}

export interface GenerateRequest {
  mentalState: MentalState;
  duration: Duration;
  intensity: Intensity;
}

export interface GeneratedTrack {
  id: string;
  title: string;
  mentalState: MentalState;
  duration: Duration;
  intensity: Intensity;
  profile: FrequencyProfile;
  scienceExplainer: string;
  /** Always null — audio is generated in-browser via Web Audio API */
  audioUrl: null;
  createdAt: string;
}
