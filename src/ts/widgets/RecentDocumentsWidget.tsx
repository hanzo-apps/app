import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface RecentDocument {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  modified: Date;
  opened: Date;
  application: string;
  icon: string;
}

const RecentDocumentsWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'pinned'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock recent documents
  const [documents] = useState<RecentDocument[]>([
    {
      id: '1',
      name: 'Project Proposal.docx',
      path: '/Users/john/Documents/Work/Project Proposal.docx',
      type: 'docx',
      size: 245000,
      modified: new Date(Date.now() - 3600000),
      opened: new Date(Date.now() - 1800000),
      application: 'Microsoft Word',
      icon: '📄',
    },
    {
      id: '2',
      name: 'Budget_2024.xlsx',
      path: '/Users/john/Documents/Finance/Budget_2024.xlsx',
      type: 'xlsx',
      size: 1024000,
      modified: new Date(Date.now() - 7200000),
      opened: new Date(Date.now() - 3600000),
      application: 'Microsoft Excel',
      icon: '📊',
    },
    {
      id: '3',
      name: 'presentation.key',
      path: '/Users/john/Desktop/presentation.key',
      type: 'key',
      size: 5120000,
      modified: new Date(Date.now() - 86400000),
      opened: new Date(Date.now() - 7200000),
      application: 'Keynote',
      icon: '🎯',
    },
    {
      id: '4',
      name: 'design_mockup.fig',
      path: '/Users/john/Projects/UI/design_mockup.fig',
      type: 'fig',
      size: 2048000,
      modified: new Date(Date.now() - 172800000),
      opened: new Date(Date.now() - 86400000),
      application: 'Figma',
      icon: '🎨',
    },
    {
      id: '5',
      name: 'README.md',
      path: '/Users/john/Projects/hanzo/README.md',
      type: 'md',
      size: 12000,
      modified: new Date(Date.now() - 3600000),
      opened: new Date(Date.now() - 1800000),
      application: 'VS Code',
      icon: '📝',
    },
    {
      id: '6',
      name: 'screenshot.png',
      path: '/Users/john/Desktop/screenshot.png',
      type: 'png',
      size: 450000,
      modified: new Date(Date.now() - 10800000),
      opened: new Date(Date.now() - 10800000),
      application: 'Preview',
      icon: '🖼️',
    },
    {
      id: '7',
      name: 'meeting_notes.txt',
      path: '/Users/john/Documents/Notes/meeting_notes.txt',
      type: 'txt',
      size: 5000,
      modified: new Date(Date.now() - 21600000),
      opened: new Date(Date.now() - 14400000),
      application: 'TextEdit',
      icon: '📋',
    },
    {
      id: '8',
      name: 'index.html',
      path: '/Users/john/Projects/website/index.html',
      type: 'html',
      size: 25000,
      modified: new Date(Date.now() - 259200000),
      opened: new Date(Date.now() - 172800000),
      application: 'Chrome',
      icon: '🌐',
    },
  ]);

  const [pinnedDocs, setPinnedDocs] = useState<Set<string>>(new Set(['1', '5']));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFilteredDocuments = () => {
    let filtered = documents;

    // Apply time filter
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(doc => doc.opened >= today);
    } else if (filter === 'week') {
      const weekAgo = new Date(Date.now() - 604800000);
      filtered = filtered.filter(doc => doc.opened >= weekAgo);
    } else if (filter === 'pinned') {
      filtered = filtered.filter(doc => pinnedDocs.has(doc.id));
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.application.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by opened date (most recent first)
    return filtered.sort((a, b) => b.opened.getTime() - a.opened.getTime());
  };

  const filteredDocuments = getFilteredDocuments();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredDocuments.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleOpen();
    } else if (e.metaKey && e.key === 'Enter') {
      e.preventDefault();
      handleRevealInFinder();
    } else if (e.metaKey && e.key === 'p') {
      e.preventDefault();
      handleTogglePin();
    } else if (e.key === ' ' && !searchQuery) {
      e.preventDefault();
      handleQuickLook();
    }
  };

  const handleOpen = () => {
    const doc = filteredDocuments[selectedIndex];
    if (doc) {
      store.native?.open(doc.path);
      store.native?.showToast(`Opening ${doc.name}`, 'success');
    }
  };

  const handleRevealInFinder = () => {
    const doc = filteredDocuments[selectedIndex];
    if (doc) {
      store.native?.executeAppleScript(
        `tell application "Finder" to reveal POSIX file "${doc.path}"`
      );
      store.native?.executeAppleScript(
        `tell application "Finder" to activate`
      );
    }
  };

  const handleQuickLook = () => {
    const doc = filteredDocuments[selectedIndex];
    if (doc) {
      store.native?.executeAppleScript(
        `do shell script "qlmanage -p '${doc.path}' >& /dev/null"`
      );
    }
  };

  const handleTogglePin = () => {
    const doc = filteredDocuments[selectedIndex];
    if (doc) {
      const newPinned = new Set(pinnedDocs);
      if (newPinned.has(doc.id)) {
        newPinned.delete(doc.id);
        store.native?.showToast('Unpinned', 'success');
      } else {
        newPinned.add(doc.id);
        store.native?.showToast('Pinned', 'success');
      }
      setPinnedDocs(newPinned);
    }
  };

  return (
    <div className="hanzo-window" style={{ height: '500px' }}>
      {/* Header with Search */}
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
          placeholder="Search recent documents..."
          className="hanzo-search-input"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[var(--hanzo-border)]">
        {(['all', 'today', 'week', 'pinned'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={clsx(
              'flex-1 py-2 text-sm capitalize transition-colors',
              filter === filterOption
                ? 'text-[var(--hanzo-text)] border-b-2 border-[var(--hanzo-accent)]'
                : 'text-[var(--hanzo-text-secondary)] hover:text-[var(--hanzo-text)]'
            )}
          >
            {filterOption}
            {filterOption === 'pinned' && pinnedDocs.size > 0 && (
              <span className="ml-1 text-xs">({pinnedDocs.size})</span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="hanzo-results">
        {filteredDocuments.length === 0 ? (
          <div className="hanzo-empty">
            <div className="hanzo-empty-icon">📄</div>
            <div className="hanzo-empty-title">No documents found</div>
            <div className="hanzo-empty-subtitle">
              {filter === 'pinned' ? 'No pinned documents' : 'Try a different search'}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {filteredDocuments.map((doc, index) => (
              <div
                key={doc.id}
                className={clsx('hanzo-item', selectedIndex === index && 'selected')}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={handleOpen}
              >
                <div className="hanzo-item-icon">
                  <span className="text-2xl">{doc.icon}</span>
                </div>
                <div className="hanzo-item-content">
                  <div className="hanzo-item-title flex items-center gap-2">
                    {doc.name}
                    {pinnedDocs.has(doc.id) && <span className="text-xs">📌</span>}
                  </div>
                  <div className="hanzo-item-subtitle">
                    {doc.application} • {formatFileSize(doc.size)} • {formatTime(doc.opened)}
                  </div>
                  <div className="text-xs text-[var(--hanzo-text-tertiary)] truncate">
                    {doc.path}
                  </div>
                </div>
                <div className="hanzo-item-accessories">
                  <span className="hanzo-command-type">{doc.type.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="↵" size="small" /> Open
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="↵" size="small" /> Reveal
          </span>
          <span className="hanzo-footer-hint">
            <Key k="Space" size="small" /> Preview
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="P" size="small" /> Pin
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{filteredDocuments.length} documents</span>
        </div>
      </div>
    </div>
  );
});

export { RecentDocumentsWidget };