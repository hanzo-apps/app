import { makeAutoObservable } from 'mobx';
import MiniSearch from 'minisearch';
import { nanoid } from 'nanoid';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import { getStoredData, setStoredData } from '../utils/storage';

export interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: Date;
  pinned: boolean;
  appName?: string;
  appIcon?: string;
}

class ClipboardStore {
  items: ClipboardItem[] = [];
  searchQuery = '';
  searchResults: ClipboardItem[] = [];
  selectedIndex = 0;
  miniSearch: MiniSearch<ClipboardItem>;
  private lastClipboard = '';
  private pollInterval: number | null = null;

  constructor() {
    makeAutoObservable(this);

    // Initialize MiniSearch
    this.miniSearch = new MiniSearch({
      fields: ['content'],
      storeFields: ['id', 'content', 'type', 'timestamp', 'pinned'],
      searchOptions: {
        fuzzy: 0.2,
        prefix: true
      }
    });

    this.loadHistory();
    this.startMonitoring();
  }

  async loadHistory() {
    const saved = await getStoredData<ClipboardItem[]>('clipboardHistory', []);
    this.items = saved.map(item => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
    
    // Re-index items
    this.miniSearch.removeAll();
    this.miniSearch.addAll(this.items);
    
    this.search();
  }

  async saveHistory() {
    // Keep only last 1000 items
    const toSave = this.items.slice(0, 1000);
    await setStoredData('clipboardHistory', toSave);
  }

  startMonitoring() {
    // Check clipboard every 500ms
    this.pollInterval = window.setInterval(() => {
      this.checkClipboard();
    }, 500);
  }

  stopMonitoring() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async checkClipboard() {
    try {
      const text = await readText();
      if (text && text !== this.lastClipboard) {
        this.lastClipboard = text;
        await this.addItem(text);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  }

  async addItem(content: string, type: 'text' | 'image' | 'file' = 'text') {
    // Don't add duplicates
    const existing = this.items.find(item => item.content === content);
    if (existing) {
      // Move to top
      this.items = [existing, ...this.items.filter(i => i.id !== existing.id)];
      await this.saveHistory();
      return;
    }

    const newItem: ClipboardItem = {
      id: nanoid(),
      content,
      type,
      timestamp: new Date(),
      pinned: false
    };

    this.items.unshift(newItem);
    this.miniSearch.add(newItem);
    await this.saveHistory();
    this.search();
  }

  async copyItem(item: ClipboardItem) {
    await writeText(item.content);
    this.lastClipboard = item.content;
    
    // Move to top
    this.items = [item, ...this.items.filter(i => i.id !== item.id)];
    await this.saveHistory();
  }

  async deleteItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
    this.miniSearch.remove({ id });
    await this.saveHistory();
    this.search();
  }

  togglePin(id: string) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.pinned = !item.pinned;
      this.saveHistory();
      this.search();
    }
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.search();
  }

  search() {
    if (!this.searchQuery.trim()) {
      // Show all items, pinned first
      this.searchResults = [...this.items].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
    } else {
      // Search with MiniSearch
      const results = this.miniSearch.search(this.searchQuery);
      this.searchResults = results.map(result => {
        return this.items.find(i => i.id === result.id)!;
      }).filter(Boolean);
    }
    
    this.selectedIndex = 0;
  }

  selectNext() {
    if (this.searchResults.length > 0) {
      this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
    }
  }

  selectPrevious() {
    if (this.searchResults.length > 0) {
      this.selectedIndex = (this.selectedIndex - 1 + this.searchResults.length) % this.searchResults.length;
    }
  }

  async clear() {
    // Keep pinned items
    this.items = this.items.filter(item => item.pinned);
    this.miniSearch.removeAll();
    this.miniSearch.addAll(this.items);
    await this.saveHistory();
    this.search();
  }
}

export const clipboardStore = new ClipboardStore();