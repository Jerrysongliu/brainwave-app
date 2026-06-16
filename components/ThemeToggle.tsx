'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('brainwave_theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('brainwave_theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all hover:scale-110 active:scale-95"
      style={{ color: 'var(--text-2)' }}
      aria-label="Toggle theme"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
