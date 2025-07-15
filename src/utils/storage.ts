import { Store } from '@tauri-apps/plugin-store';

// Create a persistent store
const store = new Store('hanzo-store.json');

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await store.get<string>(key);
      return value ?? null;
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await store.set(key, value);
    await store.save();
  },

  async removeItem(key: string): Promise<void> {
    await store.delete(key);
    await store.save();
  },

  async clear(): Promise<void> {
    await store.clear();
    await store.save();
  },

  async getAllKeys(): Promise<string[]> {
    return await store.keys();
  }
};

// Helper functions for typed storage
export async function getStoredData<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const stored = await storage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid JSON or error
  }
  return defaultValue;
}

export async function setStoredData<T>(key: string, value: T): Promise<void> {
  await storage.setItem(key, JSON.stringify(value));
}