import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface Snippet {
  id: string;
  name: string;
  keyword: string;
  content: string;
  description?: string;
  category?: string;
  usageCount: number;
  lastUsed?: Date;
}

const SnippetsWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock snippets data - in real app this would come from the store
  const [snippets, setSnippets] = useState<Snippet[]>([
    {
      id: '1',
      name: 'Email Signature',
      keyword: 'sig',
      content: 'Best regards,\n\nJohn Doe\nSenior Developer\nHanzo AI\njohn@hanzo.ai',
      category: 'Email',
      usageCount: 42,
      lastUsed: new Date(),
    },
    {
      id: '2',
      name: 'Meeting Link',
      keyword: 'meet',
      content: 'https://meet.google.com/abc-defg-hij',
      category: 'Links',
      usageCount: 15,
    },
    {
      id: '3',
      name: 'Code Review Template',
      keyword: 'review',
      content: '## Code Review\n\n### Summary\n- \n\n### Changes\n- \n\n### Testing\n- [ ] Unit tests pass\n- [ ] Manual testing completed\n\n### Notes\n',
      category: 'Development',
      usageCount: 8,
    },
    {
      id: '4',
      name: 'Support Response',
      keyword: 'support',
      content: 'Thank you for reaching out. I understand your concern and I\'m here to help.\n\n[Your response here]\n\nPlease let me know if you need any further assistance.',
      category: 'Support',
      usageCount: 23,
    },
  ]);

  const filteredSnippets = snippets.filter(snippet =>
    snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredSnippets.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleInsert();
    } else if (e.metaKey && e.key === 'n') {
      e.preventDefault();
      handleNewSnippet();
    } else if (e.metaKey && e.key === 'e') {
      e.preventDefault();
      handleEditSnippet();
    } else if (e.key === 'Delete' && e.metaKey) {
      e.preventDefault();
      handleDeleteSnippet();
    }
  };

  const handleInsert = () => {
    const snippet = filteredSnippets[selectedIndex];
    if (snippet) {
      // Copy to clipboard and track usage
      navigator.clipboard.writeText(snippet.content);
      snippet.usageCount++;
      snippet.lastUsed = new Date();
      store.native?.showToast(`Inserted "${snippet.name}"`, 'success');
      store.native?.hideWindow();
    }
  };

  const handleNewSnippet = () => {
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      name: 'New Snippet',
      keyword: 'new',
      content: '',
      usageCount: 0,
    };
    setEditingSnippet(newSnippet);
    setIsEditing(true);
  };

  const handleEditSnippet = () => {
    const snippet = filteredSnippets[selectedIndex];
    if (snippet) {
      setEditingSnippet({ ...snippet });
      setIsEditing(true);
    }
  };

  const handleDeleteSnippet = () => {
    const snippet = filteredSnippets[selectedIndex];
    if (snippet) {
      setSnippets(snippets.filter(s => s.id !== snippet.id));
      store.native?.showToast(`Deleted "${snippet.name}"`, 'success');
    }
  };

  const handleSaveSnippet = () => {
    if (editingSnippet) {
      const index = snippets.findIndex(s => s.id === editingSnippet.id);
      if (index >= 0) {
        snippets[index] = editingSnippet;
      } else {
        snippets.push(editingSnippet);
      }
      setSnippets([...snippets]);
      setIsEditing(false);
      setEditingSnippet(null);
      store.native?.showToast('Snippet saved', 'success');
    }
  };

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      'Email': '✉️',
      'Links': '🔗',
      'Development': '💻',
      'Support': '🤝',
      'Personal': '👤',
    };
    return icons[category || ''] || '📝';
  };

  if (isEditing && editingSnippet) {
    return (
      <div className="hanzo-window" style={{ height: '500px' }}>
        <div className="hanzo-search">
          <img 
            src={Assets.HanzoWhiteSmall} 
            alt="Hanzo" 
            className="hanzo-search-icon"
            style={{ width: 24, height: 24, marginRight: 8 }}
          />
          <h2 className="text-lg font-semibold">
            {editingSnippet.id === Date.now().toString() ? 'New Snippet' : 'Edit Snippet'}
          </h2>
        </div>

        <div className="p-6">
          <div className="hanzo-form">
            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Name</label>
              <input
                type="text"
                value={editingSnippet.name}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, name: e.target.value })}
                className="hanzo-form-input"
                placeholder="Snippet name"
              />
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Keyword</label>
              <input
                type="text"
                value={editingSnippet.keyword}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, keyword: e.target.value })}
                className="hanzo-form-input"
                placeholder="Shortcut keyword"
              />
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Category</label>
              <select
                value={editingSnippet.category || ''}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, category: e.target.value })}
                className="hanzo-form-input"
              >
                <option value="">Select category</option>
                <option value="Email">Email</option>
                <option value="Links">Links</option>
                <option value="Development">Development</option>
                <option value="Support">Support</option>
                <option value="Personal">Personal</option>
              </select>
            </div>

            <div className="hanzo-form-group">
              <label className="hanzo-form-label">Content</label>
              <textarea
                value={editingSnippet.content}
                onChange={(e) => setEditingSnippet({ ...editingSnippet, content: e.target.value })}
                className="hanzo-form-input"
                rows={8}
                placeholder="Snippet content..."
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={handleSaveSnippet} className="hanzo-button">
                Save Snippet
              </button>
              <button onClick={() => setIsEditing(false)} className="hanzo-button secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          placeholder="Search snippets..."
          className="hanzo-search-input"
        />
      </div>

      {/* Results */}
      <div className="hanzo-results">
        {filteredSnippets.length === 0 ? (
          <div className="hanzo-empty">
            <div className="hanzo-empty-icon">✂️</div>
            <div className="hanzo-empty-title">No snippets found</div>
            <div className="hanzo-empty-subtitle">Press ⌘N to create a new snippet</div>
          </div>
        ) : (
          <div className="p-2">
            {filteredSnippets.map((snippet, index) => (
              <div
                key={snippet.id}
                className={clsx('hanzo-item', selectedIndex === index && 'selected')}
                onClick={() => setSelectedIndex(index)}
                onDoubleClick={handleInsert}
              >
                <div className="hanzo-item-icon">
                  <span className="text-2xl">{getCategoryIcon(snippet.category)}</span>
                </div>
                <div className="hanzo-item-content">
                  <div className="hanzo-item-title">{snippet.name}</div>
                  <div className="hanzo-item-subtitle">
                    {snippet.keyword} • {snippet.content.substring(0, 50)}...
                  </div>
                </div>
                <div className="hanzo-item-accessories">
                  <span className="hanzo-item-badge">{snippet.usageCount} uses</span>
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
            <Key k="↵" size="small" /> Insert
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="N" size="small" /> New
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="E" size="small" /> Edit
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="⌫" size="small" /> Delete
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{filteredSnippets.length} snippets</span>
        </div>
      </div>
    </div>
  );
});

export { SnippetsWidget };