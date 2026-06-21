import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation } from '@/lib/claude';
import { CORS, preflight } from '@/lib/cors';

export function OPTIONS() { return preflight(); }

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input?.trim()) {
      return NextResponse.json({ error: 'No input provided' }, { status: 400, headers: CORS });
    }
    const result = await getRecommendation(input);
    return NextResponse.json(result, { headers: CORS });
  } catch (err) {
    console.error('[/api/recommend]', err);
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500, headers: CORS });
  }
}
