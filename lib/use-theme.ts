'use client';

import { useEffect, useState } from 'react';

/**
 * Reactively read the active theme palette (html[data-theme]) so components can
 * swap whole layouts per theme (e.g. Nebula's orbital selector vs the default
 * card grid). Updates live when the ThemeSwitcher changes the attribute.
 */
export function useThemePalette(): string {
  const [palette, setPalette] = useState('aurora');
  useEffect(() => {
    const read = () =>
      setPalette(document.documentElement.getAttribute('data-theme') || 'aurora');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return palette;
}
