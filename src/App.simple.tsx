import React, { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

type ViewMode = 'launcher' | 'chat' | 'logs';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('launcher');

  useEffect(() => {
    // Listen for tray menu events
    const unlisten1 = listen('show-launcher', () => {
      setViewMode('launcher');
    });

    const unlisten2 = listen('show-chat', () => {
      setViewMode('chat');
    });

    const unlisten3 = listen('show-logs', () => {
      setViewMode('logs');
    });

    // Cleanup listeners
    return () => {
      unlisten1.then(fn => fn());
      unlisten2.then(fn => fn());
      unlisten3.then(fn => fn());
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    color: '#333',
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#007AFF',
    color: 'white',
  };

  const inactiveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#f0f0f0',
    color: '#333',
  };

  return (
    <div style={containerStyle}>
      <nav style={navStyle}>
        <button
          onClick={() => setViewMode('launcher')}
          style={viewMode === 'launcher' ? activeButtonStyle : inactiveButtonStyle}
        >
          Launcher
        </button>
        <button
          onClick={() => setViewMode('chat')}
          style={viewMode === 'chat' ? activeButtonStyle : inactiveButtonStyle}
        >
          AI Chat
        </button>
        <button
          onClick={() => setViewMode('logs')}
          style={viewMode === 'logs' ? activeButtonStyle : inactiveButtonStyle}
        >
          Logs
        </button>
      </nav>

      {viewMode === 'launcher' && (
        <div>
          <h1>Hanzo Launcher</h1>
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8f8f8', 
            borderRadius: '10px',
            marginTop: '20px' 
          }}>
            <input
              type="text"
              placeholder="Type to search apps, files, or commands..."
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
              }}
              autoFocus
            />
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#666' }}>Quick Actions:</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button style={inactiveButtonStyle}>Open Finder</button>
                <button style={inactiveButtonStyle}>Toggle Dark Mode</button>
                <button style={inactiveButtonStyle}>Take Screenshot</button>
                <button style={inactiveButtonStyle}>System Preferences</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'chat' && (
        <div>
          <h1>AI Chat Interface</h1>
          <div style={{
            height: '400px',
            backgroundColor: '#f8f8f8',
            borderRadius: '10px',
            padding: '20px',
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
              <div style={{ 
                backgroundColor: '#007AFF', 
                color: 'white', 
                padding: '10px', 
                borderRadius: '10px',
                marginBottom: '10px',
                maxWidth: '70%',
              }}>
                Hello! I'm Hanzo, your AI assistant. How can I help you today?
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  outline: 'none',
                }}
              />
              <button style={activeButtonStyle}>Send</button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'logs' && (
        <div>
          <h1>System Logs</h1>
          <div style={{
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px',
            height: '400px',
            overflowY: 'auto',
          }}>
            <div>[2024-07-22 11:45:00] Hanzo started successfully</div>
            <div>[2024-07-22 11:45:01] System tray initialized</div>
            <div>[2024-07-22 11:45:02] All plugins loaded</div>
            <div>[2024-07-22 11:45:03] Ready to assist!</div>
            <div style={{ marginTop: '10px', color: '#4EC9B0' }}>
              --- Tauri App Info ---<br/>
              Version: 0.1.0<br/>
              Platform: {window.__TAURI__ ? 'Tauri' : 'Web'}<br/>
              Debug Mode: {process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};