'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-luxury-canvas-light dark:bg-luxury-canvas-dark border border-luxury-gold/20 hover:border-luxury-gold/50 transition-colors"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-luxury-ink-light" />
      ) : (
        <Sun className="h-5 w-5 text-luxury-ink-dark" />
      )}
    </button>
  );
}
