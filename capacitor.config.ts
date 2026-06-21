import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.brainwave.mobile',
  appName: 'BrainWave',
  webDir: 'out', // static export produced by `npm run build:mobile`
  ios: {
    contentInset: 'always',
    backgroundColor: '#07070f',
  },
};

export default config;
