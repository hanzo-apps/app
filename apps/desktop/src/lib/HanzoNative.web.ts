// Web implementation of HanzoNative
// This provides web-compatible implementations of native functionality

import { invoke } from '@tauri-apps/api/core';

export const HanzoNative = {
  // App management
  getApps: async () => {
    try {
      // Use our native plugin command
      const apps = await invoke('plugin:native|get_all_applications');
      return apps;
    } catch (error) {
      console.error('Failed to get apps:', error);
      return [];
    }
  },

  launchApp: async (appId: string) => {
    try {
      // Use bundle ID to launch
      await invoke('plugin:native|launch_application', { bundleId: appId });
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  },

  searchApps: async (query: string) => {
    try {
      // Get all apps and filter client-side for now
      const apps = await invoke('plugin:native|get_all_applications');
      return apps.filter(app => 
        app.name.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search apps:', error);
      return [];
    }
  },

  // File search (removed duplicate, see below)

  // Clipboard
  getClipboardText: async () => {
    try {
      return await invoke('plugin:native|read_from_clipboard');
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      return '';
    }
  },

  setClipboardText: async (text: string) => {
    try {
      await invoke('plugin:native|write_to_clipboard', { text });
    } catch (error) {
      console.error('Failed to write clipboard:', error);
    }
  },
  
  getClipboardHistory: async () => {
    try {
      return await invoke('plugin:native|get_clipboard_history');
    } catch (error) {
      console.error('Failed to get clipboard history:', error);
      return [];
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
  getCalendarEvents: async (startDate?: string, endDate?: string) => {
    try {
      return await invoke('plugin:native|get_calendar_events');
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

  searchFiles: async (folders: string[], query: string) => {
    try {
      // Use native plugin for file search
      const path = folders.length > 0 ? folders[0] : undefined;
      return await invoke('plugin:native|native_search_files', { query, path });
    } catch (error) {
      console.error('Failed to search files:', error);
      return [];
    }
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
  },
  
  // Window management methods
  resizeFrontmostLeftHalf: async () => {
    try {
      await invoke('plugin:native|move_window_left');
    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  },
  
  resizeFrontmostRightHalf: async () => {
    try {
      await invoke('plugin:native|move_window_right');
    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  },
  
  resizeFrontmostFullscreen: async () => {
    try {
      await invoke('plugin:native|move_window_fullscreen');
    } catch (error) {
      console.error('Failed to resize window:', error);
    }
  },
  
  moveFrontmostCenter: async () => {
    try {
      await invoke('plugin:native|center_window');
    } catch (error) {
      console.error('Failed to center window:', error);
    }
  },
  
  // Keychain methods
  securelyStore: async (key: string, value: string) => {
    try {
      await invoke('plugin:native|save_to_keychain', { 
        service: 'hanzo',
        account: key,
        password: value 
      });
    } catch (error) {
      console.error('Failed to store in keychain:', error);
    }
  },
  
  securelyRetrieve: async (key: string) => {
    try {
      return await invoke('plugin:native|read_from_keychain', { 
        service: 'hanzo',
        account: key 
      });
    } catch (error) {
      console.error('Failed to retrieve from keychain:', error);
      return null;
    }
  },
  
  securelyDelete: async (key: string) => {
    try {
      await invoke('plugin:native|delete_from_keychain', { 
        service: 'hanzo',
        account: key 
      });
    } catch (error) {
      console.error('Failed to delete from keychain:', error);
    }
  },
  
  // Do Not Disturb
  checkDoNotDisturb: async () => {
    try {
      return await invoke('plugin:native|check_do_not_disturb');
    } catch (error) {
      console.error('Failed to check DND:', error);
      return false;
    }
  },
  
  // File metadata
  getFileMetadata: async (path: string) => {
    try {
      return await invoke('plugin:native|get_file_metadata', { path });
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }
};

// Export as both HanzoNative and hanzoNative for compatibility
export const hanzoNative = HanzoNative;
export default HanzoNative;