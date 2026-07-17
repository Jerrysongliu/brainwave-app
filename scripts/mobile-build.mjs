#!/usr/bin/env node
/**
 * Builds the static export for the Capacitor iOS app.
 * Everything runs client-side (Web Audio + local session generation), so this
 * is just `next build` with the static-export flag on — no hosted API needed.
 */
import { execSync } from 'node:child_process';

execSync('next build', {
  stdio: 'inherit',
  env: { ...process.env, MOBILE: '1' },
});

console.log('\n✓ Static export ready in ./out');
console.log('  Next:  npx cap sync ios   then   npx cap open ios\n');
