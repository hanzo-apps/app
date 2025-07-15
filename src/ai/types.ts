export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface Assistant {
  id: string
  name: string
  model: string
  description: string
  instructions: string
}

export interface Model {
  id: string
  name: string
  provider: 'local' | 'openai' | 'anthropic' | 'google' | 'groq' | 'mistral'
  description?: string
  contextLength?: number
  capabilities?: string[]
}

export interface Thread {
  id: string
  title: string
  assistantId: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}