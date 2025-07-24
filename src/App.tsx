import React, { useEffect, useState } from 'react'
import { CommandBar } from './components/CommandBar'
import { Chat } from './components/Chat'
import { Onboarding } from './components/Onboarding'
import { TestMenu } from './components/TestMenu';
import './App.css'

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

type ViewMode = 'launcher' | 'chat' | 'logs'

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('launcher')
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Handle window resizing based on view mode
  useEffect(() => {
    if (isTauri && !showOnboarding) {
      import('@tauri-apps/api').then(({ invoke }) => {
        if (viewMode === 'launcher') {
          invoke('resize_window_to_content', { width: 600, height: 400 })
        } else {
          invoke('resize_window_to_content', { width: 800, height: 600 })
        }
      })
    }
  }, [viewMode, showOnboarding])

  useEffect(() => {
    // Check if this is the first time running the app
    const hasCompletedOnboarding = localStorage.getItem('hanzo-onboarding-complete')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }

    if (isTauri) {
      // Dynamically import Tauri API only when running in Tauri
      import('@tauri-apps/api/event').then(({ listen }) => {
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
      })

      // Register Command+Space shortcut
      import('@tauri-apps/api').then(({ invoke }) => {
        invoke('set_global_shortcut', { 
          shortcut: 'Cmd+Space', 
          action: 'show_launcher' 
        }).catch(err => console.error('Failed to register shortcut:', err))
      })
    }
  }, [])

  return (
    <>
      <TestMenu setViewMode={setViewMode} />
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      
      <div className={`h-screen w-screen overflow-hidden ${viewMode === 'launcher' ? 'launcher-view' : 'bg-black'}`}>
        {/* Main Content */}
        <div className="h-full">
          {viewMode === 'launcher' && (
            <div className="h-full flex items-center justify-center relative">
              <CommandBar />
            </div>
          )}

        {viewMode === 'chat' && <Chat />}

        {viewMode === 'logs' && (
          <div className="h-full p-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-4 text-white">System Logs</h1>
              <div className="bg-black border border-white/10 text-white/60 p-4 rounded-lg font-mono text-sm h-[500px] overflow-y-auto">
                <div>[2024-07-22 12:00:00] Hanzo started successfully</div>
                <div>[2024-07-22 12:00:01] System tray initialized</div>
                <div>[2024-07-22 12:00:02] Command bar ready</div>
                <div>[2024-07-22 12:00:03] Chat interface loaded</div>
                <div>[2024-07-22 12:00:04] MCP server listening on port 3000</div>
                <div>[2024-07-22 12:00:05] llama.cpp integration pending...</div>
                <div className="mt-4 text-white/80">
                  --- System Info ---<br/>
                  Version: 0.1.0<br/>
                  Platform: macOS<br/>
                  Architecture: arm64<br/>
                  Node: {typeof process !== 'undefined' ? process.version : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}