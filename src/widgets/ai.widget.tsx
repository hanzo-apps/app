import React, { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { View, Text, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native-web'
import { useStore } from '../store'
import { ChatMessage, Assistant } from '../ai/types'
import { aiService } from '../services/ai.service'

interface AIWidgetProps {
  widget?: any
}

export const AIWidget: React.FC<AIWidgetProps> = observer(({ widget }) => {
  const store = useStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant>({
    id: 'hanzo-zen',
    name: 'Hanzo Zen',
    model: 'zen',
    description: 'Your AI assistant powered by Zen model',
    instructions: 'You are Hanzo Zen, a helpful AI assistant.',
  })
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    // Auto-focus when widget opens
    if (widget?.isActive) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [widget?.isActive])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Use the AI service to get a real response
      const response = await aiService.chat([
        ...messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        userMessage
      ])
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }
      
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
      scrollViewRef.current?.scrollToEnd({ animated: true })
    } catch (error) {
      console.error('Error sending message:', error)
      setIsLoading(false)
      
      // Show error message
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure the AI service is running.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorResponse])
    }
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-white dark:bg-gray-900">
        {/* Header */}
        <View className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedAssistant.name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Powered by {selectedAssistant.model} model
          </Text>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 p-4"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-gray-500 dark:text-gray-400 text-center">
                Start a conversation with Hanzo Zen
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Press Tab to quickly access from anywhere
              </Text>
            </View>
          )}
          
          {messages.map((message) => (
            <View 
              key={message.id}
              className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <View 
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-blue-500 dark:bg-blue-600' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <Text 
                  className={`${
                    message.role === 'user' 
                      ? 'text-white' 
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}
          
          {isLoading && (
            <View className="items-start mb-4">
              <View className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <Text className="text-gray-900 dark:text-white">...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="p-4 border-t border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={sendMessage}
              editable={!isLoading}
              multiline
              maxHeight={100}
            />
            <TouchableOpacity 
              onPress={sendMessage}
              disabled={!input.trim() || isLoading}
              className="ml-2 bg-blue-500 dark:bg-blue-600 rounded-lg px-4 py-3 disabled:opacity-50"
            >
              <Text className="text-white font-medium">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
})

export default AIWidget