// Widget types enum - using uppercase values for backward compatibility
export enum Widget {
  ONBOARDING = 'ONBOARDING',
  SEARCH = 'SEARCH',
  CALENDAR = 'CALENDAR',
  TRANSLATION = 'TRANSLATION',
  SETTINGS = 'SETTINGS',
  CREATE_ITEM = 'CREATE_ITEM',
  GOOGLE_MAP = 'GOOGLE_MAP',
  SCRATCHPAD = 'SCRATCHPAD',
  EMOJIS = 'EMOJIS',
  CLIPBOARD = 'CLIPBOARD',
  PROCESSES = 'PROCESSES',
  FILE_SEARCH = 'FILE_SEARCH',
  AI = 'AI'
}

// Item types enum - using uppercase values for backward compatibility
export enum ItemType {
  FILE = 'FILE',
  APPLICATION = 'APPLICATION',
  CONFIGURATION = 'CONFIGURATION',
  CUSTOM = 'CUSTOM',
  TEMPORARY_RESULT = 'TEMPORARY_RESULT',
  BOOKMARK = 'BOOKMARK',
  PREFERENCE_PANE = 'PREFERENCE_PANE'
}

// Scratchpad color enum
export enum ScratchPadColor {
  SYSTEM = 'SYSTEM',
  BLUE = 'BLUE',
  ORANGE = 'ORANGE'
}

// Re-export commonly used types
export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void | Promise<void>;
}

export interface KeyBinding {
  key: string;
  modifiers?: string[];
  action: () => void;
}

// Export UIStore type
export type UIStore = any;

// Create a unified store that combines all stores
class UnifiedStoreClass {
  isDarkMode = false;
  
  keystroke = {
    registerShortcut: (shortcut: string, callback: Function) => {},
    unregisterShortcut: (shortcut: string) => {}
  };

  constructor() {
    // Initialize store properties
  }
}

// Export the unified store instance
export const unifiedStore = new UnifiedStoreClass();

// Re-export from store.ts once it's created to avoid circular dependency
// The actual unifiedStore will be created in store.ts