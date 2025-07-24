import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  avatar?: string;
  isFavorite: boolean;
  lastContacted?: Date;
  tags: string[];
  notes?: string;
}

const ContactsWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'recent'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock contacts
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      role: 'CEO',
      avatar: '👨‍💼',
      isFavorite: true,
      lastContacted: new Date(Date.now() - 86400000),
      tags: ['client', 'vip'],
      notes: 'Prefers morning meetings',
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@techstartup.io',
      phone: '+1 (555) 234-5678',
      company: 'Tech Startup',
      role: 'CTO',
      avatar: '👩‍💻',
      isFavorite: true,
      lastContacted: new Date(Date.now() - 172800000),
      tags: ['partner', 'tech'],
    },
    {
      id: '3',
      name: 'Michael Chen',
      email: 'mchen@designstudio.com',
      phone: '+1 (555) 345-6789',
      company: 'Design Studio',
      role: 'Creative Director',
      avatar: '🎨',
      isFavorite: false,
      lastContacted: new Date(Date.now() - 604800000),
      tags: ['designer', 'contractor'],
    },
    {
      id: '4',
      name: 'Emily Davis',
      email: 'emily.davis@lawfirm.com',
      phone: '+1 (555) 456-7890',
      company: 'Davis & Associates',
      role: 'Partner',
      avatar: '⚖️',
      isFavorite: false,
      tags: ['legal', 'advisor'],
    },
    {
      id: '5',
      name: 'Alex Thompson',
      email: 'alex@freelance.dev',
      phone: '+1 (555) 567-8901',
      role: 'Freelance Developer',
      avatar: '💻',
      isFavorite: false,
      lastContacted: new Date(Date.now() - 259200000),
      tags: ['developer', 'freelance'],
    },
    {
      id: '6',
      name: 'Lisa Wang',
      email: 'lisa.wang@marketing.co',
      phone: '+1 (555) 678-9012',
      company: 'Marketing Co',
      role: 'Marketing Manager',
      avatar: '📱',
      isFavorite: true,
      lastContacted: new Date(Date.now() - 3600000),
      tags: ['marketing', 'social'],
    },
  ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getFilteredContacts = () => {
    let filtered = contacts;

    // Apply view filter
    if (activeView === 'favorites') {
      filtered = filtered.filter(c => c.isFavorite);
    } else if (activeView === 'recent') {
      filtered = filtered.filter(c => c.lastContacted);
      filtered.sort((a, b) => (b.lastContacted?.getTime() || 0) - (a.lastContacted?.getTime() || 0));
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredContacts = getFilteredContacts();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredContacts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectContact();
    } else if (e.metaKey && e.key === 'f') {
      e.preventDefault();
      handleToggleFavorite();
    } else if (e.metaKey && e.key === 'e') {
      e.preventDefault();
      handleEmail();
    } else if (e.metaKey && e.key === 'c') {
      e.preventDefault();
      handleCopyEmail();
    }
  };

  const handleSelectContact = () => {
    const contact = filteredContacts[selectedIndex];
    if (contact) {
      setSelectedContact(contact);
    }
  };

  const handleToggleFavorite = () => {
    const contact = filteredContacts[selectedIndex];
    if (contact) {
      contact.isFavorite = !contact.isFavorite;
      store.native?.showToast(
        contact.isFavorite ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    }
  };

  const handleEmail = () => {
    const contact = selectedContact || filteredContacts[selectedIndex];
    if (contact?.email) {
      store.native?.open(`mailto:${contact.email}`);
      contact.lastContacted = new Date();
    }
  };

  const handleCall = () => {
    const contact = selectedContact || filteredContacts[selectedIndex];
    if (contact?.phone) {
      store.native?.open(`tel:${contact.phone}`);
      contact.lastContacted = new Date();
    }
  };

  const handleCopyEmail = () => {
    const contact = selectedContact || filteredContacts[selectedIndex];
    if (contact?.email) {
      navigator.clipboard.writeText(contact.email);
      store.native?.showToast('Email copied to clipboard', 'success');
    }
  };

  const formatLastContacted = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = Date.now();
    const diff = now - date.getTime();
    
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="hanzo-window" style={{ height: '600px' }}>
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
          placeholder="Search contacts..."
          className="hanzo-search-input"
        />
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-[var(--hanzo-border)]">
        {(['all', 'favorites', 'recent'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={clsx(
              'flex-1 py-2 text-sm capitalize transition-colors',
              activeView === view
                ? 'text-[var(--hanzo-text)] border-b-2 border-[var(--hanzo-accent)]'
                : 'text-[var(--hanzo-text-secondary)] hover:text-[var(--hanzo-text)]'
            )}
          >
            {view}
            {view === 'favorites' && (
              <span className="ml-1 text-xs">({contacts.filter(c => c.isFavorite).length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contact List */}
        <div className={clsx(
          'overflow-y-auto',
          selectedContact ? 'w-1/2 border-r border-[var(--hanzo-border)]' : 'w-full'
        )}>
          {filteredContacts.length === 0 ? (
            <div className="hanzo-empty" style={{ height: '100%' }}>
              <div className="hanzo-empty-icon">👥</div>
              <div className="hanzo-empty-title">No contacts found</div>
              <div className="hanzo-empty-subtitle">Try a different search</div>
            </div>
          ) : (
            <div className="p-2">
              {filteredContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className={clsx('hanzo-item', selectedIndex === index && 'selected')}
                  onClick={() => {
                    setSelectedIndex(index);
                    handleSelectContact();
                  }}
                >
                  <div className="hanzo-item-icon">
                    <span className="text-2xl">{contact.avatar}</span>
                  </div>
                  <div className="hanzo-item-content">
                    <div className="hanzo-item-title flex items-center gap-2">
                      {contact.name}
                      {contact.isFavorite && <span className="text-xs">⭐</span>}
                    </div>
                    <div className="hanzo-item-subtitle">
                      {contact.company && contact.role ? `${contact.role} at ${contact.company}` : 
                       contact.company || contact.role || contact.email}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {contact.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-[var(--hanzo-bg-tertiary)]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hanzo-item-accessories">
                    <span className="text-xs text-[var(--hanzo-text-tertiary)]">
                      {formatLastContacted(contact.lastContacted)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Details */}
        {selectedContact && (
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{selectedContact.avatar}</div>
              <h2 className="text-2xl font-semibold">{selectedContact.name}</h2>
              {selectedContact.role && (
                <p className="text-[var(--hanzo-text-secondary)]">{selectedContact.role}</p>
              )}
              {selectedContact.company && (
                <p className="text-[var(--hanzo-text-secondary)]">{selectedContact.company}</p>
              )}
            </div>

            <div className="space-y-4">
              {selectedContact.email && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">✉️</span>
                  <div>
                    <div className="text-sm text-[var(--hanzo-text-secondary)]">Email</div>
                    <div>{selectedContact.email}</div>
                  </div>
                </div>
              )}

              {selectedContact.phone && (
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="text-sm text-[var(--hanzo-text-secondary)]">Phone</div>
                    <div>{selectedContact.phone}</div>
                  </div>
                </div>
              )}

              {selectedContact.notes && (
                <div className="p-4 rounded-lg bg-[var(--hanzo-bg-secondary)]">
                  <div className="text-sm text-[var(--hanzo-text-secondary)] mb-1">Notes</div>
                  <div className="text-sm">{selectedContact.notes}</div>
                </div>
              )}

              <div className="pt-4 space-y-2">
                <button onClick={handleEmail} className="hanzo-button w-full">
                  Send Email
                </button>
                <button onClick={handleCall} className="hanzo-button secondary w-full">
                  Call
                </button>
                <button onClick={handleCopyEmail} className="hanzo-button secondary w-full">
                  Copy Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="↵" size="small" /> View
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="E" size="small" /> Email
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="F" size="small" /> Favorite
          </span>
          <span className="hanzo-footer-hint">
            <Key k="⌘" size="small" /> <Key k="C" size="small" /> Copy
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <span>{filteredContacts.length} contacts</span>
        </div>
      </div>
    </div>
  );
});

export { ContactsWidget };