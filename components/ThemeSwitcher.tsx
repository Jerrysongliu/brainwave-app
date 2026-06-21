'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'aurora',      name: 'Aurora Flow', grad: 'linear-gradient(120deg,#8b5cf6,#6366f1 38%,#2dd4bf 78%,#34d399)' },
  { id: 'holographic', name: 'Holographic', grad: 'linear-gradient(120deg,#22d3ee,#38bdf8 50%,#6366f1)' },
  { id: 'nebula',      name: 'Nebula Wave', grad: 'linear-gradient(120deg,#6366f1,#a855f7 34%,#ec4899 68%,#fb923c)' },
  { id: 'iridescence', name: 'Iridescence', grad: 'linear-gradient(120deg,#a5f3fc,#c4b5fd 34%,#fbcfe8 66%,#bbf7d0)' },
];

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [palette, setPalette] = useState('aurora');

  useEffect(() => {
    const isDark = localStorage.getItem('brainwave_theme') === 'dark';
    const p = localStorage.getItem('brainwave_palette') || 'aurora';
    setDark(isDark);
    setPalette(p);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.setAttribute('data-theme', p);
  }, []);

  const setMode = (d: boolean) => {
    setDark(d);
    document.documentElement.classList.toggle('dark', d);
    localStorage.setItem('brainwave_theme', d ? 'dark' : 'light');
  };

  const pick = (p: string) => {
    setPalette(p);
    document.documentElement.setAttribute('data-theme', p);
    localStorage.setItem('brainwave_palette', p);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Theme"
        aria-label="Choose theme"
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        <span className="w-5 h-5 rounded-full ring-1 ring-white/30" style={{ background: 'var(--accent-grad)' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-64 glass rounded-2xl p-3 space-y-3 fade-up">
            {/* Light / Dark */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <button
                onClick={() => setMode(false)}
                className={cn('flex-1 py-1.5 rounded-lg text-sm font-medium transition-all', !dark ? 'chip-on' : 'text-white/55')}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setMode(true)}
                className={cn('flex-1 py-1.5 rounded-lg text-sm font-medium transition-all', dark ? 'chip-on' : 'text-white/55')}
              >
                🌙 Dark
              </button>
            </div>

            {/* Theme swatches */}
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pick(t.id)}
                  className={cn(
                    'rounded-xl p-2 border text-left transition-all active:scale-95',
                    palette === t.id ? 'chip-on' : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <div className="h-9 rounded-lg mb-1.5" style={{ background: t.grad }} />
                  <div className="text-[11px] font-medium text-white/85">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
