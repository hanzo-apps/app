import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface BufferedFile {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  addedAt: Date;
  tags: string[];
  notes?: string;
}

const FileBufferWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock buffered files
  const [bufferedFiles, setBufferedFiles] = useState<BufferedFile[]>([
    {
      id: '1',
      name: 'logo.png',
      path: '/Users/john/Downloads/logo.png',
      type: 'image/png',
      size: 45000,
      addedAt: new Date(Date.now() - 3600000),
      tags: ['design', 'branding'],
      notes: 'Company logo - final version',
    },
    {
      id: '2',
      name: 'report_draft.pdf',
      path: '/Users/john/Documents/report_draft.pdf',
      type: 'application/pdf',
      size: 1024000,
      addedAt: new Date(Date.now() - 7200000),
      tags: ['work', 'draft'],
    },
    {
      id: '3',
      name: 'data.csv',
      path: '/Users/john/Desktop/data.csv',
      type: 'text/csv',
      size: 250000,
      addedAt: new Date(Date.now() - 86400000),
      tags: ['data', 'analysis'],
      notes: 'Q4 sales data for analysis',
    },
    {
      id: '4',
      name: 'screenshot.jpg',
      path: '/Users/john/Desktop/screenshot.jpg',
      type: 'image/jpeg',
      size: 180000,
      addedAt: new Date(Date.now() - 172800000),
      tags: ['reference'],
    },
  ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredFiles = bufferedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (file.notes && file.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isAddingNote) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredFiles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAction();
    } else if (e.metaKey && e.key === 'a') {
      e.preventDefault();
      handleSelectAll();
    } else if (e.key === ' ' && !searchQuery) {
      e.preventDefault();
      handleToggleSelect();
    } else if (e.metaKey && e.key === 'c') {
      e.preventDefault();
      handleCopy();
    } else if (e.metaKey && e.key === 'v') {
      e.preventDefault();
      handlePaste();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!searchQuery && e.metaKey) {
        e.preventDefault();
        handleRemove();
      }
    } else if (e.metaKey && e.key === 'n') {
      e.preventDefault();
      setIsAddingNote(true);
    }
  };

  const handleAction = () => {
    const file = filteredFiles[selectedIndex];
    if (file) {
      // Create action based on file type
      if (file.type.startsWith('image/')) {
        store.native?.showToast('Opening in Preview', 'success');
      } else if (file.type === 'application/pdf') {
        store.native?.showToast('Opening PDF', 'success');
      } else {
        store.native?.showToast(`Opening ${file.name}`, 'success');
      }
      store.native?.open(file.path);
    }
  };

  const handleToggleSelect = () => {
    const file = filteredFiles[selectedIndex];
    if (file) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
      setSelectedFiles(newSelected);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const handleCopy = () => {
    const count = selectedFiles.size || 1;
    store.native?.showToast(`Copied ${count} file${count > 1 ? 's' : ''} to clipboard`, 'success');
  };

  const handlePaste = () => {
    store.native?.showToast('Pasted files from clipboard', 'success');
    // In real implementation, would add files from clipboard
  };

  const handleRemove = () => {
    if (selectedFiles.size > 0) {
      setBufferedFiles(bufferedFiles.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
      store.native?.showToast(`Removed ${selectedFiles.size} files`, 'success');
    } else {
      const file = filteredFiles[selectedIndex];
      if (file) {
        setBufferedFiles(bufferedFiles.filter(f => f.id !== file.id));
        store.native?.showToast('File removed from buffer', 'success');
      }
    }
  };

  const handleAddNote = () => {
    const file = filteredFiles[selectedIndex];
    if (file && noteText) {
      file.notes = noteText;
      setBufferedFiles([...bufferedFiles]);
      setIsAddingNote(false);
      setNoteText('');
      store.native?.showToast('Note added', 'success');
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📕';
    if (type === 'text/csv') return '📊';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    return '📄';
  };

  const renderGridView = () => (
    <div className="grid grid-cols-4 gap-4 p-4">
      {filteredFiles.map((file, index) => (
        <div
          key={file.id}
          className={clsx(
            'p-4 rounded-lg border-2 cursor-pointer transition-all',
            selectedIndex === index
              ? 'border-[var(--hanzo-accent)] bg-[var(--hanzo-selection)]'
              : 'border-[var(--hanzo-border)] hover:border-[var(--hanzo-text-tertiary)]',
            selectedFiles.has(file.id) && 'ring-2 ring-[var(--hanzo-accent)]'
          )}
          onClick={() => setSelectedIndex(index)}
          onDoubleClick={handleAction}
        >
          <div className="text-4xl mb-2 text-center">{getFileIcon(file.type)}</div>
          <div className="text-sm font-medium truncate">{file.name}</div>
          <div className="text-xs text-[var(--hanzo-text-tertiary)]">{formatFileSize(file.size)}</div>
          {file.notes && (
            <div className="mt-2 text-xs text-[var(--hanzo-text-secondary)] truncate">
              {file.notes}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {file.tags.map(tag => (
              <span key={tag} className="text-xs px-1 py-0.5 rounded bg-[var(--hanzo-bg-tertiary)]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="p-2">
      {filteredFiles.map((file, index) => (
        <div
          key={file.id}
          className={clsx(
            'hanzo-item',
            selectedIndex === index && 'selected',
            selectedFiles.has(file.id) && 'ring-1 ring-[var(--hanzo-accent)]'
          )}
          onClick={() => setSelectedIndex(index)}
          onDoubleClick={handleAction}
        >
          <input
            type="checkbox"
            checked={selectedFiles.has(file.id)}
            onChange={() => handleToggleSelect()}
            className="mr-3"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="hanzo-item-icon">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
          </div>
          <div className="hanzo-item-content">
            <div className="hanzo-item-title">{file.name}</div>
            <div className="hanzo-item-subtitle">
              {formatFileSize(file.size)} • {file.tags.join(', ')}
              {file.notes && ' • ' + file.notes}
            </div>
          </div>
          <div className="hanzo-item-accessories">
            <span className="text-xs text-[var(--hanzo-text-tertiary)]">
              {new Date(file.addedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  if (isAddingNote) {
    const file = filteredFiles[selectedIndex];
    return (
      <div className="hanzo-window" style={{ height: '300px' }}>
        <div className="hanzo-search">
          <img 
            src={Assets.HanzoWhiteSmall} 
            alt="Hanzo" 
            className="hanzo-search-icon"
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          <h2 className="text-lg font-semibold">Add Note to {file?.name}</h2>
        </div>
        <div className="p-6">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note about this file..."
            className="w-full p-3 bg-[var(--hanzo-bg-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hanzo-accent)]"
            rows={4}
            autoFocus
          />
          <div className="mt-4 flex gap-2">
            <button onClick={handleAddNote} className="hanzo-button">Save Note</button>
            <button onClick={() => setIsAddingNote(false)} className="hanzo-button secondary">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hanzo-window" style={{ height: '500px' }}>
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
          placeholder="Search buffered files..."
          className="hanzo-search-input"
        />
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setActiveView('list')}
            className={clsx(
              'p-1 rounded',
              activeView === 'list' ? 'text-[var(--hanzo-accent)]' : 'text-[var(--hanzo-text-tertiary)]'
            )}
          >
            ☰
          </button>
          <button
            onClick={() => setActiveView('grid')}
            className={clsx(
              'p-1 rounded',
              activeView === 'grid' ? 'text-[var(--hanzo-accent)]' : 'text-[var(--hanzo-text-tertiary)]'
            )}
          >
            ⊞
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredFiles.length === 0 ? (
          <div className="hanzo-empty">
            <div className="hanzo-empty-icon">📁</div>
            <div className="hanzo-empty-title">No files in buffer</div>
            <div className="hanzo-empty-subtitle">Drag files here or use ⌘V to add</div>
          </div>
        ) : activeView === 'grid' ? (
          renderGridView()
        ) : (
          renderListView()
        )}
      </div>

      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="↵" size="small" /> Open
          </span>
          <span className="hanzo-footer-hint">
            <Key k="Space" size="small" /> Select
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="C" size="small" /> Copy
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="N" size="small" /> Note
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="⌫" size="small" /> Remove
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{filteredFiles.length} files</span>
          {selectedFiles.size > 0 && <span> • {selectedFiles.size} selected</span>}
        </div>
      </div>
    </div>
  );
});

export { FileBufferWidget };