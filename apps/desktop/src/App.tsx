import React, { useState, useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { 
  Search, 
  MessageCircle, 
  Settings, 
  Mail, 
  Users, 
  FileText, 
  Music, 
  Terminal, 
  BarChart3,
  Workflow,
  Code2,
  Command
} from 'lucide-react'

// Components
import { Onboarding } from './components/Onboarding'
import { CommandPalette } from './CommandPalette'

// Widgets
import { AIWidget } from './widgets/ai.widget'
import { EmailWidget } from './widgets/EmailWidget'
import { ContactsWidget } from './widgets/ContactsWidget'
import { FileBufferWidget } from './widgets/FileBufferWidget'
import { MusicControlWidget } from './widgets/MusicControlWidget'
import { ShellWidget } from './widgets/ShellWidget'
import { SnippetsWidget } from './widgets/SnippetsWidget'
import { UsageStatsWidget } from './widgets/UsageStatsWidget'
import { WorkflowsWidget } from './widgets/WorkflowsWidget'
import { RecentDocumentsWidget } from './widgets/RecentDocumentsWidget'

// Types
type AppMode = 'launcher' | 'assistant' | 'fullscreen'
type WidgetType = 'ai' | 'email' | 'contacts' | 'files' | 'music' | 'shell' | 'snippets' | 'stats' | 'workflows' | 'documents' | 'settings' | null

interface MenuItem {
  id: WidgetType
  label: string
  icon: React.ReactNode
  shortcut?: string
}

const menuItems: MenuItem[] = [
  { id: 'ai', label: 'AI Assistant', icon: <MessageCircle className="w-5 h-5" />, shortcut: '⌘1' },
  { id: 'email', label: 'Email', icon: <Mail className="w-5 h-5" />, shortcut: '⌘2' },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" />, shortcut: '⌘3' },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
  { id: 'files', label: 'File Buffer', icon: <FileText className="w-5 h-5" /> },
  { id: 'music', label: 'Music', icon: <Music className="w-5 h-5" /> },
  { id: 'shell', label: 'Terminal', icon: <Terminal className="w-5 h-5" /> },
  { id: 'snippets', label: 'Snippets', icon: <Code2 className="w-5 h-5" /> },
  { id: 'stats', label: 'Usage Stats', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'workflows', label: 'Workflows', icon: <Workflow className="w-5 h-5" /> },
]

export const App: React.FC = () => {
  // State
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [appMode, setAppMode] = useState<AppMode>('assistant')
  const [showLauncher, setShowLauncher] = useState(false)
  const [activeWidget, setActiveWidget] = useState<WidgetType>('ai')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    // Check onboarding
    const onboardingComplete = localStorage.getItem('hanzo-onboarding-complete')
    if (!onboardingComplete) {
      setShowOnboarding(true)
    }

    // Listen for mode switches from tray/menu
    const unlistenMode = listen('switch-view', (event: any) => {
      const view = event.payload as string
      switch (view) {
        case 'launcher':
          setAppMode('launcher')
          setShowLauncher(true)
          break
        case 'chat':
        case 'assistant':
          setAppMode('assistant')
          setShowLauncher(false)
          break
        case 'devtools':
          // Handle dev tools if needed
          break
      }
    })

    // Listen for launcher toggle (Cmd+Space)
    const unlistenLauncher = listen('toggle-launcher', () => {
      setShowLauncher(prev => !prev)
    })

    // Listen for widget shortcuts
    const unlistenShortcuts = listen('widget-shortcut', (event: any) => {
      const widgetId = event.payload as WidgetType
      if (widgetId) {
        setActiveWidget(widgetId)
        setShowLauncher(false)
      }
    })

    return () => {
      unlistenMode.then(fn => fn())
      unlistenLauncher.then(fn => fn())
      unlistenShortcuts.then(fn => fn())
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Cmd+Space for launcher
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === ' ')) {
        e.preventDefault()
        setShowLauncher(prev => !prev)
      }
      
      // Cmd+1-9 for widgets
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (menuItems[index]) {
          setActiveWidget(menuItems[index].id)
          setShowLauncher(false)
        }
      }
      
      // Escape to close launcher
      if (e.key === 'Escape' && showLauncher) {
        setShowLauncher(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLauncher])

  // Handle launcher commands
  const handleLauncherCommand = async (command: any) => {
    setShowLauncher(false)
    
    if (command.type === 'widget') {
      setActiveWidget(command.id as WidgetType)
    } else if (command.type === 'action') {
      await invoke(command.action, command.payload || {})
    }
  }

  // Render widget content
  const renderWidget = () => {
    switch (activeWidget) {
      case 'ai':
        return <AIWidget />
      case 'email':
        return <EmailWidget />
      case 'contacts':
        return <ContactsWidget />
      case 'documents':
        return <RecentDocumentsWidget />
      case 'files':
        return <FileBufferWidget />
      case 'music':
        return <MusicControlWidget />
      case 'shell':
        return <ShellWidget />
      case 'snippets':
        return <SnippetsWidget />
      case 'stats':
        return <UsageStatsWidget />
      case 'workflows':
        return <WorkflowsWidget />
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Settings</h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Settings panel coming soon</p>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a widget from the sidebar
          </div>
        )
    }
  }

  // Show onboarding if needed
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />
  }

  // Launcher-only mode (compact)
  if (appMode === 'launcher' && showLauncher) {
    return (
      <div className="app-container launcher-mode">
        <CommandPalette 
          onClose={() => setShowLauncher(false)}
          onCommand={handleLauncherCommand}
        />
      </div>
    )
  }

  // Full assistant mode with sidebar
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hanzo</h1>
          )}
          <button
            onClick={() => setShowLauncher(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Open Launcher (⌘K)"
          >
            <Command className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <nav className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveWidget(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeWidget === item.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={sidebarCollapsed ? `${item.label} ${item.shortcut || ''}` : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!sidebarCollapsed && item.shortcut && (
                <span className="text-xs opacity-60">{item.shortcut}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2 border-t dark:border-gray-700">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            title="Toggle Sidebar"
          >
            <Search className="w-5 h-5" />
            {!sidebarCollapsed && <span>Toggle Sidebar</span>}
          </button>
          <button
            onClick={() => setActiveWidget('settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 mt-1"
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-hidden">
        {renderWidget()}
      </div>

      {/* Overlay Launcher */}
      {showLauncher && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-32 z-50">
          <CommandPalette 
            onClose={() => setShowLauncher(false)}
            onCommand={handleLauncherCommand}
          />
        </div>
      )}
    </div>
  )
}