import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  hasAttachment: boolean;
  category: 'inbox' | 'sent' | 'draft' | 'spam';
  labels: string[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  icon: string;
}

const EmailWidget = observer(() => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'templates'>('inbox');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Mock emails
  const [emails] = useState<Email[]>([
    {
      id: '1',
      from: 'John Smith',
      fromEmail: 'john@example.com',
      to: 'me@hanzo.ai',
      subject: 'Project Update - Q4 Goals',
      preview: 'Hi team, I wanted to share our progress on the Q4 goals...',
      body: 'Hi team,\n\nI wanted to share our progress on the Q4 goals. We have completed 75% of our targets and are on track to finish the remaining items by the end of the quarter.\n\nBest regards,\nJohn',
      date: new Date(Date.now() - 3600000),
      isRead: false,
      hasAttachment: true,
      category: 'inbox',
      labels: ['work', 'important'],
    },
    {
      id: '2',
      from: 'GitHub',
      fromEmail: 'notifications@github.com',
      to: 'me@hanzo.ai',
      subject: '[hanzoai/hanzo] Pull request #42 merged',
      preview: 'Your pull request "Add new features" has been merged...',
      body: 'Your pull request "Add new features" has been merged into main branch.',
      date: new Date(Date.now() - 7200000),
      isRead: true,
      hasAttachment: false,
      category: 'inbox',
      labels: ['github'],
    },
    {
      id: '3',
      from: 'Sarah Wilson',
      fromEmail: 'sarah@company.com',
      to: 'me@hanzo.ai',
      subject: 'Meeting Tomorrow at 2 PM',
      preview: 'Just a reminder about our meeting tomorrow...',
      body: 'Just a reminder about our meeting tomorrow at 2 PM. We\'ll be discussing the new product launch.\n\nSee you then!\nSarah',
      date: new Date(Date.now() - 86400000),
      isRead: true,
      hasAttachment: false,
      category: 'inbox',
      labels: ['meetings'],
    },
  ]);

  // Mock templates
  const templates: EmailTemplate[] = [
    {
      id: '1',
      name: 'Meeting Request',
      subject: 'Meeting Request - [Topic]',
      body: 'Hi [Name],\n\nI hope this email finds you well. I would like to schedule a meeting to discuss [topic].\n\nWould [date/time] work for you?\n\nBest regards,\n[Your name]',
      icon: '📅',
    },
    {
      id: '2',
      name: 'Follow Up',
      subject: 'Following up on our conversation',
      body: 'Hi [Name],\n\nI wanted to follow up on our conversation about [topic]. As discussed, [key points].\n\nPlease let me know if you have any questions.\n\nBest regards,\n[Your name]',
      icon: '🔄',
    },
    {
      id: '3',
      name: 'Thank You',
      subject: 'Thank you!',
      body: 'Hi [Name],\n\nThank you for [reason]. I really appreciate [specific detail].\n\nLooking forward to [future action].\n\nBest regards,\n[Your name]',
      icon: '🙏',
    },
  ];

  useEffect(() => {
    if (activeTab === 'inbox') {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activeTab !== 'inbox') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, filteredEmails.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleOpenEmail();
    } else if (e.metaKey && e.key === 'n') {
      e.preventDefault();
      setActiveTab('compose');
    } else if (e.key === 'r' && selectedEmail) {
      e.preventDefault();
      handleReply();
    }
  };

  const handleOpenEmail = () => {
    const email = filteredEmails[selectedIndex];
    if (email) {
      email.isRead = true;
      setSelectedEmail(email);
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      setComposeTo(selectedEmail.fromEmail);
      setComposeSubject(`Re: ${selectedEmail.subject}`);
      setComposeBody(`\n\n---\nOn ${selectedEmail.date.toLocaleDateString()}, ${selectedEmail.from} wrote:\n${selectedEmail.body}`);
      setActiveTab('compose');
    }
  };

  const handleSendEmail = () => {
    store.native?.showToast('Email sent successfully', 'success');
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    setActiveTab('inbox');
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setComposeSubject(template.subject);
    setComposeBody(template.body);
    setActiveTab('compose');
  };

  const formatDate = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderInbox = () => (
    <div className="flex h-full">
      {/* Email List */}
      <div className={clsx(
        'border-r border-[var(--hanzo-border)] overflow-y-auto',
        selectedEmail ? 'w-1/3' : 'w-full'
      )}>
        <div className="p-2">
          {filteredEmails.map((email, index) => (
            <div
              key={email.id}
              className={clsx(
                'p-3 rounded-lg cursor-pointer transition-colors mb-1',
                selectedIndex === index && 'bg-[var(--hanzo-selection)]',
                !email.isRead && 'font-semibold'
              )}
              onClick={() => {
                setSelectedIndex(index);
                handleOpenEmail();
              }}
            >
              <div className="flex items-start justify-between mb-1">
                <span className="text-sm">{email.from}</span>
                <span className="text-xs text-[var(--hanzo-text-tertiary)]">{formatDate(email.date)}</span>
              </div>
              <div className="text-sm mb-1">{email.subject}</div>
              <div className="text-xs text-[var(--hanzo-text-secondary)] truncate">{email.preview}</div>
              <div className="flex items-center gap-2 mt-2">
                {email.hasAttachment && <span className="text-xs">📎</span>}
                {email.labels.map(label => (
                  <span key={label} className="text-xs px-2 py-0.5 rounded bg-[var(--hanzo-bg-tertiary)]">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Content */}
      {selectedEmail && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-[var(--hanzo-border)]">
            <h3 className="text-lg font-semibold mb-2">{selectedEmail.subject}</h3>
            <div className="flex items-center justify-between text-sm text-[var(--hanzo-text-secondary)]">
              <span>{selectedEmail.from} &lt;{selectedEmail.fromEmail}&gt;</span>
              <span>{selectedEmail.date.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans">{selectedEmail.body}</pre>
          </div>
          <div className="p-4 border-t border-[var(--hanzo-border)] flex gap-2">
            <button onClick={handleReply} className="hanzo-button">Reply</button>
            <button className="hanzo-button secondary">Forward</button>
            <button className="hanzo-button secondary">Archive</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCompose = () => (
    <div className="p-6">
      <div className="hanzo-form">
        <div className="hanzo-form-group">
          <label className="hanzo-form-label">To</label>
          <input
            type="email"
            value={composeTo}
            onChange={(e) => setComposeTo(e.target.value)}
            className="hanzo-form-input"
            placeholder="recipient@example.com"
          />
        </div>

        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Subject</label>
          <input
            type="text"
            value={composeSubject}
            onChange={(e) => setComposeSubject(e.target.value)}
            className="hanzo-form-input"
            placeholder="Email subject"
          />
        </div>

        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Message</label>
          <textarea
            value={composeBody}
            onChange={(e) => setComposeBody(e.target.value)}
            className="hanzo-form-input"
            rows={10}
            placeholder="Type your message..."
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSendEmail} className="hanzo-button">
            Send Email
          </button>
          <button onClick={() => setActiveTab('inbox')} className="hanzo-button secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleUseTemplate(template)}
            className="p-4 rounded-lg bg-[var(--hanzo-bg-secondary)] hover:bg-[var(--hanzo-bg-tertiary)] transition-colors text-left"
          >
            <div className="text-3xl mb-2">{template.icon}</div>
            <div className="font-medium mb-1">{template.name}</div>
            <div className="text-sm text-[var(--hanzo-text-secondary)]">{template.subject}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'inbox', name: 'Inbox', icon: '📧' },
    { id: 'compose', name: 'Compose', icon: '✏️' },
    { id: 'templates', name: 'Templates', icon: '📝' },
  ];

  return (
    <div className="hanzo-window" style={{ height: '600px' }}>
      {/* Header */}
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        {activeTab === 'inbox' ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search emails..."
            className="hanzo-search-input"
          />
        ) : (
          <h2 className="text-lg font-semibold">Email</h2>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--hanzo-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-[var(--hanzo-text)] border-b-2 border-[var(--hanzo-accent)]'
                : 'text-[var(--hanzo-text-secondary)] hover:text-[var(--hanzo-text)]'
            )}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'inbox' && renderInbox()}
        {activeTab === 'compose' && renderCompose()}
        {activeTab === 'templates' && renderTemplates()}
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          {activeTab === 'inbox' && (
            <>
              <span className="hanzo-footer-hint">
                <Key k="↵" size="small" /> Open
              </span>
              <span className="hanzo-footer-hint">
                <Key k="R" size="small" /> Reply
              </span>
              <span className="hanzo-footer-hint">
                <Key k="⌘" size="small" /> <Key k="N" size="small" /> Compose
              </span>
            </>
          )}
        </div>
        <div className="hanzo-footer-actions">
          {activeTab === 'inbox' && <span>{filteredEmails.length} emails</span>}
        </div>
      </div>
    </div>
  );
});

export { EmailWidget };