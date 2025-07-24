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
    <div className="border-t border-gray-200 dark:border-gray-700">
      <div className="py-2 max-h-[400px] overflow-y-auto">
        {results.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            onMouseEnter={() => onHover(index)}
            className={cn(
              "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              selectedIndex === index && "bg-blue-50 dark:bg-blue-900/20"
            )}
          >
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {item.name}
              </div>
              {item.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {item.description}
                </div>
              )}
            </div>
            <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
              {item.type}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}