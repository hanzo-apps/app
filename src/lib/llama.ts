import { invoke } from '@tauri-apps/api/core'

export interface ModelInfo {
  id: string
  name: string
  path: string
  size: number
  loaded: boolean
}

export interface GenerateOptions {
  temperature?: number
  max_tokens?: number
  top_p?: number
  top_k?: number
  repeat_penalty?: number
  seed?: number
}

export const llama = {
  async loadModel(path: string): Promise<string> {
    return invoke('load_model', { path })
  },

  async unloadModel(): Promise<string> {
    return invoke('unload_model')
  },

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    return invoke('generate_text', { prompt, options })
  },

  async getModelInfo(): Promise<ModelInfo | null> {
    return invoke('get_model_info')
  },

  async listAvailableModels(): Promise<ModelInfo[]> {
    return invoke('list_available_models')
  }
}

// Stream generation support (using Tauri events)
import { listen, UnlistenFn } from '@tauri-apps/api/event'

export interface StreamEvent {
  token: string
  finished: boolean
}

export async function streamGenerate(
  prompt: string,
  options?: GenerateOptions,
  onToken?: (token: string) => void
): Promise<string> {
  let unlisten: UnlistenFn | null = null
  let fullText = ''

  try {
    if (onToken) {
      unlisten = await listen<StreamEvent>('llm-stream', (event) => {
        fullText += event.payload.token
        onToken(event.payload.token)
      })
    }

    const result = await llama.generateText(prompt, options)
    return result
  } finally {
    if (unlisten) {
      unlisten()
    }
  }
}