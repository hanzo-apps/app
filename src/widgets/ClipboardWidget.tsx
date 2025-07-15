import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { clipboardStore } from '@/stores/clipboard.store';
import { uiStore } from '@/stores/ui.store';
import { invoke } from '@tauri-apps/api/tauri';

const ClipboardWidget = observer(() => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelect = async (item: any) => {
    await clipboardStore.copyItem(item);
    await invoke('paste_to_frontmost_app');
    await invoke('hide_window');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (clipboardStore.searchQuery) {
        clipboardStore.setSearchQuery('');
      } else {
        uiStore.setWidget('search');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = clipboardStore.searchResults[clipboardStore.selectedIndex];
      if (selected) {
        handleSelect(selected);
      }
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="widget clipboard-widget">
      <div className="widget-header mb-4">
        <h2 className="text-2xl font-bold">Clipboard History</h2>
        <p className="text-sm text-text-secondary">
          {clipboardStore.items.length} items • ⌘D to delete • ⌘P to pin
        </p>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={clipboardStore.searchQuery}
        onChange={(e) => clipboardStore.setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search clipboard history..."
        className="search-input mb-4"
      />

      <div className="clipboard-items">
        {clipboardStore.searchResults.map((item, index) => (
          <div
            key={item.id}
            className={clsx(
              'clipboard-item',
              index === clipboardStore.selectedIndex && 'selected',
              item.pinned && 'pinned'
            )}
            onClick={() => handleSelect(item)}
            onMouseEnter={() => {
              clipboardStore.selectedIndex = index;
            }}
          >
            <div className="item-content">
              <div className="item-text truncate-2">
                {item.content}
              </div>
              <div className="item-meta">
                <span className="text-xs text-text-secondary">
                  {formatDate(item.timestamp)}
                </span>
                {item.pinned && (
                  <span className="text-xs text-accent ml-2">📌 Pinned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {clipboardStore.items.length === 0 && (
        <div className="empty-state">
          <p className="text-text-secondary">
            No clipboard history yet. Copy something to get started!
          </p>
        </div>
      )}
    </div>
  );
});

export default ClipboardWidget;