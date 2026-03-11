import { makeAutoObservable } from 'mobx';
import MiniSearch from 'minisearch';
import { nanoid } from 'nanoid';
import { storage, getStoredData, setStoredData } from '../utils/storage';
import { invoke } from '@tauri-apps/api/core';

export interface AppItem {
  id: string;
  name: string;
  type: 'app' | 'bookmark' | 'custom' | 'file' | 'command';
  path?: string;
  url?: string;
  icon?: string;
  frequency: number;
  lastUsed?: Date;
  keywords?: string[];
}

export type WidgetType = 
  | 'search'
  | 'ai'
  | 'calendar'
  | 'clipboard'
  | 'emoji'
  | 'fileSearch'
  | 'processes'
  | 'scratchpad'
  | 'translation'
  | 'settings'
  | 'createItem'
  | 'onboarding';

class UIStore {
  currentWidget: WidgetType = 'search';
  searchQuery = '';
  selectedIndex = 0;
  isVisible = true;
  items: AppItem[] = [];
  searchResults: AppItem[] = [];
  miniSearch: MiniSearch<AppItem>;
  history: string[] = [];
  historyIndex = -1;

  constructor() {
    makeAutoObservable(this);
    
    // Initialize MiniSearch
    this.miniSearch = new MiniSearch({
      fields: ['name', 'keywords'],
      storeFields: ['id', 'name', 'type', 'path', 'url', 'icon', 'frequency'],
      searchOptions: {
        boost: { name: 2 },
        fuzzy: 0.2,
        prefix: true
      }
    });

    this.loadData();
  }

  async loadData() {
    // Load saved items
    const savedItems = await getStoredData<AppItem[]>('items', []);
    this.items = savedItems;
    
    // Load system apps
    try {
      const apps = await invoke<any[]>('get_apps');
      const appItems: AppItem[] = apps.map(app => ({
        id: app.id,
        name: app.name,
        type: 'app' as const,
        path: app.path,
        icon: app.icon,
        frequency: 0,
        keywords: [app.name.toLowerCase()]
      }));
      this.items = [...this.items, ...appItems];
    } catch (error) {
      console.error('Failed to load apps:', error);
    }

    // Index all items
    this.miniSearch.removeAll();
    this.miniSearch.addAll(this.items);

    // Load history
    this.history = await getStoredData<string[]>('searchHistory', []);
  }

  setWidget(widget: WidgetType) {
    this.currentWidget = widget;
    this.selectedIndex = 0;
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.search();
  }

  search() {
    if (!this.searchQuery.trim()) {
      // Show frequently used items
      this.searchResults = this.items
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 10);
      return;
    }

    // Search with MiniSearch
    const results = this.miniSearch.search(this.searchQuery);
    this.searchResults = results.map(result => {
      const item = this.items.find(i => i.id === result.id);
      return item!;
    }).filter(Boolean);
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

  async executeSelected() {
    const selected = this.searchResults[this.selectedIndex];
    if (!selected) return;

    // Update frequency
    selected.frequency += 1;
    selected.lastUsed = new Date();
    await this.saveItems();

    // Add to history
    this.history.unshift(this.searchQuery);
    this.history = this.history.slice(0, 100); // Keep last 100
    await setStoredData('searchHistory', this.history);

    // Execute based on type
    switch (selected.type) {
      case 'app':
        await invoke('launch_app', { appId: selected.id });
        break;
      case 'bookmark':
        await invoke('open_url', { url: selected.url });
        break;
      case 'command':
        await invoke('execute_command', { command: selected.id });
        break;
      case 'file':
        await invoke('open_file', { path: selected.path });
        break;
    }

    // Hide window
    await invoke('hide_window');
  }

  async addCustomItem(item: Omit<AppItem, 'id' | 'frequency'>) {
    const newItem: AppItem = {
      ...item,
      id: nanoid(),
      frequency: 0
    };
    
    this.items.push(newItem);
    this.miniSearch.add(newItem);
    await this.saveItems();
  }

  async removeItem(id: string) {
    this.items = this.items.filter(item => item.id !== id);
    this.miniSearch.remove({ id });
    await this.saveItems();
  }

  private async saveItems() {
    const customItems = this.items.filter(item => item.type === 'custom');
    await setStoredData('items', customItems);
  }

  navigateHistory(direction: 'up' | 'down') {
    if (direction === 'up' && this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.searchQuery = this.history[this.historyIndex] || '';
    } else if (direction === 'down' && this.historyIndex > -1) {
      this.historyIndex--;
      this.searchQuery = this.historyIndex >= 0 ? this.history[this.historyIndex] : '';
    }
    this.search();
  }

  reset() {
    this.searchQuery = '';
    this.selectedIndex = 0;
    this.historyIndex = -1;
    this.search();
  }
}

export const uiStore = new UIStore();