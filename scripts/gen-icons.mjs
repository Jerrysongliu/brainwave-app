#!/usr/bin/env node
/**
 * Rasterizes assets/icon.svg into the app icon (for @capacitor/assets), the
 * PWA / lock-screen icons (public/), and the iOS splash screens.
 * Run after editing the source SVG:  node scripts/gen-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';

const svg = readFileSync('assets/icon.svg');
mkdirSync('public', { recursive: true });

const icon = (size) => sharp(svg, { density: 300 }).resize(size, size);

const out = async (size, path) => { await icon(size).png().toFile(path); console.log('✓', path, `${size}px`); };

await out(1024, 'assets/icon.png');            // @capacitor/assets source
await out(512,  'public/icon-512.png');        // MediaSession / PWA
await out(192,  'public/icon-192.png');        // PWA
await out(180,  'public/apple-touch-icon.png');// iOS web clip
await out(32,   'public/favicon-32.png');

// iOS splash: the mark centred on a deep background
const splash = async (bg, path) => {
  const mark = await icon(860).png().toBuffer();
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: bg } })
    .composite([{ input: mark, gravity: 'center' }])
    .png().toFile(path);
  console.log('✓', path, '2732px');
};
await splash({ r: 12, g: 11, b: 26, alpha: 1 }, 'assets/splash-dark.png');
await splash({ r: 18, g: 16, b: 40, alpha: 1 }, 'assets/splash.png');

console.log('\n✓ icons + splash generated');
