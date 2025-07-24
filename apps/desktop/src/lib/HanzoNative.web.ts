// Web implementation of HanzoNative
// This provides web-compatible implementations of native functionality

import { invoke } from '@tauri-apps/api/core';

export const HanzoNative = {
  // App management
  getApps: async () => {
    try {
      return await invoke('get_apps');
    } catch (error) {
      console.error('Failed to get apps:', error);
      return [];
    }
  },

  launchApp: async (appId: string) => {
    try {
      await invoke('launch_app', { name: appId });
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  },

  searchApps: async (query: string) => {
    try {
      return await invoke('search_apps', { query });
    } catch (error) {
      console.error('Failed to search apps:', error);
      return [];
    }
  },

  // File search (removed duplicate, see below)

  // Clipboard
  getClipboardText: async () => {
    try {
      return await invoke('clipboard_read_text');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return '';
    }
  },

  setClipboardText: async (text: string) => {
    try {
      await invoke('clipboard_write_text', { text });
    } catch (error) {
      console.error('Failed to write clipboard:', error);
    }
  },

  // System
  getSystemInfo: async () => {
    try {
      return await invoke('get_system_info');
    } catch (error) {
      console.error('Failed to get system info:', error);
      return null;
    }
  },

  // Window management
  hideWindow: async () => {
    try {
      await invoke('hide_window');
    } catch (error) {
      console.error('Failed to hide window:', error);
    }
  },

  showWindow: async () => {
    try {
      await invoke('show_window');
    } catch (error) {
      console.error('Failed to show window:', error);
    }
  },

  // Calendar
  getCalendarEvents: async (startDate: string, endDate: string) => {
    try {
      return await invoke('get_calendar_events', { startDate, endDate });
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  },

  // Add missing methods that are used in the codebase
  userName: () => {
    // Return a default username for web
    return 'user';
  },

  searchFiles: (folders: string[], query: string) => {
    // Return empty array for web - file search not available
    return [];
  },

  showToast: async (message: string, variant: 'success' | 'error') => {
    console.log(`Toast [${variant}]: ${message}`);
  },

  exists: (path: string) => {
    // Always return false for web
    return false;
  },

  readFile: (path: string) => {
    // Return null for web
    return null;
  },

  openFile: async (path: string) => {
    console.log(`Open file: ${path}`);
  },

  setLaunchAtLogin: (enabled: boolean) => {
    console.log(`Set launch at login: ${enabled}`);
  },

  setGlobalShortcut: (key: string) => {
    console.log(`Set global shortcut: ${key}`);
  },

  setShowWindowOn: (mode: string) => {
    console.log(`Set show window on: ${mode}`);
  },

  useBackgroundOverlay: (enabled: boolean) => {
    console.log(`Use background overlay: ${enabled}`);
  },

  setMediaKeyForwardingEnabled: (enabled: boolean) => {
    console.log(`Set media key forwarding: ${enabled}`);
  },

  updateHotkeys: (shortcuts: Record<string, string>) => {
    console.log(`Update hotkeys:`, shortcuts);
  },

  getCalendarAuthorizationStatus: () => {
    return 'NotDetermined';
  },

  getAccessibilityStatus: async () => {
    return true;
  },

  hasFullDiskAccess: async () => {
    return false;
  },

  getSafariBookmarks: async () => {
    return [];
  },

  restart: () => {
    window.location.reload();
  },

  setWindowHeight: (height: number) => {
    console.log(`Set window height: ${height}`);
  },

  addListener: (event: string, callback: Function) => {
    // Return a mock listener object
    return {
      remove: () => {}
    };
  },

  getWifiInfo: () => {
    return {
      ip: '127.0.0.1',
      ssid: 'Local Network'
    };
  }
};

// Export as both HanzoNative and hanzoNative for compatibility
export const hanzoNative = HanzoNative;
export default HanzoNative;