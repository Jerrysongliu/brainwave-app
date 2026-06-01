/**
 * Music generation abstraction layer.
 * Swap out the provider by implementing a new adapter and changing ACTIVE_PROVIDER.
 *
 * Supported providers (set MUSIC_API_PROVIDER env var):
 *   mock  — returns a royalty-free sample URL (default, no API key needed)
 *   suno  — Suno AI  (set SUNO_API_KEY)
 *   udio  — Udio AI  (set UDIO_API_KEY)
 */

export type MusicProvider = 'mock' | 'suno' | 'udio';

export interface MusicGenRequest {
  prompt: string;
  durationSeconds: number;
  title: string;
}

export interface MusicGenResult {
  audioUrl: string;
  provider: MusicProvider;
}

// ---------------------------------------------------------------------------
// Mock provider — uses a public domain ambient track for UI development
// ---------------------------------------------------------------------------
async function mockGenerate(req: MusicGenRequest): Promise<MusicGenResult> {
  // Simulates network latency
  await new Promise((r) => setTimeout(r, 1200));
  return {
    // Royalty-free ambient loop from Pixabay (public domain)
    audioUrl: 'https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3',
    provider: 'mock',
  };
}

// ---------------------------------------------------------------------------
// Suno AI adapter (placeholder — fill in when you have API access)
// ---------------------------------------------------------------------------
async function sunoGenerate(req: MusicGenRequest): Promise<MusicGenResult> {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) throw new Error('SUNO_API_KEY is not set');

  // TODO: Replace with actual Suno API endpoint and request shape
  // const res = await fetch('https://api.suno.ai/v1/generate', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt: req.prompt, duration: req.durationSeconds, title: req.title }),
  // });
  // const data = await res.json();
  // return { audioUrl: data.audio_url, provider: 'suno' };

  throw new Error('Suno adapter not yet implemented — add API call above');
}

// ---------------------------------------------------------------------------
// Udio AI adapter (placeholder — fill in when you have API access)
// ---------------------------------------------------------------------------
async function udioGenerate(req: MusicGenRequest): Promise<MusicGenResult> {
  const apiKey = process.env.UDIO_API_KEY;
  if (!apiKey) throw new Error('UDIO_API_KEY is not set');

  // TODO: Replace with actual Udio API endpoint and request shape
  // const res = await fetch('https://www.udio.com/api/generate', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt: req.prompt, duration: req.durationSeconds }),
  // });
  // const data = await res.json();
  // return { audioUrl: data.song_url, provider: 'udio' };

  throw new Error('Udio adapter not yet implemented — add API call above');
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export async function generateMusic(req: MusicGenRequest): Promise<MusicGenResult> {
  const provider = (process.env.MUSIC_API_PROVIDER as MusicProvider) ?? 'mock';

  switch (provider) {
    case 'suno':
      return sunoGenerate(req);
    case 'udio':
      return udioGenerate(req);
    default:
      return mockGenerate(req);
  }
}
