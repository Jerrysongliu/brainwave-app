// CORS headers so the Capacitor iOS app (origin capacitor://localhost) can call
// the hosted API routes. Harmless for the same-origin web app.
export const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}
