import React, { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { CommandBar } from './components/CommandBar'
import { Chat } from './components/Chat'
import './App.css'

type ViewMode = 'launcher' | 'chat' | 'logs'

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('launcher')

  useEffect(() => {
    // Listen for tray menu events
    const unlisten1 = listen('show-launcher', () => {
      setViewMode('launcher')
    })

    const unlisten2 = listen('show-chat', () => {
      setViewMode('chat')
    })

    const unlisten3 = listen('show-logs', () => {
      setViewMode('logs')
    })

    // Cleanup listeners
    return () => {
      unlisten1.then(fn => fn())
      unlisten2.then(fn => fn())
      unlisten3.then(fn => fn())
    }
  }, [])

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-1 px-4 py-2">
          <button
            onClick={() => setViewMode('launcher')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'launcher'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Launcher
          </button>
          <button
            onClick={() => setViewMode('chat')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'chat'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            AI Chat
          </button>
          <button
            onClick={() => setViewMode('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'logs'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-57px)]">
        {viewMode === 'launcher' && (
          <div className="h-full flex items-center justify-center">
            <CommandBar />
          </div>
        )}

        {viewMode === 'chat' && <Chat />}

        {viewMode === 'logs' && (
          <div className="h-full p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">System Logs</h1>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-[500px] overflow-y-auto">
                <div>[2024-07-22 12:00:00] Hanzo started successfully</div>
                <div>[2024-07-22 12:00:01] System tray initialized</div>
                <div>[2024-07-22 12:00:02] Command bar ready</div>
                <div>[2024-07-22 12:00:03] Chat interface loaded</div>
                <div>[2024-07-22 12:00:04] MCP server listening on port 3000</div>
                <div>[2024-07-22 12:00:05] llama.cpp integration pending...</div>
                <div className="mt-4 text-blue-400">
                  --- System Info ---<br/>
                  Version: 0.1.0<br/>
                  Platform: macOS<br/>
                  Architecture: arm64<br/>
                  Node: {process.version}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}