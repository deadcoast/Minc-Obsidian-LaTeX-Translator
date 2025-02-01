import { useContext } from 'react';
import { AppContext } from '@components/AppContext';

export const useApp = (): ReturnType<typeof useContext<typeof AppContext>> => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
