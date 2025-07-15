import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { uiStore } from '@/stores/ui.store';
import { invoke } from '@tauri-apps/api/tauri';
import clsx from 'clsx';

const SearchWidget = observer(() => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uiStore.executeSelected();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'app':
        return '🚀';
      case 'bookmark':
        return '🔖';
      case 'file':
        return '📄';
      case 'command':
        return '⚡';
      default:
        return '📦';
    }
  };

  return (
    <div className="widget search-widget">
      <form onSubmit={handleSubmit} className="search-form">
        <input
          ref={inputRef}
          type="text"
          value={uiStore.searchQuery}
          onChange={(e) => uiStore.setSearchQuery(e.target.value)}
          placeholder="Search apps, files, commands..."
          className="search-input text-xl"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </form>

      {uiStore.searchResults.length > 0 && (
        <div className="results mt-4">
          {uiStore.searchResults.map((result, index) => (
            <div
              key={result.id}
              className={clsx(
                'result-item',
                index === uiStore.selectedIndex && 'selected'
              )}
              onClick={() => {
                uiStore.selectedIndex = index;
                uiStore.executeSelected();
              }}
              onMouseEnter={() => {
                uiStore.selectedIndex = index;
              }}
            >
              <span className="result-icon text-2xl mr-3">
                {result.icon || getIcon(result.type)}
              </span>
              <div className="result-content">
                <div className="result-title">{result.name}</div>
                {result.path && (
                  <div className="result-subtitle">{result.path}</div>
                )}
              </div>
              {result.frequency > 0 && (
                <div className="result-frequency text-xs text-text-secondary">
                  {result.frequency}x
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="widget-footer">
        <span className="text-xs text-text-secondary">
          Tab → AI • ⌘K → Clipboard • ⌘E → Emoji
        </span>
      </div>
    </div>
  );
});

export default SearchWidget;