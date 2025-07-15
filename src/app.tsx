import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/tauri';
import { uiStore } from '@/stores/ui.store';
import SearchWidget from '@/widgets/SearchWidget';
import AIWidget from '@/widgets/AIWidget';
import ClipboardWidget from '@/widgets/ClipboardWidget';
import CalendarWidget from '@/widgets/CalendarWidget';
import EmojiWidget from '@/widgets/EmojiWidget';
import FileSearchWidget from '@/widgets/FileSearchWidget';
import ProcessesWidget from '@/widgets/ProcessesWidget';
import SettingsWidget from '@/widgets/SettingsWidget';
import './App.css';

const App = observer(() => {
  useEffect(() => {
    // Set up window event listeners
    const setupListeners = async () => {
      const window = await getCurrentWindow();
      
      // Listen for window blur to hide
      await window.onFocusChanged(({ payload: focused }) => {
        if (!focused && import.meta.env.PROD) {
          invoke('hide_window');
        }
      });

      // Listen for widget change events
      const unlistenShow = await listen('show-widget', ({ payload }: any) => {
        uiStore.setWidget(payload.widget || 'search');
        invoke('show_window');
      });

      return () => {
        unlistenShow();
      };
    };

    setupListeners();

    // Register global shortcuts via Rust backend
    invoke('register_shortcuts');
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          invoke('hide_window');
          break;
        case 'ArrowDown':
          e.preventDefault();
          uiStore.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          uiStore.selectPrevious();
          break;
        case 'Enter':
          if (e.metaKey || e.ctrlKey) {
            // Execute with modifier
            e.preventDefault();
            uiStore.executeSelected();
          }
          break;
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            // Switch to AI widget
            uiStore.setWidget('ai');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderWidget = () => {
    switch (uiStore.currentWidget) {
      case 'search':
        return <SearchWidget />;
      case 'ai':
        return <AIWidget />;
      case 'clipboard':
        return <ClipboardWidget />;
      case 'calendar':
        return <CalendarWidget />;
      case 'emoji':
        return <EmojiWidget />;
      case 'fileSearch':
        return <FileSearchWidget />;
      case 'processes':
        return <ProcessesWidget />;
      case 'settings':
        return <SettingsWidget />;
      default:
        return <SearchWidget />;
    }
  };

  return (
    <div className="app vibrancy" data-widget={uiStore.currentWidget}>
      <div className="app-container">
        {renderWidget()}
      </div>
    </div>
  );
});

export default App;