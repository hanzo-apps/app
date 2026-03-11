import React from 'react'
import { cn } from '../../lib/utils'
import { CommandItem } from './index'

interface SearchResultsProps {
  results: CommandItem[]
  selectedIndex: number
  onSelect: (item: CommandItem) => void
  onHover: (index: number) => void
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  selectedIndex,
  onSelect,
  onHover
}) => {
  if (results.length === 0) {
    return null
  }

  return (
    <div className="border-t border-white/10">
      <div className="py-1 max-h-[400px] overflow-y-auto">
        {results.map((item, index) => (
          <button
            key={item.id}
            onClick={(e) => {
              e.preventDefault()
              onSelect(item)
            }}
            onMouseEnter={() => onHover(index)}
            className={cn(
              "w-full flex items-center rounded-xl py-1 px-3 h-10 transition-colors",
              selectedIndex === index ? "bg-white/10" : "hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className={cn(
                "text-sm truncate",
                selectedIndex === index 
                  ? "text-white font-medium" 
                  : "text-white/80"
              )}>
                {item.name}
              </span>
            </div>
            {item.type === 'command' && (
              <div className="flex items-center gap-1 ml-2">
                <kbd className={cn(
                  "px-1.5 py-0.5 text-xs rounded",
                  selectedIndex === index
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/60"
                )}>
                  ⌘
                </kbd>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}