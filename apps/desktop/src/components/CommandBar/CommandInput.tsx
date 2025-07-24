import React, { forwardRef } from 'react'
import { IconSearch } from '@tabler/icons-react'

interface CommandInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const CommandInput = forwardRef<HTMLInputElement, CommandInputProps>(
  ({ value, onChange, placeholder }, ref) => {
    return (
      <div className="relative flex items-center">
        <IconSearch className="absolute left-4 w-5 h-5 text-gray-400" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-12 py-4 text-lg bg-transparent border-0 outline-none focus:ring-0 placeholder-gray-400 dark:text-white"
          autoFocus
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

CommandInput.displayName = 'CommandInput'