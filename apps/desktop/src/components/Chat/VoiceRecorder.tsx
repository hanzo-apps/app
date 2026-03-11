import React, { useEffect, useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  isRecording: boolean
  onRecordingChange: (recording: boolean) => void
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  isRecording,
  onRecordingChange
}) => {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptRef = useRef<string>('')

  useEffect(() => {
    // Check if Web Speech API is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      transcriptRef.current = ''
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        transcriptRef.current += finalTranscript
        onTranscript(transcriptRef.current + interimTranscript)
      } else if (interimTranscript) {
        onTranscript(transcriptRef.current + interimTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setError(`Error: ${event.error}`)
      setIsListening(false)
      onRecordingChange(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      if (transcriptRef.current) {
        onTranscript(transcriptRef.current)
      }
    }

    recognitionRef.current = recognition
  }, [onTranscript, onRecordingChange])

  useEffect(() => {
    if (!recognitionRef.current) return

    if (isRecording && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Failed to start recognition:', err)
        setError('Failed to start voice recording')
        onRecordingChange(false)
      }
    } else if (!isRecording && isListening) {
      recognitionRef.current.stop()
    }
  }, [isRecording, isListening, onRecordingChange])

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm">
        <MicOff className="w-4 h-4" />
        <span>{error}</span>
      </div>
    )
  }

  if (!isRecording) return null

  return (
    <div className="flex items-center gap-2 text-white/60 animate-pulse">
      <Mic className="w-4 h-4 text-red-500" />
      <span className="text-sm">Listening...</span>
    </div>
  )
}