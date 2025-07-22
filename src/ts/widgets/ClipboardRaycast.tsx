import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

// Simple time formatting utility
const formatDistanceToNow = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

interface ClipboardItem {
  id: string;
  text: string;
  type: 'text' | 'image' | 'file' | 'color';
  timestamp: number;
  application?: string;
  isPinned?: boolean;
}

const ClipboardWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock clipboard data - in real app this would come from the store
  const clipboardItems: ClipboardItem[] = store.clipboard?.clipboardItems || [
    {
      id: '1',
      text: 'https://github.com/hanzoai/hanzo',
      type: 'text',
      timestamp: Date.now() - 1000 * 60 * 5,
      application: 'Chrome',
    },
    {
      id: '2',
      text: 'npm install @hanzoai/core',
      type: 'text',
      timestamp: Date.now() - 1000 * 60 * 30,
      application: 'Terminal',
    },
    {
      id: '3',
      text: '#FF6363',
      type: 'color',
      timestamp: Date.now() - 1000 * 60 * 60,
      application: 'Figma',
    },
    {
      id: '4',
      text: 'The quick brown fox jumps over the lazy dog. This is a long piece of text that should be truncated in the list view but shown in full in the preview.',
      type: 'text',
      timestamp: Date.now() - 1000 * 60 * 120,
      application: 'Notes',
      isPinned: true,
    },
  ];

  const filteredItems = clipboardItems.filter(item =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handlePaste();
    } else if (e.metaKey && e.key === 'p') {
      e.preventDefault();
      handlePin();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!searchQuery && e.metaKey) {
        e.preventDefault();
        handleDelete();
      }
    }
  };

  const handlePaste = () => {
    const item = filteredItems[selectedIndex];
    if (item) {
      // Copy to clipboard
      navigator.clipboard.writeText(item.text);
      store.native?.showToast('Copied to clipboard', 'success');
      store.native?.hideWindow();
    }
  };

  const handlePin = () => {
    const item = filteredItems[selectedIndex];
    if (item) {
      item.isPinned = !item.isPinned;
      store.native?.showToast(item.isPinned ? 'Pinned' : 'Unpinned', 'success');
    }
  };

  const handleDelete = () => {
    const item = filteredItems[selectedIndex];
    if (item) {
      // Remove from clipboard history
      store.native?.showToast('Removed from history', 'success');
    }
  };

  const renderIcon = (item: ClipboardItem) => {
    if (item.type === 'color') {
      return (
        <div 
          className="w-8 h-8 rounded-md border border-[var(--hanzo-border)]"
          style={{ backgroundColor: item.text }}
        />
      );
    }

    const iconMap: Record<string, string> = {
      'Chrome': '🌐',
      'Terminal': '💻',
      'Figma': '🎨',
      'Notes': '📝',
    };

    return (
      <div className="w-8 h-8 rounded-md bg-[var(--hanzo-bg-tertiary)] flex items-center justify-center text-sm">
        {iconMap[item.application || ''] || '📋'}
      </div>
    );
  };

  return (
    <div className="hanzo-window" style={{ height: '500px' }}>
      {/* Search Input */}
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search clipboard history..."
          className="hanzo-search-input"
        />
      </div>

      {/* Results */}
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="w-1/2 border-r border-[var(--hanzo-border)] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="hanzo-empty" style={{ height: '100%' }}>
              <div className="hanzo-empty-icon">📋</div>
              <div className="hanzo-empty-title">No clipboard items</div>
              <div className="hanzo-empty-subtitle">Copy something to see it here</div>
            </div>
          ) : (
            <div className="p-2">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  className={clsx('hanzo-item', selectedIndex === index && 'selected')}
                  onClick={() => setSelectedIndex(index)}
                  onDoubleClick={handlePaste}
                >
                  {renderIcon(item)}
                  <div className="hanzo-item-content">
                    <div className="flex items-center gap-2">
                      {item.isPinned && <span className="text-xs">📌</span>}
                      <div className="hanzo-item-title">
                        {item.text.length > 50 ? item.text.substring(0, 50) + '...' : item.text}
                      </div>
                    </div>
                    <div className="hanzo-item-subtitle">
                      {item.application} • {formatDistanceToNow(item.timestamp)} ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 p-4">
          {filteredItems[selectedIndex] && (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--hanzo-text-secondary)] mb-2">Preview</h3>
                <div className="p-4 rounded-lg bg-[var(--hanzo-bg-secondary)] border border-[var(--hanzo-border)]">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {filteredItems[selectedIndex].text}
                  </pre>
                </div>
              </div>

              <div className="mt-auto">
                <div className="text-xs text-[var(--hanzo-text-tertiary)]">
                  <p>Application: {filteredItems[selectedIndex].application}</p>
                  <p>Copied: {formatDistanceToNow(filteredItems[selectedIndex].timestamp)} ago</p>
                  <p>Type: {filteredItems[selectedIndex].type}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="↵" size="small" /> Paste
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="P" size="small" /> Pin
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="⌫" size="small" /> Delete
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{filteredItems.length} items</span>
        </div>
      </div>
    </div>
  );
});

export { ClipboardWidget };