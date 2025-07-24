import React, { useRef, KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { IconSend, IconPlayerStop, IconPaperclip } from '@tabler/icons-react'
import { cn } from '../../lib/utils'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isStreaming?: boolean
  onFileSelect?: (files: FileList) => void
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isStreaming = false,
  onFileSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="relative flex items-end gap-2 max-w-4xl mx-auto w-full">
      <div className="flex-1 relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <TextareaAutosize
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Hanzo..."
          className="w-full px-4 py-3 pr-24 bg-transparent resize-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          minRows={1}
          maxRows={10}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Attach file"
          >
            <IconPaperclip className="w-5 h-5 text-gray-500" />
          </button>
          
          <button
            onClick={onSend}
            disabled={!value.trim() && !isStreaming}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isStreaming
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
            )}
          >
            {isStreaming ? (
              <IconPlayerStop className="w-5 h-5 text-white" />
            ) : (
              <IconSend className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFileSelect?.(e.target.files)}
      />
    </div>
  )
}