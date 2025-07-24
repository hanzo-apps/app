import React, { useState } from 'react'
import { ChatInput } from './ChatInput'
import { MessageList } from './MessageList'
import { ModelSelector } from './ModelSelector'
import { useChatStore } from '../../stores/chat.store'

export const Chat: React.FC = () => {
  const { messages, sendMessage, isStreaming } = useChatStore()
  const [inputValue, setInputValue] = useState('')

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return
    
    const message = inputValue.trim()
    setInputValue('')
    await sendMessage(message)
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <ModelSelector />
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} />
      </div>
      <div className="border-t border-white/10 p-4">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  )
}