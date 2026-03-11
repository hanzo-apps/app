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
      <div className="flex-1 relative bg-black rounded-lg border border-white/10">
        <TextareaAutosize
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Hanzo..."
          className="w-full px-4 py-3 pr-24 bg-transparent resize-none outline-none text-white placeholder-white/50"
          minRows={1}
          maxRows={10}
          spellCheck={false}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title="Attach file"
          >
            <IconPaperclip className="w-5 h-5 text-white/60" />
          </button>
          
          <button
            onClick={onSend}
            disabled={!value.trim() && !isStreaming}
            className={cn(
              "p-2 rounded-md transition-colors",
              isStreaming
                ? "bg-white hover:bg-white/90 text-black"
                : value.trim()
                  ? "bg-white hover:bg-white/90 text-black"
                  : "bg-white/10 text-white/30"
            )}
          >
            {isStreaming ? (
              <IconPlayerStop className="w-5 h-5" />
            ) : (
              <IconSend className="w-5 h-5" />
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