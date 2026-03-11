import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface SyncStatus {
  lastSync?: Date;
  isSyncing: boolean;
  hasChanges: boolean;
  syncError?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

const SettingsSyncWidget = observer(() => {
  const store = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    hasChanges: false,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'settings' | 'devices'>('account');

  // Mock devices
  const [connectedDevices] = useState([
    { id: '1', name: 'MacBook Pro', type: 'desktop', icon: '💻', lastSeen: new Date(Date.now() - 300000), current: true },
    { id: '2', name: 'iPhone 15', type: 'mobile', icon: '📱', lastSeen: new Date(Date.now() - 3600000), current: false },
    { id: '3', name: 'iPad Pro', type: 'tablet', icon: '🖥️', lastSeen: new Date(Date.now() - 86400000), current: false },
  ]);

  // Settings that can be synced
  const [syncSettings] = useState([
    { key: 'preferences', name: 'Preferences', description: 'Theme, appearance, general settings', enabled: true },
    { key: 'shortcuts', name: 'Keyboard Shortcuts', description: 'Custom keyboard shortcuts', enabled: true },
    { key: 'snippets', name: 'Text Snippets', description: 'Text expansion snippets', enabled: true },
    { key: 'workflows', name: 'Workflows', description: 'Custom workflows and automations', enabled: true },
    { key: 'extensions', name: 'Extensions', description: 'Installed extensions and configurations', enabled: false },
    { key: 'history', name: 'Command History', description: 'Recent commands and searches', enabled: false },
  ]);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('hanzo_auth_token');
    if (token) {
      setIsAuthenticated(true);
      // Mock user profile
      setUserProfile({
        id: '123',
        email: 'user@hanzo.ai',
        name: 'John Doe',
        avatar: '👤',
        plan: 'pro',
      });
      setSyncStatus({
        lastSync: new Date(Date.now() - 3600000),
        isSyncing: false,
        hasChanges: true,
      });
    }
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      // Simulate API call to iam.hanzo.ai
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful login
      localStorage.setItem('hanzo_auth_token', 'mock-token');
      setIsAuthenticated(true);
      setUserProfile({
        id: '123',
        email: email,
        name: email.split('@')[0],
        avatar: '👤',
        plan: 'pro',
      });
      store.native?.showToast('Successfully logged in', 'success');
    } catch (error) {
      store.native?.showToast('Login failed', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hanzo_auth_token');
    setIsAuthenticated(false);
    setUserProfile(null);
    setSyncStatus({
      isSyncing: false,
      hasChanges: false,
    });
    store.native?.showToast('Logged out successfully', 'success');
  };

  const handleSync = async () => {
    setSyncStatus({ ...syncStatus, isSyncing: true });
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSyncStatus({
        lastSync: new Date(),
        isSyncing: false,
        hasChanges: false,
      });
      store.native?.showToast('Settings synced successfully', 'success');
    } catch (error) {
      setSyncStatus({
        ...syncStatus,
        isSyncing: false,
        syncError: 'Failed to sync settings',
      });
      store.native?.showToast('Sync failed', 'error');
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minutes ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diff / 86400000);
      return `${days} days ago`;
    }
  };

  const renderLogin = () => (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-semibold mb-2">Login to Hanzo IAM</h2>
        <p className="text-[var(--hanzo-text-secondary)]">
          Sign in to sync your settings across devices
        </p>
      </div>

      <div className="hanzo-form">
        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="hanzo-form-input"
            placeholder="you@example.com"
            disabled={isLoggingIn}
          />
        </div>

        <div className="hanzo-form-group">
          <label className="hanzo-form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="hanzo-form-input"
            placeholder="••••••••"
            disabled={isLoggingIn}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button 
          onClick={handleLogin} 
          disabled={isLoggingIn || !email || !password}
          className="hanzo-button w-full"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>

        <div className="mt-4 text-center">
          <a href="https://iam.hanzo.ai/signup" className="text-[var(--hanzo-accent)] hover:underline text-sm">
            Don't have an account? Sign up
          </a>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-6xl">{userProfile?.avatar}</div>
        <div>
          <h3 className="text-xl font-semibold">{userProfile?.name}</h3>
          <p className="text-[var(--hanzo-text-secondary)]">{userProfile?.email}</p>
          <span className={clsx(
            'inline-block mt-1 px-2 py-1 text-xs rounded',
            userProfile?.plan === 'pro' ? 'bg-[var(--hanzo-accent)] text-white' : 'bg-[var(--hanzo-bg-tertiary)]'
          )}>
            {userProfile?.plan?.toUpperCase()} Plan
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-[var(--hanzo-bg-secondary)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Sync Status</span>
            {syncStatus.hasChanges && (
              <span className="text-xs text-orange-500">Changes pending</span>
            )}
          </div>
          <div className="text-sm text-[var(--hanzo-text-secondary)]">
            {syncStatus.lastSync ? (
              <>Last synced: {formatLastSeen(syncStatus.lastSync)}</>
            ) : (
              'Never synced'
            )}
          </div>
          {syncStatus.syncError && (
            <div className="text-sm text-red-500 mt-1">{syncStatus.syncError}</div>
          )}
          <button 
            onClick={handleSync}
            disabled={syncStatus.isSyncing}
            className="hanzo-button w-full mt-3"
          >
            {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        <div className="p-4 rounded-lg bg-[var(--hanzo-bg-secondary)]">
          <div className="font-medium mb-2">Account Actions</div>
          <div className="space-y-2">
            <button className="w-full text-left p-2 rounded hover:bg-[var(--hanzo-bg-tertiary)] transition-colors">
              🔑 Change Password
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-[var(--hanzo-bg-tertiary)] transition-colors">
              📧 Update Email
            </button>
            <button className="w-full text-left p-2 rounded hover:bg-[var(--hanzo-bg-tertiary)] transition-colors">
              💳 Manage Subscription
            </button>
            <button 
              onClick={handleLogout}
              className="w-full text-left p-2 rounded hover:bg-[var(--hanzo-bg-tertiary)] transition-colors text-red-500"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      <h3 className="font-medium mb-4">Sync Settings</h3>
      <div className="space-y-3">
        {syncSettings.map((setting) => (
          <label
            key={setting.key}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--hanzo-bg-secondary)] transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              checked={setting.enabled}
              onChange={() => {}}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">{setting.name}</div>
              <div className="text-sm text-[var(--hanzo-text-secondary)]">{setting.description}</div>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[var(--hanzo-bg-secondary)]">
        <div className="font-medium mb-2">⚠️ Privacy Note</div>
        <div className="text-sm text-[var(--hanzo-text-secondary)]">
          Your settings are encrypted end-to-end. Hanzo cannot read your personal data.
          Only metadata like last sync time is visible to our servers.
        </div>
      </div>
    </div>
  );

  const renderDevices = () => (
    <div className="p-6">
      <h3 className="font-medium mb-4">Connected Devices</h3>
      <div className="space-y-3">
        {connectedDevices.map((device) => (
          <div
            key={device.id}
            className={clsx(
              'p-4 rounded-lg',
              device.current ? 'bg-[var(--hanzo-selection)] border border-[var(--hanzo-accent)]' : 'bg-[var(--hanzo-bg-secondary)]'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{device.icon}</span>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {device.name}
                    {device.current && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--hanzo-accent)] text-white">
                        This device
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--hanzo-text-secondary)]">
                    Last seen: {formatLastSeen(device.lastSeen)}
                  </div>
                </div>
              </div>
              {!device.current && (
                <button className="text-sm text-red-500 hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-[var(--hanzo-text-tertiary)]">
        Settings automatically sync when you sign in on a new device
      </div>
    </div>
  );

  const tabs = [
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'settings', name: 'Sync Settings', icon: '⚙️' },
    { id: 'devices', name: 'Devices', icon: '🖥️' },
  ];

  return (
    <div className="hanzo-window" style={{ height: '600px' }}>
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <h2 className="text-lg font-semibold">Settings Sync</h2>
        {isAuthenticated && (
          <div className="ml-auto flex items-center gap-2">
            <span className={clsx(
              'w-2 h-2 rounded-full',
              syncStatus.isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
            )}></span>
            <span className="text-sm text-[var(--hanzo-text-secondary)]">
              {syncStatus.isSyncing ? 'Syncing...' : 'Connected'}
            </span>
          </div>
        )}
      </div>

      {!isAuthenticated ? (
        renderLogin()
      ) : (
        <>
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

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'account' && renderAccount()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'devices' && renderDevices()}
          </div>
        </>
      )}

      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="Esc" size="small" /> Close
          </span>
        </div>
        <div className="hanzo-footer-actions">
          <a href="https://iam.hanzo.ai" className="text-xs text-[var(--hanzo-text-tertiary)] hover:text-[var(--hanzo-text)]">
            Powered by iam.hanzo.ai
          </a>
        </div>
      </div>
    </div>
  );
});

export { SettingsSyncWidget };