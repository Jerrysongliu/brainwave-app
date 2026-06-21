#!/usr/bin/env node
/**
 * Configures the generated iOS project for BACKGROUND AUDIO. Run AFTER
 * `npx cap add ios` (and re-run anytime; it's idempotent):
 *
 *   npm run ios:configure
 *
 * It does two things the App Store build needs:
 *   1. Info.plist  → UIBackgroundModes = [audio]  (allow audio in background)
 *   2. AppDelegate → AVAudioSession(.playback, active)  (keep the session alive
 *      so the Web Audio engines keep playing when the screen locks)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const PLIST = 'ios/App/App/Info.plist';
const DELEGATE = 'ios/App/App/AppDelegate.swift';

if (!existsSync(PLIST) || !existsSync(DELEGATE)) {
  console.error('✗ iOS project not found. Run `npm run build:mobile` then `npx cap add ios` first.');
  process.exit(1);
}

// ── 1. Info.plist: UIBackgroundModes = [audio] ──────────────────────────────
let plist = readFileSync(PLIST, 'utf8');
if (plist.includes('UIBackgroundModes')) {
  console.log('• Info.plist already has UIBackgroundModes — skipped');
} else {
  const block =
    '\t<key>UIBackgroundModes</key>\n\t<array>\n\t\t<string>audio</string>\n\t</array>\n';
  plist = plist.replace(/\n<\/dict>\n<\/plist>\s*$/, `\n${block}</dict>\n</plist>\n`);
  writeFileSync(PLIST, plist);
  console.log('✓ Info.plist: added UIBackgroundModes = [audio]');
}

// ── 2. AppDelegate.swift: AVAudioSession playback ───────────────────────────
let del = readFileSync(DELEGATE, 'utf8');
let changed = false;

if (!del.includes('import AVFoundation')) {
  del = del.replace(/import Capacitor/, 'import Capacitor\nimport AVFoundation');
  changed = true;
}

if (!del.includes('AVAudioSession.sharedInstance().setCategory')) {
  const snippet = `
        // BrainWave: keep audio playing in the background / on the lock screen
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("AVAudioSession error: \\(error)")
        }
`;
  // insert right after the didFinishLaunchingWithOptions opening brace
  del = del.replace(
    /(didFinishLaunchingWithOptions[^\n]*->\s*Bool\s*\{)/,
    `$1\n${snippet}`
  );
  changed = true;
}

if (changed) {
  writeFileSync(DELEGATE, del);
  console.log('✓ AppDelegate.swift: configured AVAudioSession(.playback)');
} else {
  console.log('• AppDelegate.swift already configured — skipped');
}

console.log('\n✓ iOS background audio configured. Now:  npx cap sync ios  &&  npx cap open ios\n');
