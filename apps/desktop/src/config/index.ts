// Fuse.js configuration options
export const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.3,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: ['name', 'title', 'processName', 'path']
};

// App configuration
export const APP_CONFIG = {
  name: 'Hanzo',
  version: '0.0.1',
  defaultWidget: 'search',
  maxSearchResults: 50,
  debounceDelay: 100,
  
  // Window configuration
  window: {
    width: 720,
    height: 450,
    minWidth: 600,
    minHeight: 400,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
  },
  
  // Shortcuts
  shortcuts: {
    toggle: 'CommandOrControl+Space',
    aiChat: 'CommandOrControl+Shift+Space',
  }
};

export default APP_CONFIG;