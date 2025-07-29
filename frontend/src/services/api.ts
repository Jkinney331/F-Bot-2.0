import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import {
  AuthResponse,
  LoginCredentials,
  User,
  ChatMessage,
  ChatSession,
  SendMessageRequest,
  CreateSessionRequest,
  UltrasoundAnalysis,
  UltrasoundUploadRequest,
  AvailableModel,
  ModelPerformance,
  CostTracking,
  ApiResponse,
  ApiError,
} from '../types'
import { isDemo } from '../config/environment'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('fbot_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<ApiError>) => {
        const { response } = error

        if (response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem('fbot_refresh_token')
          if (refreshToken) {
            try {
              const newAuth = await this.refreshToken(refreshToken)
              localStorage.setItem('fbot_token', newAuth.token)
              localStorage.setItem('fbot_refresh_token', newAuth.refreshToken)
              
              // Retry the original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${newAuth.token}`
                return this.api(error.config)
              }
            } catch (refreshError) {
              // Only logout in production mode
              if (!isDemo()) {
                this.logout()
                toast.error('Session expired. Please log in again.')
              }
            }
          } else {
            // Only logout in production mode
            if (!isDemo()) {
              this.logout()
              toast.error('Please log in to continue.')
            }
          }
        } else if (response?.status === 429) {
          toast.error('Rate limit exceeded. Please try again later.')
        } else if (response?.status === 500) {
          toast.error('Server error. Please try again.')
        } else if (response?.data?.message) {
          toast.error(response.data.message)
        }

        return Promise.reject(error)
      }
    )
  }

  private logout() {
    localStorage.removeItem('fbot_token')
    localStorage.removeItem('fbot_refresh_token')
    localStorage.removeItem('fbot_user')
    window.location.href = '/login'
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/login', credentials)
    return response.data.data
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/refresh', {
      refreshToken,
    })
    return response.data.data
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  }

  async logout_api(): Promise<void> {
    await this.api.post('/auth/logout')
  }

  // Chat
  async sendMessage(request: SendMessageRequest): Promise<ChatMessage> {
    const response = await this.api.post<ApiResponse<ChatMessage>>('/chat/message', request)
    return response.data.data
  }

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await this.api.get<ApiResponse<ChatMessage[]>>(`/chat/history/${sessionId}`)
    return response.data.data
  }

  async createChatSession(request: CreateSessionRequest): Promise<ChatSession> {
    const response = await this.api.post<ApiResponse<ChatSession>>('/chat/sessions', request)
    return response.data.data
  }

  async getChatSessions(): Promise<ChatSession[]> {
    const response = await this.api.get<ApiResponse<ChatSession[]>>('/chat/sessions')
    return response.data.data
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await this.api.delete(`/chat/sessions/${sessionId}`)
  }

  async updateSessionTitle(sessionId: string, title: string): Promise<ChatSession> {
    const response = await this.api.patch<ApiResponse<ChatSession>>(`/chat/sessions/${sessionId}`, {
      title,
    })
    return response.data.data
  }

  // Ultrasound Analysis
  async uploadUltrasound(request: UltrasoundUploadRequest): Promise<UltrasoundAnalysis> {
    const formData = new FormData()
    formData.append('image', request.image)
    formData.append('bodyPart', request.bodyPart)
    if (request.patientId) formData.append('patientId', request.patientId)
    if (request.clinicalContext) formData.append('clinicalContext', request.clinicalContext)

    const response = await this.api.post<ApiResponse<UltrasoundAnalysis>>(
      '/ultrasound/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Extended timeout for image processing
      }
    )
    return response.data.data
  }

  async getUltrasoundAnalysis(analysisId: string): Promise<UltrasoundAnalysis> {
    const response = await this.api.get<ApiResponse<UltrasoundAnalysis>>(
      `/ultrasound/analysis/${analysisId}`
    )
    return response.data.data
  }

  async getUltrasoundHistory(): Promise<UltrasoundAnalysis[]> {
    const response = await this.api.get<ApiResponse<UltrasoundAnalysis[]>>('/ultrasound/history')
    return response.data.data
  }

  // Model Management
  async getAvailableModels(): Promise<AvailableModel[]> {
    const response = await this.api.get<ApiResponse<AvailableModel[]>>('/models/available')
    return response.data.data
  }

  async getModelPerformance(): Promise<ModelPerformance[]> {
    const response = await this.api.get<ApiResponse<ModelPerformance[]>>('/models/performance')
    return response.data.data
  }

  async getCostTracking(): Promise<CostTracking> {
    const response = await this.api.get<ApiResponse<CostTracking>>('/analytics/costs')
    return response.data.data
  }

  // Medical RAG
  async queryMedicalKnowledge(query: string, filters?: any): Promise<any> {
    const response = await this.api.post<ApiResponse<any>>('/rag/query', {
      query,
      filters,
    })
    return response.data.data
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.api.get<ApiResponse<{ status: string; timestamp: string }>>(
      '/health'
    )
    return response.data.data
  }

  // File Upload
  async uploadFile(file: File, type: 'document' | 'image'): Promise<{ url: string; id: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await this.api.post<ApiResponse<{ url: string; id: string }>>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data
  }

  // WebSocket connection for real-time features
  createWebSocketConnection(sessionId: string): WebSocket | null {
    try {
      const token = localStorage.getItem('fbot_token')
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
        window.location.host
      }/api/ws?sessionId=${sessionId}&token=${token}`
      
      return new WebSocket(wsUrl)
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      return null
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService 