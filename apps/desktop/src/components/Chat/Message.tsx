import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { IconUser, IconRobot } from '@tabler/icons-react'
import { ChatMessage } from '../../stores/chat.store'
import { cn } from '../../lib/utils'

interface MessageProps {
  message: ChatMessage
}

export const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={cn(
      "flex gap-4 mb-6",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-blue-500" : "bg-gray-700"
      )}>
        {isUser ? (
          <IconUser className="w-5 h-5 text-white" />
        ) : (
          <IconRobot className="w-5 h-5 text-white" />
        )}
      </div>
      
      <div className={cn(
        "flex-1 rounded-2xl px-4 py-3",
        isUser 
          ? "bg-blue-500 text-white ml-12" 
          : "bg-gray-100 dark:bg-gray-800 mr-12"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose dark:prose-invert max-w-none"
            components={{
              code({ inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}