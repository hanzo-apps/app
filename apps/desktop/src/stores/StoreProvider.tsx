import React, { createContext, useContext } from 'react';
import { clipboardStore } from './clipboard.store';
import { createProcessesStore } from './processes.store';
import { createCalendarStore } from './calendar.store';
import { createUIStore } from './ui.store.tsx';
import { createEmojiStore } from './emoji.store';
import { createSystemPreferencesStore } from './systemPreferences.store';

// Create a simple root store that holds all stores
const rootStore = {
  clipboard: clipboardStore,
  // Other stores need to be created with root store reference
  // For now, we'll create a minimal structure
};

// Add other stores after rootStore is created
rootStore.ui = createUIStore(rootStore);
rootStore.processes = createProcessesStore(rootStore);
rootStore.calendar = createCalendarStore(rootStore);
rootStore.emoji = createEmojiStore(rootStore);
rootStore.systemPreferences = createSystemPreferencesStore(rootStore);

// Create context
const StoreContext = createContext(rootStore);

// Provider component
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>;
};

// Hook to use store
export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return store;
};