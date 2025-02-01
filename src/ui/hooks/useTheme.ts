// src/hooks/useTheme.ts
import { useEffect, useState } from 'react';
import { useApp } from './useApp';

type Theme = 'light' | 'dark';

export const useTheme = (): Theme => {
  const [theme, setTheme] = useState<Theme>('light');
  const { app } = useApp();

  useEffect(() => {
    const updateTheme = (): void => {
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

export const useThemeClass = (): string => {
  const theme = useTheme();
  return `theme-${theme}`;
};
