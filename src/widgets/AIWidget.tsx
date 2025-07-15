import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { aiService, Message } from '@/services/ai.service';
import { uiStore } from '@/stores/ui.store';

const AIWidget = observer(() => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chat({
        messages: [...messages, userMessage]
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (input) {
        setInput('');
      } else {
        uiStore.setWidget('search');
      }
    }
  };

  return (
    <div className="widget ai-widget">
      <div className="ai-header mb-4">
        <h2 className="text-2xl font-bold text-accent">Hanzo AI</h2>
        <p className="text-sm text-text-secondary">
          Powered by local Zen model • ESC to go back
        </p>
      </div>

      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <p className="text-text-secondary mb-4">
              Ask me anything! I can help with:
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Writing and editing text</li>
              <li>• Explaining code and concepts</li>
              <li>• Answering questions</li>
              <li>• Creative tasks</li>
            </ul>
          </div>
        ) : (
          <div className="messages-list space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={clsx(
                  'message',
                  message.role === 'user' ? 'user-message' : 'assistant-message'
                )}
              >
                <div className="message-role text-xs text-text-secondary mb-1">
                  {message.role === 'user' ? 'You' : 'Hanzo AI'}
                </div>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message">
                <div className="message-role text-xs text-text-secondary mb-1">
                  Hanzo AI
                </div>
                <div className="loading-dots">
                  <span>•</span>
                  <span>•</span>
                  <span>•</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="ai-input-form mt-4">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="ai-input"
          disabled={isLoading}
        />
      </form>
    </div>
  );
});

export default AIWidget;