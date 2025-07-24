import { makeAutoObservable } from 'mobx';
import { IRootStore } from '../store';

export type SystemPreferencesStore = ReturnType<typeof createSystemPreferencesStore>;

export const createSystemPreferencesStore = (root: IRootStore) => {
  const store = makeAutoObservable({
    // Add system preferences state here
    darkMode: false,
    
    toggleDarkMode() {
      this.darkMode = !this.darkMode;
    },
    
    // Add more system preferences methods as needed
  });
  
  return store;
};