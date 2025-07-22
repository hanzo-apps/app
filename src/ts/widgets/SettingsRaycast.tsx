import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

const SettingsWidget = observer(() => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'shortcuts', name: 'Shortcuts', icon: '⌨️' },
    { id: 'extensions', name: 'Extensions', icon: '🧩' },
    { id: 'advanced', name: 'Advanced', icon: '🔧' },
  ];

  const renderGeneralSettings = () => (
    <div className="hanzo-form">
      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Launch at Login</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={store.ui.preferences.launchAtLogin}
            onChange={(e) => store.ui.setPreference('launchAtLogin', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Start Hanzo when you log in</span>
        </label>
      </div>

      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Show in Menu Bar</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={store.ui.preferences.showInMenuBar}
            onChange={(e) => store.ui.setPreference('showInMenuBar', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show Hanzo icon in menu bar</span>
        </label>
      </div>

      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Hide Window on Action</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={store.ui.preferences.hideOnAction}
            onChange={(e) => store.ui.setPreference('hideOnAction', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Hide window after executing an action</span>
        </label>
      </div>

      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Search Engine</label>
        <select
          value={store.ui.preferences.searchEngine || 'google'}
          onChange={(e) => store.ui.setPreference('searchEngine', e.target.value)}
          className="hanzo-form-input"
        >
          <option value="google">Google</option>
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="bing">Bing</option>
          <option value="brave">Brave</option>
        </select>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="hanzo-form">
      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Theme</label>
        <div className="grid grid-cols-3 gap-2">
          {['light', 'dark', 'auto'].map((theme) => (
            <button
              key={theme}
              onClick={() => store.ui.setPreference('theme', theme)}
              className={clsx(
                'p-3 rounded-lg border-2 capitalize transition-all',
                store.ui.preferences.theme === theme
                  ? 'border-[var(--hanzo-accent)] bg-[var(--hanzo-selection)]'
                  : 'border-[var(--hanzo-border)] hover:border-[var(--hanzo-text-tertiary)]'
              )}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Accent Color</label>
        <div className="flex gap-2">
          {['#FF6363', '#0066ff', '#4ecdc4', '#f7b731', '#5f27cd'].map((color) => (
            <button
              key={color}
              onClick={() => store.ui.setPreference('accentColor', color)}
              className={clsx(
                'w-10 h-10 rounded-lg border-2',
                store.ui.preferences.accentColor === color
                  ? 'border-white scale-110'
                  : 'border-transparent'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Window Size</label>
        <select
          value={store.ui.preferences.windowSize || 'medium'}
          onChange={(e) => store.ui.setPreference('windowSize', e.target.value)}
          className="hanzo-form-input"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  const renderShortcutsSettings = () => (
    <div className="hanzo-form">
      <div className="space-y-3">
        <div className="hanzo-form-group">
          <div className="flex items-center justify-between">
            <span>Hanzo Hotkey</span>
            <div className="flex gap-1">
              <Key k="⌘" />
              <Key k="Space" />
            </div>
          </div>
        </div>

        <div className="hanzo-form-group">
          <div className="flex items-center justify-between">
            <span>AI Chat</span>
            <div className="flex gap-1">
              <Key k="Tab" />
            </div>
          </div>
        </div>

        <div className="hanzo-form-group">
          <div className="flex items-center justify-between">
            <span>Clipboard History</span>
            <div className="flex gap-1">
              <Key k="⌘" />
              <Key k="⇧" />
              <Key k="V" />
            </div>
          </div>
        </div>

        <div className="hanzo-form-group">
          <div className="flex items-center justify-between">
            <span>File Search</span>
            <div className="flex gap-1">
              <Key k="⌘" />
              <Key k="F" />
            </div>
          </div>
        </div>

        <div className="hanzo-form-group">
          <div className="flex items-center justify-between">
            <span>Window Management</span>
            <div className="flex gap-1">
              <Key k="⌃" />
              <Key k="⌥" />
              <Key k="⌘" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExtensionsSettings = () => (
    <div className="hanzo-form">
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🧩</div>
          <h3 className="text-lg font-semibold mb-2">Extensions Store</h3>
          <p className="text-sm text-[var(--hanzo-text-secondary)] mb-4">
            Extend Hanzo with community-built extensions
          </p>
          <button className="hanzo-button">
            Browse Extensions
          </button>
        </div>

        <div className="border-t border-[var(--hanzo-border)] pt-4">
          <h4 className="text-sm font-semibold mb-3">Installed Extensions</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--hanzo-bg-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                  G
                </div>
                <div>
                  <div className="font-medium">GitHub</div>
                  <div className="text-xs text-[var(--hanzo-text-tertiary)]">Search repos, issues, and PRs</div>
                </div>
              </div>
              <button className="text-xs text-[var(--hanzo-text-secondary)]">Configure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="hanzo-form">
      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Developer Mode</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={store.ui.preferences.developerMode}
            onChange={(e) => store.ui.setPreference('developerMode', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Enable developer features</span>
        </label>
      </div>

      <div className="hanzo-form-group">
        <label className="hanzo-form-label">Analytics</label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={store.ui.preferences.analytics}
            onChange={(e) => store.ui.setPreference('analytics', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Share anonymous usage data</span>
        </label>
      </div>

      <div className="hanzo-form-group">
        <button className="hanzo-button secondary w-full">
          Reset All Settings
        </button>
      </div>

      <div className="hanzo-form-group">
        <button className="hanzo-button secondary w-full">
          Clear Cache
        </button>
      </div>

      <div className="text-center mt-8 text-xs text-[var(--hanzo-text-tertiary)]">
        <p>Hanzo v{store.ui.version || '1.0.0'}</p>
        <p>Made with ❤️ by Hanzo AI</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'shortcuts':
        return renderShortcutsSettings();
      case 'extensions':
        return renderExtensionsSettings();
      case 'advanced':
        return renderAdvancedSettings();
      default:
        return null;
    }
  };

  return (
    <div className="hanzo-window" style={{ height: '500px' }}>
      {/* Header */}
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <h2 className="text-lg font-semibold">Settings</h2>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 border-r border-[var(--hanzo-border)] p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg mb-1 flex items-center gap-2 transition-all',
                activeTab === tab.id
                  ? 'bg-[var(--hanzo-selection)] text-[var(--hanzo-text)]'
                  : 'hover:bg-[var(--hanzo-bg-secondary)] text-[var(--hanzo-text-secondary)]'
              )}
            >
              <span>{tab.icon}</span>
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="Esc" size="small" /> Close
          </span>
        </div>
      </div>
    </div>
  );
});

export { SettingsWidget };