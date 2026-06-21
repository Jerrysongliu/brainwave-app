#!/usr/bin/env node
/**
 * Builds the static export for the Capacitor iOS app.
 *
 * `output: 'export'` can't include Route Handlers that read the Request, so we
 * temporarily move `app/api` aside, run the export, then restore it. The mobile
 * app calls the HOSTED Vercel API (NEXT_PUBLIC_API_BASE) for those features.
 */
import { renameSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const API_DIR = 'app/api';
const TMP_DIR = 'app/_api_mobile_off';
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://brainwave-app-phi.vercel.app';

const sh = (cmd, env = {}) =>
  execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });

const moved = existsSync(API_DIR);
if (moved) renameSync(API_DIR, TMP_DIR);
try {
  console.log(`\n▶ Static export  (MOBILE=1, API_BASE=${API_BASE})\n`);
  sh('next build', { MOBILE: '1', NEXT_PUBLIC_API_BASE: API_BASE });
} finally {
  if (moved && existsSync(TMP_DIR)) renameSync(TMP_DIR, API_DIR);
}

console.log('\n✓ Static export ready in ./out');
console.log('  Next:  npx cap sync ios   then   npx cap open ios\n');
