import type { Metadata } from 'next';
import './globals.css';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export const metadata: Metadata = {
  title: 'BrainWave — Science-Tuned Music for Your Mind',
  description:
    'Binaural beats + generative ambient music calibrated to brainwave frequencies. For focus, learning, relaxation, sleep, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('brainwave_theme');if(t==='dark')document.documentElement.classList.add('dark');var p=localStorage.getItem('brainwave_palette')||'aurora';document.documentElement.setAttribute('data-theme',p);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <nav className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg transition-shadow"
                style={{ background: 'var(--accent-grad)', boxShadow: '0 6px 20px var(--accent-glow)' }}
              >
                ψ
              </div>
              <span className="font-semibold text-base tracking-tight text-white/90">BrainWave</span>
            </a>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <a
                href="/library"
                className="text-sm text-white/40 hover:text-white/80 transition-colors flex items-center gap-1.5"
              >
                <span className="text-xs">◎</span> Library
              </a>
            </div>
          </div>
        </nav>
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
