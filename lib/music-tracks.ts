/**
 * Real-music catalog — bundled CC0 / public-domain / CC recordings that replace
 * the synthesized engine for the Classical, Lo-fi, and Piano styles.
 *
 * Files live in /public/music and are LAZY-LOADED: only the track currently
 * playing is fetched, so selecting a genre doesn't download the whole library.
 * Attribution / licenses: /public/music/CREDITS.txt.
 *
 * Cinematic / Electronic styles have no clean CC source and stay synthesized
 * (AmbientMusicEngine). A style id present here → use the RealMusicEngine.
 */

import type { StyleId } from './music-styles';

export interface MusicTrack {
  file:    string;
  title:   string;
  artist:  string;
  license: string;
}

// Pixabay tracks use the Pixabay Content License (free, commercial OK, no
// attribution required). Source filenames are logged in /public/music/CREDITS.txt.
const PX = 'Pixabay';
const PXL = 'Pixabay Content License';

export const MUSIC_TRACKS: Partial<Record<StyleId, MusicTrack[]>> = {
  ambient: [
    { file: '/music/ambient-1.mp3',  title: 'Ambient I',     artist: PX, license: PXL },
    { file: '/music/ambient-2.mp3',  title: 'Ambient II',    artist: PX, license: PXL },
    { file: '/music/ambient-3.mp3',  title: 'Ambient Music', artist: PX, license: PXL },
    { file: '/music/ambient-4.mp3',  title: 'Astronomy',     artist: PX, license: PXL },
    { file: '/music/ambient-5.mp3',  title: 'Atmospheric',   artist: PX, license: PXL },
    { file: '/music/ambient-6.mp3',  title: 'Cinematic',     artist: PX, license: PXL },
    { file: '/music/ambient-7.mp3',  title: 'Contemplative', artist: PX, license: PXL },
    { file: '/music/ambient-8.mp3',  title: 'Dreamscape',    artist: PX, license: PXL },
    { file: '/music/ambient-9.mp3',  title: 'Inspiration',   artist: PX, license: PXL },
    { file: '/music/ambient-10.mp3', title: 'Relax',         artist: PX, license: PXL },
    { file: '/music/ambient-11.mp3', title: 'Soft',          artist: PX, license: PXL },
    { file: '/music/ambient-12.mp3', title: 'Soundscape',    artist: PX, license: PXL },
    { file: '/music/ambient-13.mp3', title: 'Storytelling',  artist: PX, license: PXL },
  ],
  classical: [
    { file: '/music/classical-1.mp3', title: 'Upbeat I',     artist: PX, license: PXL },
    { file: '/music/classical-2.mp3', title: 'Upbeat II',    artist: PX, license: PXL },
    { file: '/music/classical-3.mp3', title: 'Documentary',  artist: PX, license: PXL },
    { file: '/music/classical-4.mp3', title: 'Elegance',     artist: PX, license: PXL },
    { file: '/music/classical-5.mp3', title: 'Elegant',      artist: PX, license: PXL },
    { file: '/music/classical-6.mp3', title: 'English Air',  artist: PX, license: PXL },
    { file: '/music/classical-7.mp3', title: 'Memories',     artist: PX, license: PXL },
    { file: '/music/classical-8.mp3', title: 'Nature',       artist: PX, license: PXL },
    { file: '/music/classical-9.mp3', title: 'Piano',        artist: PX, license: PXL },
  ],
  piano: [
    { file: '/music/piano-1.mp3', title: 'Reflections', artist: PX, license: PXL },
    { file: '/music/piano-2.mp3', title: 'Backdrop',    artist: PX, license: PXL },
    { file: '/music/piano-3.mp3', title: 'Calm',        artist: PX, license: PXL },
    { file: '/music/piano-4.mp3', title: 'Lullaby',     artist: PX, license: PXL },
    { file: '/music/piano-5.mp3', title: 'Meditation',  artist: PX, license: PXL },
    { file: '/music/piano-6.mp3', title: 'Soft Keys',   artist: PX, license: PXL },
  ],
  lofi: [
    { file: '/music/lofi-1.mp3', title: 'Lo-fi — Drift',        artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/lofi-2.mp3', title: 'Lo-fi — Dusk',         artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/lofi-3.mp3', title: 'Lo-fi — Study Hall',   artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/lofi-4.mp3', title: 'Lo-fi — Rainy Window', artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/lofi-5.mp3', title: 'Lo-fi — Mellow',       artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/lofi-6.mp3', title: 'Lo-fi — Nightfall',    artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/lofi-7.mp3', title: 'Lo-fi — Daydream',     artist: 'HoliznaCC0', license: 'CC0' },
  ],
};

/** Style ids that play real recordings (vs the synth engine). */
export function isRealMusicStyle(id: StyleId): boolean {
  return !!MUSIC_TRACKS[id]?.length;
}
