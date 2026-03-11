import React, { useEffect, useRef } from 'react'
import { Message } from './Message'
import { ChatMessage } from '../../stores/chat.store'

interface MessageListProps {
  messages: ChatMessage[]
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/60">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-white">Welcome to Hanzo AI</h2>
          <p>Start a conversation to get assistance</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}