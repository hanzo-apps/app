import React, { useState, useEffect } from 'react'
import { 
  Search, 
  MessageCircle, 
  Settings, 
  Mail, 
  Users, 
  FileText, 
  Music, 
  Terminal, 
  Clipboard,
  BarChart3,
  Workflow,
  Code2
} from 'lucide-react'

// Import widgets
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
import { Onboarding } from './components/Onboarding'

type WidgetType = 'ai' | 'email' | 'contacts' | 'files' | 'music' | 'shell' | 'snippets' | 'stats' | 'workflows' | 'documents' | null

interface MenuItem {
  id: WidgetType
  label: string
  icon: React.ReactNode
}

const menuItems: MenuItem[] = [
  { id: 'ai', label: 'AI Assistant', icon: <MessageCircle className="w-5 h-5" /> },
  { id: 'email', label: 'Email', icon: <Mail className="w-5 h-5" /> },
  { id: 'contacts', label: 'Contacts', icon: <Users className="w-5 h-5" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
  { id: 'files', label: 'File Buffer', icon: <FileText className="w-5 h-5" /> },
  { id: 'music', label: 'Music', icon: <Music className="w-5 h-5" /> },
  { id: 'shell', label: 'Terminal', icon: <Terminal className="w-5 h-5" /> },
  { id: 'snippets', label: 'Snippets', icon: <Code2 className="w-5 h-5" /> },
  { id: 'stats', label: 'Usage Stats', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'workflows', label: 'Workflows', icon: <Workflow className="w-5 h-5" /> },
]

export const App: React.FC = () => {
  const [activeWidget, setActiveWidget] = useState<WidgetType>('ai')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingComplete = localStorage.getItem('hanzo-onboarding-complete')
    if (!onboardingComplete) {
      setShowOnboarding(true)
    }
  }, [])

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
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a widget from the sidebar
          </div>
        )
    }
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hanzo</h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-2 border-t dark:border-gray-700">
          <button
            onClick={() => setActiveWidget(null)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
    </div>
  )
}