// Web-compatible storage implementation for Tauri
class Storage {
  getString(key: string): string | undefined {
    return localStorage.getItem(key) || undefined;
  }

  set(key: string, value: any): void {
    if (typeof value === 'string') {
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  delete(key: string): void {
    localStorage.removeItem(key);
  }

  contains(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  getAllKeys(): string[] {
    return Object.keys(localStorage);
  }

  clearAll(): void {
    localStorage.clear();
  }
}

export const storage = new Storage();

// AsyncStorage compatibility layer
export const AsyncStorage = {
  getItem: async (key: string) => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    localStorage.removeItem(key);
  },
  clear: async () => {
    localStorage.clear();
  },
  getAllKeys: async () => {
    return Object.keys(localStorage);
  }
};
