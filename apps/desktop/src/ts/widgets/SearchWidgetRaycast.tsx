import React, { useEffect, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Widget, Item, ItemType } from '@/stores/store';
import { createLogger } from '@/lib/logger';
import clsx from 'clsx';
import { FileIcon } from '@/components/FileIcon';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';

const logger = createLogger('SearchWidget');

interface GroupedItems {
  applications: Item[];
  aiCommands: Item[];
  commands: Item[];
  files: Item[];
  calculator: Item[];
}

const SearchWidget = observer(() => {
  const store = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus search input when widget is shown
    if (store.ui.focusedWidget === Widget.SEARCH) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [store.ui.focusedWidget]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      store.ui.executeSelected();
    }
  };

  // Group items by type
  const groupedItems = useMemo(() => {
    const groups: GroupedItems = {
      applications: [],
      aiCommands: [],
      commands: [],
      files: [],
      calculator: []
    };

    store.ui.items.forEach(item => {
      if (item.type === ItemType.TEMPORARY_RESULT) {
        groups.calculator.push(item);
      } else if (item.type === ItemType.APPLICATION) {
        groups.applications.push(item);
      } else if (item.name?.includes('AI') || item.name?.includes('Chat')) {
        groups.aiCommands.push(item);
      } else if (item.type === ItemType.FILE || item.type === ItemType.FOLDER) {
        groups.files.push(item);
      } else {
        groups.commands.push(item);
      }
    });

    return groups;
  }, [store.ui.items]);

  const renderItem = (item: Item, index: number, type: string) => {
    const isActive = index === store.ui.selectedIndex;

    // Calculator results
    if (item.type === ItemType.TEMPORARY_RESULT) {
      return (
        <div key={item.id} className="hanzo-calculator">
          <div className="hanzo-calculator-result">
            {store.ui.temporaryResult}
          </div>
          <div className="hanzo-calculator-expression">
            {store.ui.query}
          </div>
        </div>
      );
    }

    // Regular items
    return (
      <div
        key={item.id}
        className={clsx('hanzo-item', isActive && 'selected')}
        onClick={() => {
          store.ui.setSelectedIndex(index);
          store.ui.executeSelected();
        }}
        onMouseEnter={() => store.ui.setSelectedIndex(index)}
      >
        {/* Icon */}
        <div className={clsx('hanzo-item-icon', {
          'hanzo-ai-icon': type === 'aiCommands',
          'hanzo-app-icon': type === 'applications'
        })}>
          {item.icon ? (
            typeof item.icon === 'string' && (item.icon.startsWith('http') || item.icon.startsWith('/')) ? (
              <img src={item.icon} alt="" />
            ) : (
              <span>{item.icon}</span>
            )
          ) : item.IconComponent ? (
            <item.IconComponent />
          ) : (
            <FileIcon type={item.type} />
          )}
        </div>

        {/* Content */}
        <div className="hanzo-item-content">
          <div className="hanzo-item-title">{item.name}</div>
          {item.subName && (
            <div className="hanzo-item-subtitle">{item.subName}</div>
          )}
        </div>

        {/* Accessories */}
        <div className="hanzo-item-accessories">
          {type === 'aiCommands' && (
            <span className="hanzo-command-type">AI Command</span>
          )}
          {type === 'applications' && (
            <span className="hanzo-command-type">Application</span>
          )}
          {type === 'commands' && (
            <span className="hanzo-command-type">Command</span>
          )}
          {item.shortcut && (
            <div className="hanzo-item-shortcut">
              <Key k="⌘" size="small" />
              <Key k="K" size="small" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasResults = Object.values(groupedItems).some(group => group.length > 0);

  return (
    <div className="hanzo-window">
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
          value={store.ui.query}
          onChange={(e) => store.ui.setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for apps and commands..."
          className="hanzo-search-input"
        />
        <span className="hanzo-footer-hint" style={{ marginLeft: 'auto', opacity: 0.5 }}>
          <span style={{ marginRight: 8 }}>Ask AI</span>
          <Key k="Tab" size="small" />
        </span>
      </div>

      {/* Results */}
      <div className="hanzo-results">
        {!hasResults ? (
          <div className="hanzo-empty">
            <div className="hanzo-empty-icon">🔍</div>
            <div className="hanzo-empty-title">No results found</div>
            <div className="hanzo-empty-subtitle">Try a different search term</div>
          </div>
        ) : (
          <>
            {/* Calculator Result */}
            {groupedItems.calculator.map((item, i) => renderItem(item, i, 'calculator'))}

            {/* Applications */}
            {groupedItems.applications.length > 0 && (
              <div className="hanzo-group">
                <div className="hanzo-group-title">Applications</div>
                {groupedItems.applications.map((item, i) => 
                  renderItem(item, i, 'applications')
                )}
              </div>
            )}

            {/* AI Commands */}
            {groupedItems.aiCommands.length > 0 && (
              <div className="hanzo-group">
                <div className="hanzo-group-title">AI Commands</div>
                {groupedItems.aiCommands.map((item, i) => 
                  renderItem(item, i, 'aiCommands')
                )}
              </div>
            )}

            {/* Commands */}
            {groupedItems.commands.length > 0 && (
              <div className="hanzo-group">
                <div className="hanzo-group-title">Commands</div>
                {groupedItems.commands.map((item, i) => 
                  renderItem(item, i, 'commands')
                )}
              </div>
            )}

            {/* Files */}
            {groupedItems.files.length > 0 && (
              <div className="hanzo-group">
                <div className="hanzo-group-title">Files</div>
                {groupedItems.files.map((item, i) => 
                  renderItem(item, i, 'files')
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="↑" size="small" /> <Key k="↓" size="small" /> Navigate
          </span>
          <span className="hanzo-footer-hint">
            <Key k="↵" size="small" /> Open
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="↵" size="small" /> Actions
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{store.ui.items.length} results</span>
        </div>
      </div>
    </div>
  );
});

export { SearchWidget };