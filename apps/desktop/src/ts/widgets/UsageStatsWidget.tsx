import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface UsageData {
  command: string;
  icon: string;
  count: number;
  lastUsed: Date;
  category: string;
}

interface DailyStats {
  date: Date;
  commands: number;
  aiQueries: number;
  workflows: number;
}

const UsageStatsWidget = observer(() => {
  const store = useStore();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'commands' | 'trends'>('overview');

  // Mock usage data
  const topCommands: UsageData[] = [
    { command: 'File Search', icon: '🔍', count: 145, lastUsed: new Date(), category: 'Search' },
    { command: 'ChatGPT', icon: '🤖', count: 89, lastUsed: new Date(), category: 'AI' },
    { command: 'Clipboard History', icon: '📋', count: 76, lastUsed: new Date(), category: 'Productivity' },
    { command: 'Screenshot', icon: '📸', count: 65, lastUsed: new Date(), category: 'Utilities' },
    { command: 'Calculator', icon: '🧮', count: 54, lastUsed: new Date(), category: 'Utilities' },
    { command: 'Snippets', icon: '✂️', count: 43, lastUsed: new Date(), category: 'Productivity' },
    { command: 'Music Control', icon: '🎵', count: 38, lastUsed: new Date(), category: 'Media' },
    { command: 'Window Management', icon: '🪟', count: 32, lastUsed: new Date(), category: 'System' },
  ];

  // Mock daily stats for the past week
  const dailyStats: DailyStats[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date,
      commands: Math.floor(Math.random() * 50) + 20,
      aiQueries: Math.floor(Math.random() * 20) + 5,
      workflows: Math.floor(Math.random() * 10) + 2,
    };
  });

  const totalCommands = topCommands.reduce((sum, cmd) => sum + cmd.count, 0);
  const avgPerDay = Math.floor(totalCommands / 7);
  const mostUsedCategory = 'Productivity';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getMaxValue = () => {
    return Math.max(...dailyStats.map(d => d.commands + d.aiQueries + d.workflows));
  };

  const renderOverview = () => (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4">
          <div className="text-3xl font-bold text-[var(--hanzo-accent)]">{totalCommands}</div>
          <div className="text-sm text-[var(--hanzo-text-secondary)]">Total Commands</div>
          <div className="text-xs text-[var(--hanzo-text-tertiary)] mt-1">This week</div>
        </div>
        <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4">
          <div className="text-3xl font-bold">{avgPerDay}</div>
          <div className="text-sm text-[var(--hanzo-text-secondary)]">Avg per Day</div>
          <div className="text-xs text-[var(--hanzo-text-tertiary)] mt-1">↑ 12% from last week</div>
        </div>
        <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4">
          <div className="text-3xl font-bold">🏆</div>
          <div className="text-sm text-[var(--hanzo-text-secondary)]">{mostUsedCategory}</div>
          <div className="text-xs text-[var(--hanzo-text-tertiary)] mt-1">Most used category</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Activity This Week</h3>
        <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4">
          <div className="flex items-end justify-between h-32 mb-2">
            {dailyStats.map((day, index) => {
              const total = day.commands + day.aiQueries + day.workflows;
              const height = (total / getMaxValue()) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full px-1 flex flex-col justify-end h-full">
                    <div 
                      className="w-full bg-[var(--hanzo-accent)] rounded-t opacity-80 transition-all hover:opacity-100"
                      style={{ height: `${height}%` }}
                      title={`${total} total actions`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-[var(--hanzo-text-tertiary)]">
            {dailyStats.map((day, index) => (
              <div key={index} className="flex-1 text-center">
                {formatDate(day.date).split(' ')[0]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Commands */}
      <div>
        <h3 className="text-sm font-semibold mb-4">Top Commands</h3>
        <div className="space-y-2">
          {topCommands.slice(0, 5).map((cmd, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-xl">{cmd.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cmd.command}</span>
                  <span className="text-sm text-[var(--hanzo-text-secondary)]">{cmd.count}</span>
                </div>
                <div className="mt-1 h-1 bg-[var(--hanzo-bg-tertiary)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--hanzo-accent)] opacity-60"
                    style={{ width: `${(cmd.count / topCommands[0].count) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCommands = () => (
    <div className="p-6">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search commands..."
          className="w-full px-4 py-2 bg-[var(--hanzo-bg-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hanzo-accent)]"
        />
      </div>
      <div className="space-y-2">
        {topCommands.map((cmd, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--hanzo-bg-secondary)] transition-colors"
          >
            <span className="text-2xl">{cmd.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{cmd.command}</div>
              <div className="text-sm text-[var(--hanzo-text-secondary)]">
                {cmd.category} • Used {cmd.count} times
              </div>
            </div>
            <div className="text-right text-sm text-[var(--hanzo-text-tertiary)]">
              Last used today
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-4">Usage Patterns</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4">
            <div className="text-lg font-semibold mb-2">Peak Hours</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>9:00 AM - 11:00 AM</span>
                <span className="text-[var(--hanzo-accent)]">32%</span>
              </div>
              <div className="flex justify-between">
                <span>2:00 PM - 4:00 PM</span>
                <span className="text-[var(--hanzo-accent)]">28%</span>
              </div>
              <div className="flex justify-between">
                <span>7:00 PM - 9:00 PM</span>
                <span className="text-[var(--hanzo-accent)]">15%</span>
              </div>
            </div>
          </div>
          <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4">
            <div className="text-lg font-semibold mb-2">Category Usage</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Productivity</span>
                <span className="text-[var(--hanzo-accent)]">45%</span>
              </div>
              <div className="flex justify-between">
                <span>AI & Search</span>
                <span className="text-[var(--hanzo-accent)]">30%</span>
              </div>
              <div className="flex justify-between">
                <span>Utilities</span>
                <span className="text-[var(--hanzo-accent)]">25%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4">Productivity Insights</h3>
        <div className="bg-[var(--hanzo-bg-secondary)] rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <div className="font-medium">You saved 2.5 hours this week</div>
              <div className="text-sm text-[var(--hanzo-text-secondary)]">
                By using keyboard shortcuts and workflows
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🚀</span>
            <div>
              <div className="font-medium">Your most efficient workflow</div>
              <div className="text-sm text-[var(--hanzo-text-secondary)]">
                "Morning Routine" saved 15 minutes daily
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">📈</span>
            <div>
              <div className="font-medium">Try these commands</div>
              <div className="text-sm text-[var(--hanzo-text-secondary)]">
                Window Management, Email Templates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'commands', name: 'Commands' },
    { id: 'trends', name: 'Trends' },
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
        <h2 className="text-lg font-semibold">Usage Stats</h2>
        
        {/* Time Range Selector */}
        <div className="ml-auto flex gap-1">
          {(['day', 'week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                'px-3 py-1 text-xs rounded-md capitalize transition-colors',
                timeRange === range
                  ? 'bg-[var(--hanzo-accent)] text-white'
                  : 'text-[var(--hanzo-text-secondary)] hover:text-[var(--hanzo-text)]'
              )}
            >
              {range === 'all' ? 'All Time' : range}
            </button>
          ))}
        </div>
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
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'commands' && renderCommands()}
        {activeTab === 'trends' && renderTrends()}
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="Esc" size="small" /> Close
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <button className="text-xs text-[var(--hanzo-text-tertiary)] hover:text-[var(--hanzo-text)]">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
});

export { UsageStatsWidget };