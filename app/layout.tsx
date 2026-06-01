import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrainWave — Science-Tuned Music for Your Mind',
  description:
    'AI-generated music calibrated to specific brainwave frequencies for focus, learning, relaxation, sleep, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-2xl">🧠</span>
              <span>BrainWave</span>
            </a>
            <a
              href="/library"
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              My Library
            </a>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
