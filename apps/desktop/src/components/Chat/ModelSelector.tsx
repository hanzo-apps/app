import React, { useState, useEffect } from 'react'
import { llama, ModelInfo } from '../../lib/llama'
import { useChatStore } from '../../stores/chat.store'

export function ModelSelector() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const chatStore = useChatStore()

  useEffect(() => {
    loadModels()
    checkCurrentModel()
  }, [])

  const loadModels = async () => {
    try {
      const availableModels = await llama.listAvailableModels()
      setModels(availableModels)
    } catch (err) {
      console.error('Failed to list models:', err)
      setError('Failed to list models')
    }
  }

  const checkCurrentModel = async () => {
    try {
      const model = await llama.getModelInfo()
      setCurrentModel(model)
      if (model) {
        chatStore.setModel(model.name)
      }
    } catch (err) {
      console.error('Failed to get model info:', err)
    }
  }

  const handleLoadModel = async (model: ModelInfo) => {
    setLoading(true)
    setError(null)
    
    try {
      await llama.loadModel(model.path)
      setCurrentModel(model)
      chatStore.setModel(model.name)
    } catch (err) {
      console.error('Failed to load model:', err)
      setError(`Failed to load model: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnloadModel = async () => {
    setLoading(true)
    
    try {
      await llama.unloadModel()
      setCurrentModel(null)
      chatStore.setModel(null)
    } catch (err) {
      console.error('Failed to unload model:', err)
      setError(`Failed to unload model: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(1)} GB`
  }

  return (
    <div className="p-4 border-b border-white/10">
      <h3 className="text-sm font-semibold mb-2 text-white/80">Model Selection</h3>
      
      {error && (
        <div className="text-white/60 text-sm mb-2">{error}</div>
      )}
      
      {currentModel ? (
        <div className="mb-3">
          <div className="text-sm text-white/80">
            Current: <span className="font-medium">{currentModel.name}</span>
          </div>
          <button
            onClick={handleUnloadModel}
            disabled={loading}
            className="mt-2 text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-50"
          >
            Unload Model
          </button>
        </div>
      ) : (
        <div className="text-sm text-white/60 mb-2">No model loaded</div>
      )}
      
      {models.length === 0 ? (
        <div className="text-sm text-white/60">
          No models found. Place .gguf models in the app's models directory.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-white/60 mb-1">Available Models:</div>
          {models.map((model) => (
            <div
              key={model.id}
              className="flex items-center justify-between p-2 bg-white/10 rounded"
            >
              <div>
                <div className="text-sm font-medium text-white">{model.name}</div>
                <div className="text-xs text-white/60">{formatSize(model.size)}</div>
              </div>
              {currentModel?.path !== model.path && (
                <button
                  onClick={() => handleLoadModel(model)}
                  disabled={loading}
                  className="text-xs px-3 py-1 bg-white hover:bg-white/90 text-black rounded disabled:opacity-50"
                >
                  Load
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {loading && (
        <div className="mt-2 text-sm text-white/60">Loading model...</div>
      )}
    </div>
  )
}