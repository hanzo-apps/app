import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface Command {
  id: string;
  command: string;
  description: string;
  category: string;
  icon: string;
  lastUsed?: Date;
  usageCount: number;
  isFavorite: boolean;
}

interface CommandHistory {
  id: string;
  command: string;
  timestamp: Date;
  exitCode: number;
  output?: string;
}

const ShellWidget = observer(() => {
  const store = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'commands' | 'history' | 'terminal'>('commands');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLTextAreaElement>(null);

  // Mock commands
  const [commands] = useState<Command[]>([
    {
      id: '1',
      command: 'git status',
      description: 'Show the working tree status',
      category: 'Git',
      icon: '🔀',
      lastUsed: new Date(Date.now() - 3600000),
      usageCount: 145,
      isFavorite: true,
    },
    {
      id: '2',
      command: 'npm run dev',
      description: 'Start development server',
      category: 'Node.js',
      icon: '📦',
      lastUsed: new Date(Date.now() - 7200000),
      usageCount: 89,
      isFavorite: true,
    },
    {
      id: '3',
      command: 'docker ps',
      description: 'List running containers',
      category: 'Docker',
      icon: '🐳',
      usageCount: 67,
      isFavorite: false,
    },
    {
      id: '4',
      command: 'python -m http.server 8000',
      description: 'Start simple HTTP server',
      category: 'Python',
      icon: '🐍',
      usageCount: 45,
      isFavorite: false,
    },
    {
      id: '5',
      command: 'brew update && brew upgrade',
      description: 'Update Homebrew and packages',
      category: 'System',
      icon: '🍺',
      usageCount: 23,
      isFavorite: false,
    },
    {
      id: '6',
      command: 'find . -name "*.log" -delete',
      description: 'Delete all log files recursively',
      category: 'File System',
      icon: '🔍',
      usageCount: 12,
      isFavorite: false,
    },
  ]);

  // Mock history
  const [history] = useState<CommandHistory[]>([
    {
      id: '1',
      command: 'ls -la',
      timestamp: new Date(Date.now() - 300000),
      exitCode: 0,
      output: 'total 64\ndrwxr-xr-x  10 user  staff   320 Jan 15 10:30 .\ndrwxr-xr-x  20 user  staff   640 Jan 15 09:00 ..',
    },
    {
      id: '2',
      command: 'git pull origin main',
      timestamp: new Date(Date.now() - 600000),
      exitCode: 0,
      output: 'Already up to date.',
    },
    {
      id: '3',
      command: 'npm test',
      timestamp: new Date(Date.now() - 900000),
      exitCode: 1,
      output: 'Test suite failed: 2 tests failed',
    },
  ]);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  const filteredCommands = commands.filter(cmd =>
    cmd.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = history.filter(item =>
    item.command.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (activeTab === 'terminal') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const maxIndex = activeTab === 'commands' ? filteredCommands.length - 1 : filteredHistory.length - 1;
      setSelectedIndex(Math.min(selectedIndex + 1, maxIndex));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    } else if (e.metaKey && e.key === 'c') {
      e.preventDefault();
      handleCopyCommand();
    } else if (e.metaKey && e.key === 'f') {
      e.preventDefault();
      handleToggleFavorite();
    }
  };

  const handleExecute = async () => {
    let commandToExecute = '';
    
    if (activeTab === 'commands') {
      const cmd = filteredCommands[selectedIndex];
      if (cmd) {
        commandToExecute = cmd.command;
        cmd.usageCount++;
        cmd.lastUsed = new Date();
      }
    } else if (activeTab === 'history') {
      const item = filteredHistory[selectedIndex];
      if (item) {
        commandToExecute = item.command;
      }
    }

    if (commandToExecute) {
      setActiveTab('terminal');
      setTerminalOutput([...terminalOutput, `$ ${commandToExecute}`, 'Executing...']);
      
      // Simulate command execution
      setTimeout(() => {
        setTerminalOutput(prev => [
          ...prev.slice(0, -1),
          'Command executed successfully',
          ''
        ]);
      }, 1000);
    }
  };

  const handleCopyCommand = () => {
    let commandToCopy = '';
    
    if (activeTab === 'commands') {
      const cmd = filteredCommands[selectedIndex];
      if (cmd) commandToCopy = cmd.command;
    } else if (activeTab === 'history') {
      const item = filteredHistory[selectedIndex];
      if (item) commandToCopy = item.command;
    }

    if (commandToCopy) {
      navigator.clipboard.writeText(commandToCopy);
      store.native?.showToast('Command copied to clipboard', 'success');
    }
  };

  const handleToggleFavorite = () => {
    if (activeTab === 'commands') {
      const cmd = filteredCommands[selectedIndex];
      if (cmd) {
        cmd.isFavorite = !cmd.isFavorite;
        store.native?.showToast(
          cmd.isFavorite ? 'Added to favorites' : 'Removed from favorites',
          'success'
        );
      }
    }
  };

  const handleTerminalSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (terminalInput.trim()) {
        setTerminalOutput([...terminalOutput, `$ ${terminalInput}`, 'Executing...']);
        setTerminalInput('');
        
        // Simulate execution
        setTimeout(() => {
          setTerminalOutput(prev => [
            ...prev.slice(0, -1),
            'Command executed',
            ''
          ]);
        }, 500);
      }
    }
  };

  const renderCommands = () => (
    <div className="p-2">
      {filteredCommands.map((cmd, index) => (
        <div
          key={cmd.id}
          className={clsx('hanzo-item', selectedIndex === index && 'selected')}
          onClick={() => setSelectedIndex(index)}
          onDoubleClick={handleExecute}
        >
          <div className="hanzo-item-icon">
            <span className="text-2xl">{cmd.icon}</span>
          </div>
          <div className="hanzo-item-content">
            <div className="hanzo-item-title flex items-center gap-2">
              <code className="font-mono">{cmd.command}</code>
              {cmd.isFavorite && <span className="text-xs">⭐</span>}
            </div>
            <div className="hanzo-item-subtitle">
              {cmd.description} • {cmd.category}
            </div>
          </div>
          <div className="hanzo-item-accessories">
            <span className="hanzo-item-badge">{cmd.usageCount} uses</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHistory = () => (
    <div className="p-2">
      {filteredHistory.map((item, index) => (
        <div
          key={item.id}
          className={clsx('hanzo-item', selectedIndex === index && 'selected')}
          onClick={() => setSelectedIndex(index)}
          onDoubleClick={handleExecute}
        >
          <div className="hanzo-item-icon">
            <span className={clsx(
              'text-sm font-mono',
              item.exitCode === 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {item.exitCode === 0 ? '✓' : '✗'}
            </span>
          </div>
          <div className="hanzo-item-content">
            <div className="hanzo-item-title">
              <code className="font-mono">{item.command}</code>
            </div>
            <div className="hanzo-item-subtitle">
              {item.timestamp.toLocaleTimeString()} • Exit code: {item.exitCode}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTerminal = () => (
    <div className="flex flex-col h-full bg-black text-green-400 font-mono p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {terminalOutput.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">{line}</div>
        ))}
      </div>
      <div className="flex items-center">
        <span className="mr-2">$</span>
        <textarea
          ref={terminalRef}
          value={terminalInput}
          onChange={(e) => setTerminalInput(e.target.value)}
          onKeyDown={handleTerminalSubmit}
          className="flex-1 bg-transparent outline-none resize-none"
          rows={1}
          placeholder="Type command..."
        />
      </div>
    </div>
  );

  const tabs = [
    { id: 'commands', name: 'Commands', icon: '📚' },
    { id: 'history', name: 'History', icon: '🕐' },
    { id: 'terminal', name: 'Terminal', icon: '💻' },
  ];

  return (
    <div className="hanzo-window" style={{ height: '500px' }}>
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        {activeTab !== 'terminal' ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Search ${activeTab}...`}
            className="hanzo-search-input"
          />
        ) : (
          <h2 className="text-lg font-semibold">Terminal</h2>
        )}
      </div>

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

      <div className="flex-1 overflow-hidden">
        {activeTab === 'commands' && renderCommands()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'terminal' && renderTerminal()}
      </div>

      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          {activeTab !== 'terminal' && (
            <>
              <span className="hanzo-footer-hint">
                <Key k="↵" size="small" /> Execute
              </span>
              <span className="hanzo-footer-hint">
                <Key k="⌘" size="small" /> <Key k="C" size="small" /> Copy
              </span>
            </>
          )}
          {activeTab === 'commands' && (
            <span className="hanzo-footer-hint">
              <Key k="⌘" size="small" /> <Key k="F" size="small" /> Favorite
            </span>
          )}
          {activeTab === 'terminal' && (
            <span className="hanzo-footer-hint">
              <Key k="⌃" size="small" /> <Key k="C" size="small" /> Cancel
            </span>
          )}
        </div>
        <div className="hanzo-footer-actions">
          {activeTab === 'commands' && <span>{filteredCommands.length} commands</span>}
          {activeTab === 'history' && <span>{filteredHistory.length} items</span>}
        </div>
      </div>
    </div>
  );
});

export { ShellWidget };