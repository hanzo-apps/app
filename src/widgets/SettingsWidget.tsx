import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { invoke } from '@tauri-apps/api/tauri';
import { uiStore } from '@/stores/ui.store';

interface Settings {
  theme: string;
  hotkey_launcher: string;
  hotkey_ai: string;
  ai_model: string;
  ai_api_key?: string;
  launch_at_login: boolean;
  show_in_dock: boolean;
}

const SettingsWidget = observer(() => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    hotkey_launcher: 'Cmd+Space',
    hotkey_ai: 'Tab',
    ai_model: 'hanzo-zen',
    launch_at_login: true,
    show_in_dock: false
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await invoke<Settings>('get_settings');
      setSettings(saved);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      await invoke('save_settings', { settings });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleChange = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="widget settings-widget">
      <div className="widget-header mb-4">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-sm text-text-secondary">
          Configure Hanzo • ESC to go back
        </p>
      </div>

      <div className="settings-form space-y-4">
        <div className="setting-group">
          <label className="setting-label">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            className="setting-select"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">Launcher Hotkey</label>
          <input
            type="text"
            value={settings.hotkey_launcher}
            onChange={(e) => handleChange('hotkey_launcher', e.target.value)}
            className="setting-input"
            placeholder="Cmd+Space"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">AI Hotkey</label>
          <input
            type="text"
            value={settings.hotkey_ai}
            onChange={(e) => handleChange('hotkey_ai', e.target.value)}
            className="setting-input"
            placeholder="Tab"
          />
        </div>

        <div className="setting-group">
          <label className="setting-label">AI Model</label>
          <select
            value={settings.ai_model}
            onChange={(e) => handleChange('ai_model', e.target.value)}
            className="setting-select"
          >
            <option value="hanzo-zen">Hanzo Zen (Local)</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
          </select>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.launch_at_login}
              onChange={(e) => handleChange('launch_at_login', e.target.checked)}
              className="mr-2"
            />
            Launch at Login
          </label>
        </div>

        <div className="setting-group">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.show_in_dock}
              onChange={(e) => handleChange('show_in_dock', e.target.checked)}
              className="mr-2"
            />
            Show in Dock
          </label>
        </div>

        <div className="setting-actions">
          <button onClick={handleSave} className="btn-primary">
            Save Settings
          </button>
          <button onClick={() => uiStore.setWidget('search')} className="btn-secondary ml-2">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

export default SettingsWidget;