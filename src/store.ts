// Sol store compatibility layer
import { unifiedStore } from './stores/unified.store';

export const useStore = () => ({
  ui: unifiedStore,
  keystroke: unifiedStore.keystroke,
  clipboard: {
    history: [],
    getHistory: () => [],
  },
  calendar: {
    events: [],
  },
  emoji: {
    recent: [],
  },
  processes: {
    list: [],
    refresh: () => {},
  },
  systemPreferences: {
    isDarkMode: unifiedStore.isDarkMode,
  },
});

export default useStore;