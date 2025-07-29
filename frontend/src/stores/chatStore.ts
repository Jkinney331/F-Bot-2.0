import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import {
  ChatState,
  ChatSession,
  ChatMessage,
  SendMessageRequest,
  CreateSessionRequest
} from '../types'
import { apiService } from '../services/api'
import { flowiseService } from '../services/flowiseService'
import { flowiseProxy } from '../services/flowiseProxy'
import { isDemo } from '../config/environment'

interface ChatStore extends ChatState {
  // Actions
  createSession: (request?: CreateSessionRequest) => Promise<ChatSession | null>
  loadSessions: () => Promise<void>
  selectSession: (sessionId: string) => Promise<void>
  sendMessage: (message: string, options?: Partial<SendMessageRequest>) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>
  clearError: () => void
  setTyping: (isTyping: boolean) => void
  setSelectedModel: (modelId: string) => void
  setCostBudget: (budget: number) => void
  clearCurrentSession: () => void
  // WebSocket management
  connectWebSocket: (sessionId: string) => void
  disconnectWebSocket: () => void
}

const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  currentSession: null,
  sessions: [],
  isLoading: false,
  isTyping: false,
  error: null,
  selectedModel: undefined,
  costBudget: undefined,

  // Actions
    createSession: async (request?: CreateSessionRequest): Promise<ChatSession | null> => {
    try {
      set({ isLoading: true, error: null })

      // Check if in demo mode
      const isDemoMode = isDemo()

      if (isDemoMode) {
        // Demo mode - create mock session
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay

        const sessionId = `demo-session-${Date.now()}`
        const newSession: ChatSession = {
          id: sessionId,
          userId: 'demo-user-123',
          title: request?.title || 'New Chat Session',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          patientContext: request?.patientContext
        }

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSession: newSession,
          isLoading: false,
        }))

        toast.success('🚀 Demo session created!')
        return newSession
      }

      // Production mode - use actual API
      const newSession = await apiService.createChatSession(request || {})

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSession: newSession,
        isLoading: false,
      }))

      // Connect WebSocket for real-time updates
      get().connectWebSocket(newSession.id)

      return newSession
    } catch (error: any) {
      console.error('Failed to create session:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create new session'
      set({ error: errorMessage, isLoading: false })
      toast.error(errorMessage)
      return null
    }
  },

  loadSessions: async () => {
    try {
      set({ isLoading: true, error: null })

      const sessions = await apiService.getChatSessions()
      
      set({
        sessions: sessions.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
        isLoading: false,
      })
    } catch (error: any) {
      console.error('Failed to load sessions:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load chat sessions'
      set({ error: errorMessage, isLoading: false })
    }
  },

  selectSession: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null })

      const sessions = get().sessions
      let session = sessions.find(s => s.id === sessionId)

      if (!session) {
        throw new Error('Session not found')
      }

      // Load chat history if not already loaded
      if (!session.messages || session.messages.length === 0) {
        const messages = await apiService.getChatHistory(sessionId)
        session = { ...session, messages }
        
        // Update session in store
        set((state) => ({
          sessions: state.sessions.map(s => s.id === sessionId ? session! : s),
        }))
      }

      set({
        currentSession: session,
        isLoading: false,
      })

      // Disconnect previous WebSocket and connect new one
      get().disconnectWebSocket()
      get().connectWebSocket(sessionId)

    } catch (error: any) {
      console.error('Failed to select session:', error)
      const errorMessage = error.response?.data?.message || 'Failed to load session'
      set({ error: errorMessage, isLoading: false })
      toast.error(errorMessage)
    }
  },

    sendMessage: async (message: string, options?: Partial<SendMessageRequest>) => {
    try {
      const { currentSession, selectedModel, costBudget } = get()

      if (!currentSession) {
        throw new Error('No active session')
      }

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content: message,
        role: 'user',
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        currentSession: state.currentSession ? {
          ...state.currentSession,
          messages: [...state.currentSession.messages, userMessage],
        } : null,
        isTyping: true,
        error: null,
      }))

      // Use Flowise service for real AI responses (replaces demo mode)
      const request: SendMessageRequest = {
        message,
        sessionId: currentSession.id,
        modelPreference: selectedModel,
        maxCost: costBudget,
        ...options,
      }

      // Get response from Flowise (Dr. Fascia) with fallback
      let response: ChatMessage
      try {
        response = await flowiseService.sendMessage(request)
      } catch (error) {
        console.warn('Flowise service failed, trying proxy:', error)
        
        // Fallback to proxy service
        const proxyResponse = await flowiseProxy.query({
          question: message,
          chatHistory: []
        })
        
        if (proxyResponse.success) {
          response = {
            id: `flowise-proxy-${Date.now()}`,
            content: proxyResponse.text,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            sources: [],
            processingTime: 0
          }
        } else {
          throw new Error(`Flowise proxy failed: ${proxyResponse.error}`)
        }
      }

      // Update with Flowise response
      set((state) => ({
        currentSession: state.currentSession ? {
          ...state.currentSession,
          messages: [
            ...state.currentSession.messages.filter(m => m.id !== userMessage.id),
            { ...userMessage, id: response.id + '-user' },
            response,
          ],
          updatedAt: new Date().toISOString(),
        } : null,
        isTyping: false,
      }))

      // Update session in sessions list
      set((state) => ({
        sessions: state.sessions.map(s =>
          s.id === currentSession.id
            ? { ...s, updatedAt: new Date().toISOString() }
            : s
        ),
      }))

    } catch (error: any) {
      console.error('Failed to send message:', error)
      const errorMessage = error.response?.data?.message || 'Failed to send message'

      set((state) => ({
        error: errorMessage,
        isTyping: false,
        // Remove temporary user message on error
        currentSession: state.currentSession ? {
          ...state.currentSession,
          messages: state.currentSession.messages.filter(m => !m.id.startsWith('temp-')),
        } : null,
      }))

      toast.error(errorMessage)
    }
  },

  deleteSession: async (sessionId: string) => {
    try {
      await apiService.deleteChatSession(sessionId)
      
      set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSession: state.currentSession?.id === sessionId ? null : state.currentSession,
      }))

      if (get().currentSession?.id === sessionId) {
        get().disconnectWebSocket()
      }

      toast.success('Session deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete session:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete session'
      toast.error(errorMessage)
    }
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    try {
      const updatedSession = await apiService.updateSessionTitle(sessionId, title)
      
      set((state) => ({
        sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s),
        currentSession: state.currentSession?.id === sessionId ? updatedSession : state.currentSession,
      }))

      toast.success('Session title updated')
    } catch (error: any) {
      console.error('Failed to update session title:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update session title'
      toast.error(errorMessage)
    }
  },

  clearError: () => set({ error: null }),
  setTyping: (isTyping: boolean) => set({ isTyping }),
  setSelectedModel: (modelId: string) => set({ selectedModel: modelId }),
  setCostBudget: (budget: number) => set({ costBudget: budget }),
  clearCurrentSession: () => {
    get().disconnectWebSocket()
    set({ currentSession: null })
  },

  // WebSocket management
  connectWebSocket: (sessionId: string) => {
    const ws = apiService.createWebSocketConnection(sessionId)
    if (!ws) return

    ws.onopen = () => {
      console.log('WebSocket connected for session:', sessionId)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'message') {
          const message: ChatMessage = data.message
          
          set((state) => ({
            currentSession: state.currentSession ? {
              ...state.currentSession,
              messages: [...state.currentSession.messages, message],
            } : null,
          }))
        } else if (data.type === 'typing') {
          set({ isTyping: data.isTyping })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected for session:', sessionId)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    // Store WebSocket reference
    ;(get() as any).ws = ws
  },

  disconnectWebSocket: () => {
    const ws = (get() as any).ws
    if (ws) {
      ws.close()
      delete (get() as any).ws
    }
  },
}))

export default useChatStore 