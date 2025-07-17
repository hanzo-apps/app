import { fetch } from '@tauri-apps/plugin-http';

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ChatCompletionOptions {
  messages: Message[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

class AIService {
  private baseUrl = 'http://localhost:1337/v1';
  private apiKey = 'sk-placeholder'; // Local models don't need real keys

  async chat(options: ChatCompletionOptions): Promise<string> {
    const {
      messages,
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      stream = false,
      onChunk,
      onComplete
    } = options;

    // First check if Jan/LM Studio is running
    const janEndpoint = 'http://localhost:1337/v1/chat/completions';
    const lmStudioEndpoint = 'http://localhost:1234/v1/chat/completions';
    
    // Try Jan first, then LM Studio, then fall back to mock
    for (const endpoint of [janEndpoint, lmStudioEndpoint]) {
      try {
        const response = await fetch(endpoint, {
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

        if (response.ok) {
          if (stream && onChunk) {
            return this.handleStreamResponse(response, onChunk, onComplete);
          }

          const data = await response.json();
          if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
          }
        }
      } catch (error) {
        // Try next endpoint
        console.log(`Failed to connect to ${endpoint}, trying next...`);
      }
    }

    // If no local AI is running, use OpenAI-compatible endpoint if API key is set
    if (this.apiKey && this.apiKey !== 'sk-placeholder') {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

        if (response.ok) {
          if (stream && onChunk) {
            return this.handleStreamResponse(response, onChunk, onComplete);
          }

          const data = await response.json();
          if (data.choices && data.choices[0]) {
            return data.choices[0].message.content;
          }
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
      }
    }

    // Fallback to mock response
    console.log('No AI service available, using mock response');
    return this.getMockResponse(messages[messages.length - 1].content);
  }

  private async handleStreamResponse(
    response: Response,
    onChunk: (chunk: string) => void,
    onComplete?: () => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let accumulated = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete?.();
              return accumulated;
            }

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices?.[0]?.delta?.content || '';
              if (chunk) {
                accumulated += chunk;
                onChunk(chunk);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    onComplete?.();
    return accumulated;
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