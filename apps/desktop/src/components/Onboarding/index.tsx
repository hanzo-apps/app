import React, { useState } from 'react'
import { llama } from '../../lib/llama'

interface OnboardingProps {
  onComplete: () => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recommendedModels = [
    {
      id: 'llama-3.2-3b',
      name: 'Llama 3.2 3B',
      size: '2.0 GB',
      description: 'Fast and efficient for most tasks',
      url: 'https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf'
    },
    {
      id: 'mistral-7b',
      name: 'Mistral 7B',
      size: '4.1 GB',
      description: 'Balanced performance and quality',
      url: 'https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf'
    },
    {
      id: 'phi-3-mini',
      name: 'Phi-3 Mini',
      size: '2.8 GB',
      description: 'Microsoft\'s efficient small model',
      url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf'
    }
  ]

  const handleDownloadModel = async (model: typeof recommendedModels[0]) => {
    setDownloading(true)
    setError(null)
    
    try {
      // In a real implementation, this would download the model
      // For now, we'll simulate the download
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      // Save to local storage that onboarding is complete
      localStorage.setItem('hanzo-onboarding-complete', 'true')
      localStorage.setItem('hanzo-default-model', model.id)
      
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed')
      setDownloading(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('hanzo-onboarding-complete', 'true')
    onComplete()
  }

  const steps = [
    {
      title: 'Welcome to Hanzo AI',
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-32 h-32 flex items-center justify-center">
            <svg 
              viewBox="0 0 67 67" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-24 h-24"
            >
              <path d="M22.21 67V44.6369H0V67H22.21Z" fill="white"/>
              <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" fill="white"/>
              <path d="M22.21 0H0V22.3184H22.21V0Z" fill="white"/>
              <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" fill="white"/>
              <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" fill="white"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Your AI-powered command center</h2>
          <p className="text-white/60">
            Launch apps, chat with AI, and control your system with natural language
          </p>
          <div className="flex gap-2 justify-center">
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm border border-white/20">⌘</kbd>
            <span className="text-white/60">+</span>
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm border border-white/20">Space</kbd>
            <span className="text-white/60">to open launcher</span>
          </div>
        </div>
      )
    },
    {
      title: 'Download a Local AI Model',
      content: (
        <div className="space-y-4">
          <p className="text-white/60 text-center mb-6">
            For the best experience, download a local AI model that runs privately on your device
          </p>
          
          {downloading ? (
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Downloading model...</span>
                  <span className="text-sm">{progress}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleDownloadModel(model)}
                  className="w-full bg-transparent hover:bg-white/10 rounded-lg p-4 text-left transition-colors border border-white/20"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{model.name}</h3>
                      <p className="text-sm text-white/60">{model.description}</p>
                    </div>
                    <span className="text-sm text-white/40">{model.size}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-black rounded-2xl p-8 border border-white/20">
          {steps[step].content}
          
          <div className="mt-8 flex justify-between">
            {step === 0 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-white text-black hover:bg-white/90 rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                  disabled={downloading}
                >
                  Back
                </button>
                <button
                  onClick={handleSkip}
                  className="px-6 py-2 text-white/60 hover:text-white transition-colors"
                  disabled={downloading}
                >
                  Skip for now
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}