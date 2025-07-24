import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatStore {
  messages: ChatMessage[]
  isStreaming: boolean
  currentModel: string | null
  
  // Actions
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  setModel: (model: string) => void
  stopStreaming: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  currentModel: null,
  
  sendMessage: async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    set(state => ({
      messages: [...state.messages, userMessage],
      isStreaming: true
    }))
    
    try {
      // For now, we'll use a mock response
      // Later this will call llama.cpp through Tauri
      const response = await mockLLMResponse(content)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      
      set(state => ({
        messages: [...state.messages, assistantMessage],
        isStreaming: false
      }))
    } catch (error) {
      console.error('Failed to send message:', error)
      set({ isStreaming: false })
    }
  },
  
  clearMessages: () => set({ messages: [] }),
  
  setModel: (model: string) => set({ currentModel: model }),
  
  stopStreaming: () => set({ isStreaming: false })
}))

// Mock function - will be replaced with actual llama.cpp integration
async function mockLLMResponse(prompt: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const responses = [
    "I'm Hanzo, your AI assistant. I'm currently running in demo mode. Soon I'll be powered by llama.cpp for local AI inference!",
    "That's an interesting question! Once integrated with llama.cpp, I'll be able to provide more detailed responses.",
    "I can help you with various tasks including:\n- Launching applications\n- Managing files\n- System commands\n- And much more!",
    "The Model Context Protocol (MCP) integration will allow me to interact with various tools and services on your system."
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}