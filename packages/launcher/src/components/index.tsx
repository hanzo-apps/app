import React, { useState, useRef, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Fzf } from 'fzf'
import { cn } from '../../lib/utils'
import { CommandInput } from './CommandInput'
import { SearchResults } from './SearchResults'
import { Footer } from './Footer'
import { useApps } from '../../hooks/useApps'
import { useHotkeys } from '../../hooks/useHotkeys'
import { commandBarLogger as logger } from '../../lib/logger'

export interface CommandItem {
  id: string
  name: string
  icon?: string
  description?: string
  type: 'app' | 'command' | 'file' | 'action'
  action: () => void | Promise<void>
}

export const CommandBar: React.FC = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CommandItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get installed apps
  const { apps, loading } = useApps()
  
  // Initialize fuzzy search
  const fzfRef = useRef<any>(null)
  
  useEffect(() => {
    if (apps.length > 0) {
      // Create search index with apps and built-in commands
      const items: CommandItem[] = [
        // System commands
        {
          id: 'toggle-dark-mode',
          name: 'Toggle Dark Mode',
          icon: '🌓',
          description: 'Toggle between light and dark mode',
          type: 'command',
          action: async () => {
            logger.info('Executing toggle dark mode command');
            await invoke('toggle_dark_mode')
          }
        },
        {
          id: 'take-screenshot',
          name: 'Take Screenshot',
          icon: '📸',
          description: 'Capture a screenshot',
          type: 'command',
          action: async () => {
            await invoke('execute_apple_script', {
              script: 'do shell script "screencapture -i ~/Desktop/screenshot.png"'
            })
          }
        },
        {
          id: 'open-finder',
          name: 'Open Finder',
          icon: '📁',
          description: 'Open Finder window',
          type: 'command',
          action: async () => {
            await invoke('open_with_finder', { path: '~' })
          }
        },
        {
          id: 'automation-type-hello',
          name: 'Type Hello Demo',
          icon: '⌨️',
          description: 'Demonstrate typing automation (2s delay)',
          type: 'command',
          action: async () => {
            logger.info('Running type hello automation');
            await invoke('automation_example_type_hello')
          }
        },
        {
          id: 'automation-open-browser',
          name: 'Open Browser Demo',
          icon: '🌐',
          description: 'Open Safari using automation',
          type: 'command',
          action: async () => {
            logger.info('Running open browser automation');
            await invoke('automation_example_open_browser')
          }
        },
        {
          id: 'automation-draw-square',
          name: 'Draw Square Demo',
          icon: '⬜',
          description: 'Draw a square with mouse automation',
          type: 'command',
          action: async () => {
            logger.info('Running draw square automation');
            await invoke('automation_example_draw_square')
          }
        },
        {
          id: 'developer-tools',
          name: 'Developer Tools',
          icon: '🛠️',
          description: 'Open developer tools',
          type: 'command',
          action: async () => {
            logger.info('Opening developer tools');
            await invoke('open_devtools')
          }
        },
        {
          id: 'view-logs',
          name: 'View Logs',
          icon: '📋',
          description: 'Open logs folder',
          type: 'command',
          action: async () => {
            logger.info('Opening logs folder');
            await invoke('open_logs_folder')
          }
        },
        // Add apps
        ...apps.map(app => ({
          id: app.path,
          name: app.name,
          icon: app.icon || '📱',
          description: app.path,
          type: 'app' as const,
          action: async () => {
            await invoke('open_app', { path: app.path })
          }
        }))
      ]
      
      fzfRef.current = new Fzf(items, {
        selector: (item) => item.name + ' ' + item.description,
        tiebreakers: [(a, b) => b.item.type === 'command' ? 1 : -1]
      })
    }
  }, [apps])
  
  // Search effect
  useEffect(() => {
    if (!fzfRef.current) return
    
    if (query.trim() === '') {
      // Show recent/favorite items when empty
      setResults([])
      setSelectedIndex(0)
    } else {
      const searchResults = fzfRef.current.find(query)
      setResults(searchResults.map((r: any) => r.item).slice(0, 10))
      setSelectedIndex(0)
    }
  }, [query])
  
  // Keyboard navigation
  useHotkeys('ArrowDown', () => {
    setSelectedIndex(i => Math.min(i + 1, results.length - 1))
  }, [results])
  
  useHotkeys('ArrowUp', () => {
    setSelectedIndex(i => Math.max(i - 1, 0))
  }, [results])
  
  useHotkeys('Enter', async () => {
    if (results[selectedIndex]) {
      await results[selectedIndex].action()
      // Clear search after launching
      setQuery('')
      inputRef.current?.blur()
    }
  }, [results, selectedIndex])
  
  useHotkeys('Escape', () => {
    setQuery('')
    inputRef.current?.blur()
  })
  
  // Auto-focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <>
      <div className="w-full max-w-[600px] mx-auto animate-slide-in">
        <div className="command-bar overflow-hidden">
          <CommandInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            placeholder="Search for apps and commands..."
          />
          
          {(query || results.length > 0) && (
            <SearchResults
              results={results}
              selectedIndex={selectedIndex}
              onSelect={(item) => item.action()}
              onHover={setSelectedIndex}
            />
          )}
        </div>
      </div>
      
      <Footer />
    </>
  )
}