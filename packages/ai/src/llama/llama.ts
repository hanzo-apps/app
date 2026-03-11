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

export async function streamGenerate(
  prompt: string,
  options?: GenerateOptions,
  onToken?: (token: string) => void
): Promise<string> {
  let tokenUnlisten: UnlistenFn | null = null
  let completeUnlisten: UnlistenFn | null = null
  let errorUnlisten: UnlistenFn | null = null
  let fullText = ''

  return new Promise<string>(async (resolve, reject) => {
    try {
      // Listen for token events
      tokenUnlisten = await listen<string>('llama-token', (event) => {
        const token = event.payload
        fullText += token
        if (onToken) {
          onToken(token)
        }
      })

      // Listen for completion
      completeUnlisten = await listen('llama-complete', () => {
        cleanup()
        resolve(fullText)
      })

      // Listen for errors
      errorUnlisten = await listen<string>('llama-error', (event) => {
        cleanup()
        reject(new Error(event.payload))
      })

      // Start streaming generation
      await invoke('stream_generate', { prompt, options })
    } catch (error) {
      cleanup()
      reject(error)
    }
  })

  function cleanup() {
    if (tokenUnlisten) tokenUnlisten()
    if (completeUnlisten) completeUnlisten()
    if (errorUnlisten) errorUnlisten()
  }
}