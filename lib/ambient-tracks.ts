/**
 * Global soundscape library — all sounds available for every mental state.
 * Sources: Wikimedia Commons (CC0 / public domain, freely accessible).
 *
 * To add more tracks:
 *   1. Find an audio file on https://commons.wikimedia.org
 *   2. Get the direct URL via the API:
 *      https://commons.wikimedia.org/w/api.php?action=query&titles=File:YourFile.ogg&prop=videoinfo&viprop=url&format=json
 *   3. Add an entry below in the appropriate category.
 */

export interface AmbientTrack {
  id: string;
  emoji: string;
  label: string;
  category: SoundCategory;
  url: string;
  source: string;
}

export type SoundCategory = 'rain' | 'storm' | 'ocean' | 'wind' | 'night' | 'fire' | 'forest';

export const CATEGORY_LABELS: Record<SoundCategory, string> = {
  rain:   '🌧️ Rain',
  storm:  '⛈️ Storm',
  ocean:  '🌊 Ocean',
  wind:   '💨 Wind',
  night:  '🌙 Night',
  fire:   '🔥 Fire',
  forest: '🌲 Forest',
};

/** All soundscapes — available globally regardless of mental state */
export const SOUNDSCAPE_LIBRARY: AmbientTrack[] = [
  // ── Rain ──────────────────────────────────────────────────────────────────
  {
    id: 'rain-gentle',
    emoji: '🌦️',
    label: 'Gentle Rain',
    category: 'rain',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Rain_%281%29.ogg',
    source: 'Wikimedia Commons – CC0',
  },
  {
    id: 'rain-forest',
    emoji: '🌧️',
    label: 'Rain in the Woods',
    category: 'rain',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Bourne_woods_rain_2020-05-10_0804.mp3',
    source: 'Wikimedia Commons – CC0 (Bourne Woods field recording)',
  },

  // ── Storm ─────────────────────────────────────────────────────────────────
  {
    id: 'storm-thunder',
    emoji: '⛈️',
    label: 'Thunder & Rain',
    category: 'storm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Rain_and_thunder_%281%29.ogg',
    source: 'Wikimedia Commons – CC0',
  },
  {
    id: 'storm-heavy',
    emoji: '🌩️',
    label: 'Heavy Storm',
    category: 'storm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Storm_en_regen_-_SoundCloud_-_Raaphorst.ogg',
    source: 'Wikimedia Commons – CC0 (field recording, The Hague)',
  },

  // ── Ocean ─────────────────────────────────────────────────────────────────
  {
    id: 'ocean-waves',
    emoji: '🌊',
    label: 'Ocean Waves',
    category: 'ocean',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Bubbling_Waterfall_and_Ocean_Waves.ogg',
    source: 'Wikimedia Commons – CC0',
  },

  // ── Wind ──────────────────────────────────────────────────────────────────
  {
    id: 'wind-forest',
    emoji: '🍃',
    label: 'Wind in the Trees',
    category: 'wind',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Bourne_woods_windy_2020-05-05_0753.mp3',
    source: 'Wikimedia Commons – CC0 (Bourne Woods field recording)',
  },
  {
    id: 'wind-howling',
    emoji: '💨',
    label: 'Howling Wind',
    category: 'wind',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Howling_wind.ogg',
    source: 'Wikimedia Commons – CC0',
  },

  // ── Night ─────────────────────────────────────────────────────────────────
  {
    id: 'night-crickets',
    emoji: '🦗',
    label: 'Summer Night Crickets',
    category: 'night',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Field_cricket_unedited.ogg',
    source: 'Wikimedia Commons – CC0 (field cricket recording)',
  },

  // ── Fire ──────────────────────────────────────────────────────────────────
  {
    id: 'fire-crackling',
    emoji: '🔥',
    label: 'Crackling Fire',
    category: 'fire',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Bones_breaking_wood_fire_ice_crackling.ogg',
    source: 'Wikimedia Commons – CC0',
  },
];

/** Default soundscape ID for each mental state */
export const DEFAULT_SOUNDSCAPE: Record<string, string> = {
  focus:          'rain-forest',
  learning:       'rain-gentle',
  relaxation:     'ocean-waves',
  sleep:          'night-crickets',
  'mood-boost':   'wind-forest',
  meditation:     'fire-crackling',
  'anxiety-relief': 'rain-gentle',
};
