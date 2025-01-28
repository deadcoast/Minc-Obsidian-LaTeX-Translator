// src/hooks/useTheme.ts
import { useEffect, useState } from 'react';
import { App } from 'obsidian';
import { useApp } from '../hooks';

export const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const app = useApp() as App;

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.body.classList.contains('theme-dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Initial theme check
    updateTheme();

    // Watch for theme changes
    app.workspace.on('css-change', updateTheme);

    return () => {
      app.workspace.off('css-change', updateTheme);
    };
  }, [app]);

  return theme;
};