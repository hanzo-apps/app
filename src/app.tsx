import React, { useEffect } from 'react';
import { View, AppRegistry } from 'react-native-web';
import { observer } from 'mobx-react-lite';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { StoreProvider, useStore } from '@/stores/StoreProvider';
import { Widget } from '@/stores/unified.store';

// Import Sol's widgets directly
import { SearchWidget } from '@/widgets/search.widget';
import { CalendarWidget } from '@/widgets/calendar.widget';
import { ClipboardWidget } from '@/widgets/clipboard.widget';
import { EmojisWidget } from '@/widgets/emojis.widget';
import { FileSearchWidget } from '@/widgets/fileSearch.widget';
import { ProcessesWidget } from '@/widgets/processes.widget';
import { SettingsWidget } from '@/widgets/settings.widget';
import { TranslationWidget } from '@/widgets/translation.widget';
import { ScratchpadWidget } from '@/widgets/scratchpad.widget';
import { OnboardingWidget } from '@/widgets/onboarding.widget';
import { CreateItemWidget } from '@/widgets/createItem.widget';

// Import Jan's AI widget
import AIWidget from '@/widgets/ai.widget';

// Import styles
import './App.css';
import './global.css'; // Sol's global styles

const AppContent = observer(() => {
  const store = useStore();
  
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
        store.ui.setWidget(payload.widget || Widget.SEARCH);
        invoke('show_window');
      });

      return () => {
        unlistenShow();
      };
    };

    setupListeners();
  }, [store]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          invoke('hide_window');
          break;
        case 'ArrowDown':
          e.preventDefault();
          store.ui.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          store.ui.selectPrevious();
          break;
        case 'Enter':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            store.ui.executeSelected();
          } else if (!e.shiftKey) {
            e.preventDefault();
            store.ui.executeSelected();
          }
          break;
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            // Switch to AI widget
            store.ui.setWidget(Widget.AI);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  const renderWidget = () => {
    switch (store.ui.focusedWidget) {
      case Widget.SEARCH:
        return <SearchWidget />;
      case Widget.AI:
        return <AIWidget />;
      case Widget.CALENDAR:
        return <CalendarWidget />;
      case Widget.CLIPBOARD:
        return <ClipboardWidget />;
      case Widget.EMOJIS:
        return <EmojisWidget />;
      case Widget.FILE_SEARCH:
        return <FileSearchWidget />;
      case Widget.PROCESSES:
        return <ProcessesWidget />;
      case Widget.SETTINGS:
        return <SettingsWidget />;
      case Widget.TRANSLATION:
        return <TranslationWidget />;
      case Widget.SCRATCHPAD:
        return <ScratchpadWidget />;
      case Widget.ONBOARDING:
        return <OnboardingWidget />;
      case Widget.CREATE_ITEM:
        return <CreateItemWidget />;
      default:
        return <SearchWidget />;
    }
  };

  return (
    <View className="app vibrancy" data-widget={store.ui.focusedWidget}>
      <View className="app-container">
        {renderWidget()}
      </View>
    </View>
  );
});

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

// Register the app for React Native Web
AppRegistry.registerComponent('Hanzo', () => App);

// For web, we need to run the app
if (typeof document !== 'undefined') {
  AppRegistry.runApplication('Hanzo', {
    rootTag: document.getElementById('root')
  });
}

export default App;