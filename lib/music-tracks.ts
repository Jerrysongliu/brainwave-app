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

export const MUSIC_TRACKS: Partial<Record<StyleId, MusicTrack[]>> = {
  ambient: [
    { file: '/music/ambient-1.mp3', title: 'Cosmic Waves',       artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/ambient-2.mp3', title: 'Dreamscape',         artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/ambient-3.mp3', title: 'Drifting',           artist: 'HoliznaCC0', license: 'CC0' },
    { file: '/music/ambient-4.mp3', title: 'Deep Meditation',    artist: 'HoliznaCC0', license: 'CC0' },
  ],
  classical: [
    { file: '/music/classical-1.mp3', title: 'Vivaldi — Spring (Four Seasons)', artist: 'John Harrison', license: 'CC BY-SA' },
    { file: '/music/classical-2.mp3', title: 'Bach — Air on the G String',       artist: 'Public Domain', license: 'Public Domain' },
    { file: '/music/classical-3.mp3', title: 'Mozart — Eine kleine Nachtmusik',  artist: 'via Wikimedia Commons', license: 'CC BY-SA 2.0' },
    { file: '/music/classical-4.mp3', title: 'Bach — Brandenburg Concerto No. 3', artist: 'via Wikimedia Commons', license: 'CC BY-SA 2.0' },
  ],
  piano: [
    { file: '/music/piano-1.mp3', title: 'Chopin — Nocturne Op. 9 No. 2', artist: 'Frank Lévy', license: 'Public Domain' },
    { file: '/music/piano-2.mp3', title: 'Debussy — Clair de Lune',       artist: 'Public Domain', license: 'Public Domain' },
    { file: '/music/piano-3.mp3', title: 'Chopin — Nocturne in C♯ minor', artist: 'via Wikimedia Commons', license: 'CC BY 3.0' },
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
