import React, { forwardRef } from 'react'

interface CommandInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const CommandInput = forwardRef<HTMLInputElement, CommandInputProps>(
  ({ value, onChange, placeholder }, ref) => {
    return (
      <div className="min-h-[42px] flex items-center gap-2 my-1 px-2">
        <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-lg flex-1 bg-transparent placeholder-white/40 focus:outline-none text-white"
          autoFocus
        />
      </div>
    )
  }
)

CommandInput.displayName = 'CommandInput'