import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  DocumentIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import useChatStore from '../../stores/chatStore'
import { ChatMessage } from '../../types'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../ui/LoadingSpinner'
import MessageSources from './MessageSources'
// import UltrasoundUploader from './UltrasoundUploader'

const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    currentSession, 
    sendMessage, 
    isTyping, 
    isLoading, 
    error 
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages, isTyping])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    await sendMessage(message.trim())
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
    },
    onDrop: (files) => {
      // Handle file upload logic here
      if (files.length > 0) {
        toast.success(`${files.length} file(s) selected for upload`)
        // TODO: Implement file upload handling
      }
    },
    noClick: true,
  })

  if (!currentSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-16 w-16 bg-medical-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhotoIcon className="h-8 w-8 text-medical-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to F-Bot 2.0
          </h3>
          <p className="text-gray-500 mb-6 max-w-md">
            Your AI-powered fascia health assistant. Start a new conversation to get 
            evidence-based insights on fascial anatomy, treatment protocols, and research.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span>Evidence-Based Responses</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span>Multi-LLM Optimization</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      {...getRootProps()} 
      className={`flex-1 flex flex-col bg-gray-50 relative ${
        isDragActive ? 'bg-medical-50 border-2 border-dashed border-medical-300' : ''
      }`}
    >
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-medical-50 bg-opacity-90 flex items-center justify-center z-10">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 text-medical-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-medical-700">
              Drop files to upload
            </p>
            <p className="text-medical-600">
              Images, PDFs, and ultrasound files supported
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        <AnimatePresence>
          {currentSession.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start space-x-3"
          >
            <div className="w-8 h-8 bg-medical-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">AI</span>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="typing-indicator"></div>
                <div className="typing-indicator"></div>
                <div className="typing-indicator"></div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Ultrasound Uploader */}
          <AnimatePresence>
            {showUploader && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                                            {/* <UltrasoundUploader onClose={() => setShowUploader(false)} /> */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-sm text-blue-800">Ultrasound uploader will be available when connected to backend API</p>
                            </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Row */}
          <div className="flex items-end space-x-3">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => setShowUploader(!showUploader)}
              className="p-2 text-gray-400 hover:text-medical-600 hover:bg-medical-50 rounded-lg transition-colors"
            >
              <PhotoIcon className="h-5 w-5" />
            </button>

            {/* Message Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  adjustTextareaHeight()
                }}
                onKeyPress={handleKeyPress}
                placeholder="Ask about fascia anatomy, treatment protocols, or upload an ultrasound image..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 resize-none"
                rows={1}
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="p-3 bg-medical-600 text-white rounded-lg hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Medical Disclaimer */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              ⚠️ For educational purposes only. Not a substitute for professional medical advice.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-start space-x-3 max-w-4xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-medical-600' 
            : isSystem 
              ? 'bg-yellow-500' 
              : 'bg-medical-500'
        }`}>
          <span className="text-sm font-medium text-white">
            {isUser ? 'U' : isSystem ? 'S' : 'AI'}
          </span>
        </div>

        {/* Message Content */}
        <div className={`rounded-lg p-4 shadow-sm ${
          isUser 
            ? 'bg-medical-600 text-white' 
            : isSystem 
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-white border border-gray-200'
        }`}>
          <div className="chat-message">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Message Metadata */}
          {!isUser && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <MessageSources sources={message.sources} />
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {message.confidence && (
                    <span>Confidence: {Math.round(message.confidence * 100)}%</span>
                  )}
                  {message.modelUsed && (
                    <span>Model: {message.modelUsed}</span>
                  )}
                  {message.processingTime && (
                    <span className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>{message.processingTime}s</span>
                    </span>
                  )}
                </div>
                {message.cost && (
                  <span className="text-green-600">${message.cost.toFixed(4)}</span>
                )}
              </div>

              {/* Disclaimer */}
              {message.disclaimer && (
                <div className="medical-warning text-xs">
                  {message.disclaimer}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ChatInterface 