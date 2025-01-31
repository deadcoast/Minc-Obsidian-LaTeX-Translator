import { App } from 'obsidian';
import { useEffect, useState } from 'react';

export interface AppHook {
  app: App;
}

export const useApp = (): AppHook => {
  const [app, setApp] = useState<App | null>(null);

  useEffect(() => {
    // Get the Obsidian app instance
    const appInstance = (window as any).app;
    if (appInstance) {
      setApp(appInstance);
    }
  }, []);

  return { app: app as App };
};
