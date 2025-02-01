import { App } from 'obsidian';
import { useEffect, useState } from 'react';

export interface AppHook {
  app: App;
}

export const useApp = (): AppHook => {
  const [app, setApp] = useState<App | null>(null);

  useEffect(() => {
    // Get the Obsidian app instance
    interface ObsidianWindow extends Window {
      app: App;
    }
    const appInstance = (window as ObsidianWindow).app;
    if (appInstance) {
      setApp(appInstance);
    }
  }, []);

  return { app: app as App };
};
