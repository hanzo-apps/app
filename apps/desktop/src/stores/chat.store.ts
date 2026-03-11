import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { llama, streamGenerate } from '../lib/llama'

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
      // Create assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      
      // Add message to state
      set(state => ({
        messages: [...state.messages, assistantMessage]
      }))
      
      // Check if model is loaded
      const modelInfo = await llama.getModelInfo()
      
      if (!modelInfo) {
        // Show error if no model loaded
        set(state => ({
          messages: state.messages.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: "Please load a model first. You can download GGUF models from HuggingFace and place them in your Downloads folder or the app's models directory." }
              : msg
          ),
          isStreaming: false
        }))
      } else {
        // Stream response from llama
        let fullResponse = ''
        await streamGenerate(
          content,
          {
            temperature: 0.7,
            max_tokens: 512,
            top_p: 0.9,
          },
          (token) => {
            fullResponse += token
            set(state => ({
              messages: state.messages.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            }))
          }
        )
        
        set({ isStreaming: false })
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      set({ isStreaming: false })
    }
  },
  
  clearMessages: () => set({ messages: [] }),
  
  setModel: (model: string) => set({ currentModel: model }),
  
  stopStreaming: () => set({ isStreaming: false })
}))

