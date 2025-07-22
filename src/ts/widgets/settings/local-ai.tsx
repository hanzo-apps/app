import React, { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native-web'
import { useStore } from '@/stores/StoreProvider'
import { createLogger } from '@/lib/logger'

const logger = createLogger('LocalAI')

interface LocalModel {
  id: string
  name: string
  size: string
  description: string
  downloadUrl: string
  isDownloaded: boolean
  isDownloading: boolean
  downloadProgress: number
}

// Available models (using small models for testing)
const AVAILABLE_MODELS: Omit<LocalModel, 'isDownloaded' | 'isDownloading' | 'downloadProgress'>[] = [
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 0.5B',
    size: '350 MB',
    description: 'Ultra-lightweight model for basic tasks and testing',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf'
  },
  {
    id: 'llama-3.2-1b',
    name: 'Llama 3.2 1B',
    size: '665 MB',
    description: 'Small but capable model for general tasks',
    downloadUrl: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf'
  },
  {
    id: 'phi-3.5-mini',
    name: 'Phi 3.5 Mini',
    size: '2.8 GB',
    description: 'Microsoft\'s efficient model with strong reasoning',
    downloadUrl: 'https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf'
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    size: '4.1 GB',
    description: 'Powerful open model for advanced tasks',
    downloadUrl: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf'
  }
]

export const LocalAI = observer(() => {
  const store = useStore()
  const [models, setModels] = useState<LocalModel[]>([])
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    // Initialize models with download status
    const initModels = AVAILABLE_MODELS.map(model => ({
      ...model,
      isDownloaded: false, // TODO: Check if model is already downloaded
      isDownloading: false,
      downloadProgress: 0
    }))
    setModels(initModels)
  }, [])

  const handleDownload = async (modelId: string) => {
    logger.info('Starting download for model:', modelId)
    
    // Update model state to show downloading
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, isDownloading: true, downloadProgress: 0 } : m
    ))

    // Simulate download progress
    const progressInterval = setInterval(() => {
      setModels(prev => prev.map(m => {
        if (m.id === modelId && m.isDownloading) {
          const newProgress = Math.min(m.downloadProgress + Math.random() * 15, 95)
          return { ...m, downloadProgress: newProgress }
        }
        return m
      }))
    }, 500)

    // Simulate download completion after 5 seconds
    setTimeout(() => {
      clearInterval(progressInterval)
      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, isDownloaded: true, isDownloading: false, downloadProgress: 100 } : m
      ))
      logger.info('Download completed for model:', modelId)
    }, 5000)
  }

  const handleDelete = (modelId: string) => {
    logger.info('Deleting model:', modelId)
    setModels(prev => prev.map(m => 
      m.id === modelId ? { ...m, isDownloaded: false, downloadProgress: 0 } : m
    ))
  }

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId)
    // TODO: Set this as the active model in the store
    logger.info('Selected model:', modelId)
  }

  const handleInitialize = async () => {
    setIsInitializing(true)
    logger.info('Initializing local AI runtime...')
    
    // Simulate initialization
    setTimeout(() => {
      setIsInitializing(false)
      store.ui.showToast('Local AI runtime initialized successfully', 'success')
    }, 2000)
  }

  return (
    <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
      <Text className="text-2xl font-bold mb-2 text">Local AI Models</Text>
      <Text className="darker-text mb-6">
        Download and run AI models locally for private, offline use. Models run entirely on your device.
      </Text>

      {/* Runtime Status */}
      <View className="card-glass mb-6 p-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-semibold text text-lg">Local AI Runtime</Text>
          <View className="ai-model-badge">
            <View className={`ai-status-indicator ${isInitializing ? 'bg-yellow-500' : ''}`} />
            <Text className="text-sm">{isInitializing ? 'Initializing...' : 'Ready'}</Text>
          </View>
        </View>
        
        {!isInitializing && (
          <TouchableOpacity
            onPress={handleInitialize}
            className="btn-gradient self-start"
          >
            <Text className="text-white font-semibold">Initialize Runtime</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Model List */}
      <Text className="font-semibold text mb-3">Available Models</Text>
      
      {models.map(model => (
        <View 
          key={model.id} 
          className={`mb-4 p-6 vibrancy-gradient hover-lift transition-all ${selectedModel === model.id ? 'glow-accent' : ''}`}
        >
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="font-semibold text">{model.name}</Text>
              <Text className="text-sm darker-text">{model.size}</Text>
            </View>
            
            {model.isDownloaded && (
              <TouchableOpacity
                onPress={() => handleSelectModel(model.id)}
                className={selectedModel === model.id ? 'btn-primary' : 'btn-glass'}
              >
                <Text className={selectedModel === model.id ? 'text-white font-semibold' : 'text font-semibold'}>
                  {selectedModel === model.id ? 'Active' : 'Select'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <Text className="text-sm darker-text mb-3">{model.description}</Text>
          
          {model.isDownloading && (
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs darker-text font-medium">Downloading...</Text>
                <Text className="text-xs text-accent font-bold">{Math.round(model.downloadProgress)}%</Text>
              </View>
              <View className="slider-track h-3">
                <View 
                  className="slider-fill h-full"
                  style={{ width: `${model.downloadProgress}%` }}
                />
              </View>
            </View>
          )}
          
          <View className="flex-row gap-3">
            {!model.isDownloaded && !model.isDownloading && (
              <TouchableOpacity
                onPress={() => handleDownload(model.id)}
                className="btn-gradient"
              >
                <Text className="text-white font-semibold">Download</Text>
              </TouchableOpacity>
            )}
            
            {model.isDownloaded && (
              <TouchableOpacity
                onPress={() => handleDelete(model.id)}
                className="btn-glass"
              >
                <Text className="text font-semibold">Delete</Text>
              </TouchableOpacity>
            )}
            
            {model.isDownloading && (
              <TouchableOpacity
                onPress={() => {/* TODO: Cancel download */}}
                className="btn-glass"
              >
                <Text className="text font-semibold">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* Info Section */}
      <View className="mt-6 card-glass p-6">
        <Text className="font-semibold text mb-4 text-lg gradient-text">About Local AI</Text>
        <View className="space-y-3">
          <View className="flex-row items-start gap-3">
            <Text className="text-accent text-lg">•</Text>
            <Text className="text-sm darker-text flex-1">
              Models run entirely on your device - no internet required
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Text className="text-accent text-lg">•</Text>
            <Text className="text-sm darker-text flex-1">
              Your conversations stay private and are never sent to servers
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Text className="text-accent text-lg">•</Text>
            <Text className="text-sm darker-text flex-1">
              Performance depends on your device's CPU/GPU capabilities
            </Text>
          </View>
          <View className="flex-row items-start gap-3">
            <Text className="text-accent text-lg">•</Text>
            <Text className="text-sm darker-text flex-1">
              Larger models provide better results but require more resources
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
})