import React, { createContext, useContext } from 'react';
import { App } from 'obsidian';

interface AppContextType {
  app: App;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ app: App; children: React.ReactNode }> = ({
  app,
  children,
}) => {
  return (
    <AppContext.Provider value={{ app }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): App => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context.app;
};
