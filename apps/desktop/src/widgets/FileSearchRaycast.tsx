import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';
import { searchService } from '@/services/search.service';

interface FileResult {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  size?: number;
  modified?: Date;
}

const FileSearchWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<FileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchService.searchFiles(searchQuery);
        setSearchResults(results.map(r => ({
          id: r.id,
          name: r.title,
          path: r.subtitle,
          type: r.metadata?.isDirectory ? 'folder' : 'file',
          extension: r.metadata?.extension,
          size: r.metadata?.size,
          modified: r.metadata?.modified ? new Date(r.metadata.modified) : undefined,
        })));
      } catch (error) {
        console.error('File search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleOpen();
    } else if (e.metaKey && e.key === 'Enter') {
      e.preventDefault();
      handleRevealInFinder();
    } else if (e.key === ' ' && !searchQuery) {
      e.preventDefault();
      handleQuickLook();
    }
  };

  const handleOpen = async () => {
    const file = searchResults[selectedIndex];
    if (file) {
      await searchService.executeAction({
        id: file.id,
        title: file.name,
        subtitle: file.path,
        action: { type: 'OpenFile', data: { path: file.path } },
        score: 100,
      });
    }
  };

  const handleRevealInFinder = async () => {
    const file = searchResults[selectedIndex];
    if (file) {
      await store.native?.executeAppleScript(
        `tell application "Finder" to reveal POSIX file "${file.path}"`
      );
      await store.native?.executeAppleScript(
        `tell application "Finder" to activate`
      );
    }
  };

  const handleQuickLook = async () => {
    const file = searchResults[selectedIndex];
    if (file) {
      await store.native?.executeAppleScript(
        `do shell script "qlmanage -p '${file.path}' >& /dev/null"`
      );
    }
  };

  const getFileIcon = (file: FileResult) => {
    if (file.type === 'folder') {
      return '📁';
    }

    const extensionIcons: Record<string, string> = {
      'js': '📜',
      'ts': '📘',
      'jsx': '⚛️',
      'tsx': '⚛️',
      'json': '📋',
      'md': '📝',
      'txt': '📄',
      'pdf': '📕',
      'png': '🖼️',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'gif': '🖼️',
      'svg': '🎨',
      'mp4': '🎬',
      'mp3': '🎵',
      'zip': '📦',
      'dmg': '💿',
      'app': '🚀',
    };

    return extensionIcons[file.extension?.toLowerCase() || ''] || '📄';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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
          placeholder="Search for files and folders..."
          className="hanzo-search-input"
        />
      </div>

      {/* Results */}
      <div className="hanzo-results">
        {isSearching ? (
          <div className="hanzo-loading">
            <div className="hanzo-spinner" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="hanzo-empty">
            <div className="hanzo-empty-icon">🔍</div>
            <div className="hanzo-empty-title">
              {searchQuery ? 'No files found' : 'Start typing to search'}
            </div>
            <div className="hanzo-empty-subtitle">
              {searchQuery ? 'Try a different search term' : 'Search your entire Mac'}
            </div>
          </div>
        ) : (
          <div className="p-2">
            {searchResults.map((file, index) => (
              <div
                key={file.id}
                className={clsx('hanzo-item', selectedIndex === index && 'selected')}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={handleOpen}
              >
                <div className="hanzo-item-icon">
                  <span className="text-2xl">{getFileIcon(file)}</span>
                </div>
                <div className="hanzo-item-content">
                  <div className="hanzo-item-title">{file.name}</div>
                  <div className="hanzo-item-subtitle">{file.path}</div>
                </div>
                <div className="hanzo-item-accessories">
                  {file.size && (
                    <span className="hanzo-item-badge">{formatFileSize(file.size)}</span>
                  )}
                  <span className="hanzo-command-type">{file.type}</span>
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
            <Key k="⌘" size="small" /> <Key k="↵" size="small" /> Reveal in Finder
          </span>
          <span className="hanzo-footer-hint">
            <Key k="Space" size="small" /> Quick Look
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{searchResults.length} results</span>
        </div>
      </div>
    </div>
  );
});

export { FileSearchWidget };