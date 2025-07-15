import { fetch } from '@tauri-apps/plugin-http';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionOptions {
  messages: Message[];
  model?: string;
  temperature?: number;
  stream?: boolean;
}

class AIService {
  private baseUrl = 'http://localhost:1337/v1';
  private apiKey = 'sk-placeholder'; // Local models don't need real keys

  async chat(options: ChatCompletionOptions): Promise<string> {
    const {
      messages,
      model = 'hanzo-zen',
      temperature = 0.7,
      stream = false
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream
        })
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('AI chat error:', error);
      // Fallback to mock response
      return this.getMockResponse(messages[messages.length - 1].content);
    }
  }

  private getMockResponse(prompt: string): string {
    const responses = [
      "I'm Hanzo Zen, your local AI assistant. How can I help you today?",
      "That's an interesting question! Let me think about that...",
      "I can help you with various tasks like searching files, managing windows, or answering questions.",
      "As your AI assistant, I'm here to make your workflow more efficient.",
      "I understand you're asking about " + prompt.slice(0, 50) + "... Let me help with that."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();