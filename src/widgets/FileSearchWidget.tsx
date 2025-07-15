import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { invoke } from '@tauri-apps/api/tauri';
import { uiStore } from '@/stores/ui.store';

interface FileResult {
  path: string;
  name: string;
  size: number;
  modified: string;
}

const FileSearchWidget = observer(() => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const files = await invoke<FileResult[]>('search_files', { query });
      setResults(files);
    } catch (error) {
      console.error('File search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileClick = async (file: FileResult) => {
    await invoke('open_file', { path: file.path });
    await invoke('hide_window');
  };

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="widget file-search-widget">
      <div className="widget-header mb-4">
        <h2 className="text-2xl font-bold">File Search</h2>
        <p className="text-sm text-text-secondary">
          Search your files • ESC to go back
        </p>
      </div>

      <form onSubmit={handleSearch} className="search-form mb-4">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for files..."
          className="search-input"
          disabled={isSearching}
        />
      </form>

      {isSearching && (
        <div className="searching-indicator">
          <p className="text-text-secondary">Searching...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="file-results">
          {results.map((file, index) => (
            <div
              key={index}
              className="file-item result-item"
              onClick={() => handleFileClick(file)}
            >
              <div className="file-icon text-2xl mr-3">📄</div>
              <div className="file-content">
                <div className="file-name">{file.name}</div>
                <div className="file-path text-xs text-text-secondary">
                  {file.path}
                </div>
              </div>
              <div className="file-size text-xs text-text-secondary">
                {formatSize(file.size)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default FileSearchWidget;