import React, { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { App as CommandPaletteApp } from './App';
import { CommandPalette } from './CommandPalette';
import { AIWidget } from './widgets/ai.widget';

type ViewMode = 'launcher' | 'chat' | 'devtools';

export const UnifiedApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('launcher');

  useEffect(() => {
    // Listen for view switch events from tray menu
    const unlisten = listen('switch-view', (event) => {
      const view = event.payload as string;
      if (view === 'launcher' || view === 'chat' || view === 'devtools') {
        setViewMode(view);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // Render based on view mode
  switch (viewMode) {
    case 'launcher':
      return (
        <div className="app-container launcher-mode">
          <CommandPalette />
        </div>
      );
    
    case 'chat':
      return (
        <div className="app-container chat-mode">
          <CommandPaletteApp />
        </div>
      );
    
    case 'devtools':
      return (
        <div className="app-container devtools-mode">
          <div className="p-8 text-white">
            <h1 className="text-2xl mb-4">Developer Tools</h1>
            <p>Press Cmd+Option+I to open browser DevTools</p>
          </div>
        </div>
      );
    
    default:
      return <CommandPalette />;
  }
};