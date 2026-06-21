import { NextRequest, NextResponse } from 'next/server';
import { buildSessionContent } from '@/lib/claude';
import { FREQUENCY_PROFILES } from '@/lib/brainwave-science';
import { CORS, preflight } from '@/lib/cors';
import type { GenerateRequest, GeneratedTrack } from '@/types';

export function OPTIONS() { return preflight(); }

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { mentalState, duration, intensity } = body;

    if (!mentalState || !duration || !intensity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: CORS });
    }

    // Claude generates the title and science explainer only (no music API needed)
    const { title, scienceExplainer } = await buildSessionContent(
      mentalState,
      duration,
      intensity
    );

    const track: GeneratedTrack = {
      id: crypto.randomUUID(),
      title,
      mentalState,
      duration,
      intensity,
      profile: FREQUENCY_PROFILES[mentalState],
      scienceExplainer,
      audioUrl: null, // Audio generated in-browser via Web Audio API
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(track, { headers: CORS });
  } catch (err) {
    console.error('[/api/generate]', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500, headers: CORS });
  }
}
