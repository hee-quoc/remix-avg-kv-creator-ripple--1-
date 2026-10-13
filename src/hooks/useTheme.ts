import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nevo.theme.v1';

type Theme = 'light' | 'dark';

function readStored(): Theme | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Redesign V1-B — light/dark toggle backed by the design tokens in index.css (`:root[data-theme]`).
 * No stored preference yet = follows the OS (`prefers-color-scheme`, handled purely in CSS); picking
 * one here pins it explicitly and remembers it across reloads.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = readStored();
    if (stored) return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
