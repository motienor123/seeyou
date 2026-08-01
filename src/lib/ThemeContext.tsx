'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'light',
  toggleTheme: () => {},
});

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('seeyou-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  function toggleTheme() {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('seeyou-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex items-center justify-center w-7 h-7 rounded-full bg-black/20 border border-white/10 text-white/80 hover:text-white transition-colors text-sm"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
