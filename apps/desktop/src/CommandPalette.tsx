import React, { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { register, unregister } from '@tauri-apps/plugin-global-shortcut'
import { 
  Search, 
  Calculator,
  MessageCircle,
  Terminal,
  FileText,
  AppWindow,
  Settings,
  X
} from 'lucide-react'

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void | Promise<void>
  category: string
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [commands, setCommands] = useState<Command[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Base commands that are always available
  const baseCommands: Command[] = [
    {
      id: 'calculator',
      title: 'Calculator',
      subtitle: 'Quick calculations',
      icon: <Calculator className="w-5 h-5" />,
      category: 'Tools',
      action: () => {
        // Open calculator widget
        console.log('Opening calculator')
      }
    },
    {
      id: 'ai-chat',
      title: 'AI Chat',
      subtitle: 'Chat with AI assistant',
      icon: <MessageCircle className="w-5 h-5" />,
      category: 'AI',
      action: () => {
        // Open AI chat
        console.log('Opening AI chat')
      }
    },
    {
      id: 'terminal',
      title: 'Terminal',
      subtitle: 'Open terminal',
      icon: <Terminal className="w-5 h-5" />,
      category: 'Developer',
      action: () => {
        // Open terminal widget
        console.log('Opening terminal')
      }
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Application settings',
      icon: <Settings className="w-5 h-5" />,
      category: 'System',
      action: () => {
        // Open settings
        console.log('Opening settings')
      }
    }
  ]

  // Load dynamic commands based on query
  useEffect(() => {
    const loadCommands = async () => {
      setIsLoading(true)
      
      // Start with base commands
      let filteredCommands = [...baseCommands]

      // If query looks like a calculation
      if (/^[\d\s\+\-\*\/\(\)\.]+$/.test(query) && query.trim()) {
        try {
          // Safe eval for math expressions
          const result = Function(`"use strict"; return (${query})`)()
          filteredCommands.unshift({
            id: 'calc-result',
            title: `= ${result}`,
            subtitle: `${query}`,
            icon: <Calculator className="w-5 h-5" />,
            category: 'Calculator',
            action: async () => {
              // Copy result to clipboard
              await invoke('clipboard_write_text', { text: result.toString() })
              setIsOpen(false)
            }
          })
        } catch (e) {
          // Not a valid calculation
        }
      }

      // Search for apps if query is present
      if (query.trim() && !(/^[\d\s\+\-\*\/\(\)\.]+$/.test(query))) {
        try {
          const apps = await invoke<any[]>('search_apps', { query })
          const appCommands = apps.map(app => ({
            id: `app-${app.identifier}`,
            title: app.name,
            subtitle: app.identifier,
            icon: <AppWindow className="w-5 h-5" />,
            category: 'Applications',
            action: async () => {
              await invoke('launch_app', { name: app.identifier })
              setIsOpen(false)
            }
          }))
          filteredCommands.push(...appCommands)
        } catch (e) {
          console.error('Failed to search apps:', e)
        }
      }

      // Filter by query
      if (query.trim()) {
        filteredCommands = filteredCommands.filter(cmd => 
          cmd.title.toLowerCase().includes(query.toLowerCase()) ||
          cmd.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
          cmd.category.toLowerCase().includes(query.toLowerCase())
        )
      }

      setCommands(filteredCommands)
      setSelectedIndex(0)
      setIsLoading(false)
    }

    const debounce = setTimeout(loadCommands, 100)
    return () => clearTimeout(debounce)
  }, [query])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(commands.length - 1, prev + 1))
          break
        case 'Enter':
          e.preventDefault()
          if (commands[selectedIndex]) {
            commands[selectedIndex].action()
          }
          break
        case 'Escape':
          e.preventDefault()
          if (query) {
            setQuery('')
          } else {
            setIsOpen(false)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commands, selectedIndex, query])

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Register global shortcuts
  useEffect(() => {
    const setupShortcuts = async () => {
      try {
        // Command+Space to toggle
        await register('CommandOrControl+Space', () => {
          setIsOpen(prev => !prev)
        })

        // Command+Shift+Space for AI chat
        await register('CommandOrControl+Shift+Space', () => {
          setIsOpen(true)
          setQuery('AI Chat')
        })
      } catch (e) {
        console.error('Failed to register shortcuts:', e)
      }
    }

    setupShortcuts()

    return () => {
      unregister('CommandOrControl+Space')
      unregister('CommandOrControl+Shift+Space')
    }
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search apps, files, or commands..."
            className="w-full px-12 py-4 text-lg bg-transparent border-b dark:border-gray-700 focus:outline-none"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : commands.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : (
            <div className="py-2">
              {commands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => command.action()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={index === selectedIndex ? 'text-white' : 'text-gray-500'}>
                    {command.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{command.title}</div>
                    {command.subtitle && (
                      <div className={`text-sm ${
                        index === selectedIndex ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {command.subtitle}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs ${
                    index === selectedIndex ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {command.category}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t dark:border-gray-700 text-xs text-gray-500 flex justify-between">
          <div>
            <span className="font-medium">↑↓</span> Navigate
            <span className="ml-4 font-medium">↵</span> Select
            <span className="ml-4 font-medium">esc</span> Close
          </div>
          <div>
            <span className="font-medium">⌘Space</span> Toggle
          </div>
        </div>
      </div>
    </div>
  )
}