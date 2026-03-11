// Hanzo store compatibility layer
import { createUIStore } from './stores/ui.store.tsx';
import { createKeystrokeStore } from './stores/keystroke.store';
import { createClipboardStore } from './stores/clipboard.store.tsx';
import { createCalendarStore } from './stores/calendar.store.tsx';
import { createEmojiStore } from './stores/emoji.store.tsx';
import { createProcessesStore } from './stores/processes.store.tsx';
import { createSystemPreferencesStore } from './stores/systemPreferences.store.tsx';

// Define the root store interface for Hanzo compatibility
export interface IRootStore {
  ui: any;
  keystroke: any;
  clipboard: any;
  calendar: any;
  emoji: any;
  processes: any;
  systemPreferences: any;
}

// Create a root store instance
class RootStore implements IRootStore {
  ui: any;
  keystroke: any;
  clipboard: any;
  calendar: any;
  emoji: any;
  processes: any;
  systemPreferences: any;

  constructor() {
    // Initialize stores with circular reference to root
    this.ui = createUIStore(this);
    this.keystroke = createKeystrokeStore(this);
    this.clipboard = createClipboardStore(this);
    this.calendar = createCalendarStore(this);
    this.emoji = createEmojiStore(this);
    this.processes = createProcessesStore(this);
    this.systemPreferences = createSystemPreferencesStore(this);
  }
}

// Create singleton instance
const rootStore = new RootStore();

// Export unified store for backward compatibility
export const unifiedStore = rootStore.ui;

export const useStore = () => rootStore;

export default useStore;